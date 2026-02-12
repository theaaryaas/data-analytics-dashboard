from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import PlainTextResponse
import os
import time
from file_processor import FileProcessor
from data_store import DataStore
from simple_metrics import record_upload, record_error, get_metrics
from mongodb_service import mongo_service
from opensearch_service import opensearch
from postgres_service import postgres

os.makedirs("uploads", exist_ok=True)
app = FastAPI(title="Simple Data Analytics Dashboard", description="Upload and analyze CSV, Excel, and JSON files", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5176"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
data_store = DataStore()

ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json']
EXT_TO_TYPE = {'.csv': 'CSV', '.xlsx': 'Excel', '.xls': 'Excel', '.json': 'JSON'}

def process_uploaded_file(file: UploadFile, content: bytes):
    """Extract common file processing logic"""
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        record_error()
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    
    processors = {'.csv': FileProcessor.process_csv, '.xlsx': FileProcessor.process_excel, '.xls': FileProcessor.process_excel, '.json': FileProcessor.process_json}
    processed_data = processors[file_extension](content)
    return processed_data, EXT_TO_TYPE[file_extension]

@app.get("/")
def read_root():
    return {
        "message": "Data Analytics Dashboard API",
        "version": "1.0.0",
        "supported_formats": ["CSV", "Excel (.xlsx, .xls)", "JSON"]
    }

@app.post("/api/upload/")
async def upload_file(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        content = await file.read()
        processed_data, file_type = process_uploaded_file(file, content)
        file_id = data_store.save_file_info(file.filename, file_type, processed_data)
        with open(f"uploads/{file.filename}", "wb") as f:
            f.write(content)
        upload_duration = record_upload(start_time)
        return {"success": True, "file_id": file_id, "filename": file.filename, "file_type": file_type, "message": "File uploaded successfully", "data": processed_data, "upload_time": round(upload_duration, 2)}
    except HTTPException:
        raise
    except Exception as e:
        record_error()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/")
def get_all_files():
    try:
        files = data_store.get_all_files()
        return {"success": True, "count": len(files), "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{file_id}")
def get_file(file_id: int):
    try:
        file_data = data_store.get_file_by_id(file_id)
        if not file_data:
            raise HTTPException(status_code=404, detail="File not found")
        return {"success": True, "file": file_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/files/{file_id}")
def delete_file(file_id: int):
    try:
        print(f"Delete request received for file_id: {file_id} (type: {type(file_id)})")
        file_data = data_store.get_file_by_id(file_id)
        if not file_data:
            print(f"File with id {file_id} not found")
            raise HTTPException(status_code=404, detail="File not found")
        
        filename = file_data['filename']
        print(f"Deleting file: {filename} (id: {file_id})")
        
        # Delete from database
        deleted = data_store.delete_file(file_id)
        if not deleted:
            print(f"Failed to delete file {file_id} from database")
            raise HTTPException(status_code=500, detail="Failed to delete file from database")
        
        print(f"Successfully deleted file {file_id} from database")
        
        # Delete physical file if it exists
        file_path = f"uploads/{filename}"
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Deleted physical file: {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete physical file {file_path}: {e}")
        else:
            print(f"Physical file not found: {file_path}")
        
        return {"success": True, "message": f"File {filename} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analyze/{file_id}")
def analyze_file(file_id: int, analysis_type: str = Query("summary", regex="^(summary|correlation)$")):
    try:
        import pandas as pd
        file_data = data_store.get_file_by_id(file_id)
        if not file_data:
            raise HTTPException(status_code=404, detail="File not found")
        analysis_result = FileProcessor.analyze_data(pd.DataFrame(file_data['preview']), analysis_type)
        return {"success": True, "file_id": file_id, "analysis_type": analysis_type, "results": analysis_result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mongodb/upload/")
async def upload_to_mongodb(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        content = await file.read()
        processed_data, file_type = process_uploaded_file(file, content)
        mongo_id = mongo_service.save_uploaded_file(filename=file.filename, file_type=file_type, data=processed_data)
        sqlite_file_id = data_store.save_file_info(file.filename, file_type, processed_data)
        with open(f"uploads/{file.filename}", "wb") as f:
            f.write(content)
        upload_duration = record_upload(start_time)
        return {"success": True, "message": "File saved to MongoDB Docker, SQLite, and metrics recorded!", "mongo_id": mongo_id, "sqlite_file_id": sqlite_file_id, "filename": file.filename, "file_type": file_type, "data_preview": processed_data.get("preview", [])[:5], "upload_time": round(upload_duration, 2)}
    except HTTPException:
        raise
    except Exception as e:
        record_error()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mongodb/files/")
def get_mongodb_files():
    try:
        files = mongo_service.get_all_files()
        return {"success": True, "count": len(files), "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mongodb/search/")
def search_mongodb_files(q: str):
    try:
        files = mongo_service.search_files(q)
        return {"success": True, "query": q, "count": len(files), "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/")
def get_system_stats():
    files = data_store.get_all_files()
    file_types = {}
    for file in files:
        file_types[file['file_type']] = file_types.get(file['file_type'], 0) + 1
    return {"success": True, "stats": {"total_files": len(files), "file_types": file_types, "total_rows": sum(f.get('row_count', 0) for f in files), "total_columns": sum(len(f['columns']) for f in files)}}

@app.get("/metrics")
def metrics():
    return PlainTextResponse(get_metrics(), media_type="text/plain; version=0.0.4; charset=utf-8")

@app.post("/api/opensearch/upload/")
async def upload_to_opensearch(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        content = await file.read()
        processed_data, file_type = process_uploaded_file(file, content)
        search_id = None
        try:
            search_id = opensearch.index_file(filename=file.filename, file_type=file_type, data=processed_data)
        except Exception as e:
            print(f"⚠️ OpenSearch indexing failed (non-critical): {e}")
        upload_duration = record_upload(start_time)
        return {"success": True, "message": "File indexed in OpenSearch!", "search_id": search_id, "filename": file.filename, "file_type": file_type, "upload_time": round(upload_duration, 2)}
    except HTTPException:
        raise
    except Exception as e:
        record_error()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/opensearch/search/")
def search_opensearch(q: str):
    try:
        results = opensearch.search_files(q)
        return {"success": True, "query": q, "count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/opensearch/stats/")
def get_opensearch_stats():
    try:
        return {"success": True, "stats": opensearch.get_stats()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health/opensearch")
def check_opensearch():
    try:
        status = "healthy" if opensearch.client.ping() else "unhealthy"
        return {"status": status, "service": "OpenSearch", "message": "OpenSearch is running!" if status == "healthy" else "Cannot connect to OpenSearch"}
    except Exception as e:
        return {"status": "error", "service": "OpenSearch", "error": str(e)}

@app.post("/api/postgres/upload/")
async def upload_to_postgres(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        content = await file.read()
        processed_data, file_type = process_uploaded_file(file, content)
        file_id = postgres.save_file(filename=file.filename, file_type=file_type, data=processed_data)
        if not file_id:
            record_error()
            raise HTTPException(status_code=500, detail="Failed to save to PostgreSQL")
        upload_duration = record_upload(start_time)
        return {"success": True, "message": "File saved to PostgreSQL!", "file_id": file_id, "filename": file.filename, "file_type": file_type, "upload_time": round(upload_duration, 2)}
    except HTTPException:
        raise
    except Exception as e:
        record_error()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/postgres/files/")
def get_postgres_files():
    try:
        files = postgres.get_all_files()
        return {"success": True, "count": len(files), "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/postgres/search/")
def search_postgres_files(q: str):
    try:
        files = postgres.search_files(q)
        return {"success": True, "query": q, "count": len(files), "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/postgres/stats/")
def get_postgres_stats():
    try:
        return {"success": True, "stats": postgres.get_stats()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health/postgres")
def check_postgres():
    try:
        postgres.cursor.execute("SELECT 1")
        result = postgres.cursor.fetchone()
        status = "healthy" if result and result[0] == 1 else "unhealthy"
        return {"status": status, "service": "PostgreSQL", "message": "PostgreSQL is running!" if status == "healthy" else "Cannot query PostgreSQL"}
    except Exception as e:
        return {"status": "error", "service": "PostgreSQL", "error": str(e)}


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
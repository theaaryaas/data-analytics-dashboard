from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import PlainTextResponse
import os, time, pandas as pd
from file_processor import FileProcessor
from data_store import DataStore
from simple_metrics import record_upload, record_error, get_metrics
from mongodb_service import mongo_service
from opensearch_service import opensearch
from postgres_service import postgres

ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json']
EXT_TO_TYPE = {'.csv': 'CSV', '.xlsx': 'Excel', '.xls': 'Excel', '.json': 'JSON'}
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:4200", "http://localhost:5173", "http://localhost:5176"]
STORAGE_DIR = "uploads"
os.makedirs(STORAGE_DIR, exist_ok=True)

app = FastAPI(title="Simple Data Analytics Dashboard", description="Upload and analyze CSV, Excel, and JSON files", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
data_store = DataStore()

def process_uploaded_file(file: UploadFile, content: bytes):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        record_error()
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    processors = {'.csv': FileProcessor.process_csv, '.xlsx': FileProcessor.process_excel, '.xls': FileProcessor.process_excel, '.json': FileProcessor.process_json}
    return processors[ext](content), EXT_TO_TYPE[ext]

def save_physical_file(filename: str, content: bytes):
    with open(f"{STORAGE_DIR}/{filename}", "wb") as f:
        f.write(content)

def http_error(e): raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Data Analytics Dashboard API", "version": "1.0.0", "supported_formats": ["CSV", "Excel (.xlsx, .xls)", "JSON"]}

@app.post("/api/upload/")
async def upload_file(file: UploadFile = File(...)):
    start = time.time()
    try:
        content = await file.read()
        data, file_type = process_uploaded_file(file, content)
        file_id = data_store.save_file_info(file.filename, file_type, data)
        save_physical_file(file.filename, content)
        return {"success": True, "file_id": file_id, "filename": file.filename, "file_type": file_type,
                "message": "File uploaded successfully", "data": data, "upload_time": round(record_upload(start), 2)}
    except HTTPException: raise
    except Exception as e: record_error(); http_error(e)

@app.get("/api/files/")
def get_all_files():
    try: return {"success": True, "count": len(files := data_store.get_all_files()), "files": files}
    except Exception as e: http_error(e)

@app.get("/api/files/{file_id}")
def get_file(file_id: int):
    try:
        file_data = data_store.get_file_by_id(file_id)
        if not file_data: raise HTTPException(status_code=404, detail="File not found")
        return {"success": True, "file": file_data}
    except HTTPException: raise
    except Exception as e: http_error(e)

@app.delete("/api/files/{file_id}")
def delete_file(file_id: int):
    try:
        file_data = data_store.get_file_by_id(file_id)
        if not file_data: raise HTTPException(status_code=404, detail="File not found")
        if not data_store.delete_file(file_id): raise HTTPException(status_code=500, detail="Failed to delete file from database")
        file_path = f"{STORAGE_DIR}/{file_data['filename']}"
        if os.path.exists(file_path):
            try: os.remove(file_path)
            except Exception as e: print(f"Warning: Could not delete physical file {file_path}: {e}")
        return {"success": True, "message": f"File {file_data['filename']} deleted successfully"}
    except HTTPException: raise
    except Exception as e: http_error(e)

@app.get("/api/analyze/{file_id}")
def analyze_file(file_id: int, analysis_type: str = Query("summary", pattern="^(summary|correlation)$")):
    try:
        file_data = data_store.get_file_by_id(file_id)
        if not file_data: raise HTTPException(status_code=404, detail="File not found")
        return {"success": True, "file_id": file_id, "analysis_type": analysis_type,
                "results": FileProcessor.analyze_data(pd.DataFrame(file_data['preview']), analysis_type)}
    except HTTPException: raise
    except Exception as e: http_error(e)

@app.post("/api/mongodb/upload/")
async def upload_to_mongodb(file: UploadFile = File(...)):
    start = time.time()
    try:
        content = await file.read()
        data, file_type = process_uploaded_file(file, content)
        mongo_id = None
        try:
            mongo_id = mongo_service.save_uploaded_file(filename=file.filename, file_type=file_type, data=data)
        except Exception as e:
            print(f"[WARN] MongoDB upload failed: {e}")
        sqlite_id = data_store.save_file_info(file.filename, file_type, data, source='mongodb')
        save_physical_file(file.filename, content)
        return {"success": True, "message": "File saved to MongoDB!" if mongo_id else "File saved (MongoDB unavailable, saved to SQLite only)", "mongo_id": mongo_id, "sqlite_file_id": sqlite_id,
                "filename": file.filename, "file_type": file_type, "data_preview": data.get("preview", [])[:5], "upload_time": round(record_upload(start), 2)}
    except HTTPException: raise
    except Exception as e: record_error(); http_error(e)

@app.get("/api/mongodb/files/")
def get_mongodb_files():
    try:
        # Try to get files from MongoDB
        files = []
        try:
            files = mongo_service.get_all_files()
        except Exception as e:
            print(f"[WARN] MongoDB access error: {e}")
            files = []
        
        # If MongoDB returned no files, fallback to SQLite files with source='mongodb'
        if not files:
            try:
                sqlite_files = data_store.get_files_by_source('mongodb')
                # Convert SQLite format to match MongoDB format
                for f in sqlite_files:
                    files.append({
                        'id': f['id'],
                        '_id': str(f['id']),
                        'filename': f['filename'],
                        'file_type': f['file_type'],
                        'columns': f['columns'],
                        'row_count': f['row_count'],
                        'uploaded_at': f['uploaded_at'],
                        'preview_data': f.get('preview', []),
                        'preview': f.get('preview', []),
                        'stats': f.get('stats', {})
                    })
            except Exception as e:
                print(f"[WARN] SQLite fallback error: {e}")
        
        return {"success": True, "count": len(files), "files": files}
    except Exception as e: 
        print(f"[ERROR] get_mongodb_files error: {e}")
        import traceback
        traceback.print_exc()
        http_error(e)

@app.get("/api/mongodb/search/")
def search_mongodb_files(q: str):
    try: return {"success": True, "query": q, "count": len(files := mongo_service.search_files(q)), "files": files}
    except Exception as e: http_error(e)

@app.get("/api/stats/")
def get_system_stats():
    files = data_store.get_all_files()
    file_types = {}
    for f in files: file_types[f['file_type']] = file_types.get(f['file_type'], 0) + 1
    return {"success": True, "stats": {"total_files": len(files), "file_types": file_types,
            "total_rows": sum(f.get('row_count', 0) for f in files), "total_columns": sum(len(f['columns']) for f in files)}}

@app.get("/metrics")
def metrics(): return PlainTextResponse(get_metrics(), media_type="text/plain; version=0.0.4; charset=utf-8")

@app.post("/api/opensearch/upload/")
async def upload_to_opensearch(file: UploadFile = File(...)):
    start = time.time()
    try:
        content = await file.read()
        data, file_type = process_uploaded_file(file, content)
        search_id = None
        try: search_id = opensearch.index_file(filename=file.filename, file_type=file_type, data=data)
        except Exception as e: print(f"[WARN] OpenSearch indexing failed: {e}")
        sqlite_id = data_store.save_file_info(file.filename, file_type, data, source='opensearch')
        save_physical_file(file.filename, content)
        return {"success": True, "message": "File indexed in OpenSearch!", "search_id": search_id, "sqlite_file_id": sqlite_id,
                "filename": file.filename, "file_type": file_type, "preview": data.get("preview", [])[:10],
                "columns": data.get("columns", []), "row_count": data.get("row_count", 0), "upload_time": round(record_upload(start), 2)}
    except HTTPException: raise
    except Exception as e: record_error(); http_error(e)

@app.get("/api/opensearch/search/")
def search_opensearch(q: str):
    try: return {"success": True, "query": q, "count": len(results := opensearch.search_files(q)), "results": results}
    except Exception as e: http_error(e)

@app.get("/api/opensearch/stats/")
def get_opensearch_stats():
    try: return {"success": True, "stats": opensearch.get_stats()}
    except Exception as e: http_error(e)

@app.get("/health/opensearch")
def check_opensearch():
    try:
        status = "healthy" if opensearch.client.ping() else "unhealthy"
        return {"status": status, "service": "OpenSearch", "message": f"OpenSearch is {'running!' if status == 'healthy' else 'unreachable'}"}
    except Exception as e: return {"status": "error", "service": "OpenSearch", "error": str(e)}

@app.post("/api/postgres/upload/")
async def upload_to_postgres(file: UploadFile = File(...)):
    start = time.time()
    try:
        content = await file.read()
        data, file_type = process_uploaded_file(file, content)
        file_id = None
        try:
            file_id = postgres.save_file(filename=file.filename, file_type=file_type, data=data)
        except Exception as e:
            print(f"[WARN] PostgreSQL upload failed: {e}")
        sqlite_id = data_store.save_file_info(file.filename, file_type, data, source='postgresql')
        save_physical_file(file.filename, content)
        if not file_id:
            return {"success": True, "message": "File saved (PostgreSQL unavailable, saved to SQLite only)", "file_id": None, "sqlite_file_id": sqlite_id,
                    "filename": file.filename, "file_type": file_type, "preview": data.get("preview", [])[:10],
                    "columns": data.get("columns", []), "row_count": data.get("row_count", 0), "upload_time": round(record_upload(start), 2)}
        return {"success": True, "message": "File saved to PostgreSQL!", "file_id": file_id, "sqlite_file_id": sqlite_id,
                "filename": file.filename, "file_type": file_type, "preview": data.get("preview", [])[:10],
                "columns": data.get("columns", []), "row_count": data.get("row_count", 0), "upload_time": round(record_upload(start), 2)}
    except HTTPException: raise
    except Exception as e: record_error(); http_error(e)

@app.get("/api/postgres/files/")
def get_postgres_files():
    try: return {"success": True, "count": len(files := postgres.get_all_files()), "files": files}
    except Exception as e: http_error(e)

@app.get("/api/postgres/search/")
def search_postgres_files(q: str):
    try: return {"success": True, "query": q, "count": len(files := postgres.search_files(q)), "files": files}
    except Exception as e: http_error(e)

@app.get("/api/postgres/stats/")
def get_postgres_stats():
    try: return {"success": True, "stats": postgres.get_stats()}
    except Exception as e: http_error(e)

@app.get("/health/postgres")
def check_postgres():
    try:
        postgres.cursor.execute("SELECT 1")
        status = "healthy" if postgres.cursor.fetchone()[0] == 1 else "unhealthy"
        return {"status": status, "service": "PostgreSQL", "message": f"PostgreSQL is {'running!' if status == 'healthy' else 'unreachable'}"}
    except Exception as e: return {"status": "error", "service": "PostgreSQL", "error": str(e)}

app.mount("/uploads", StaticFiles(directory=STORAGE_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
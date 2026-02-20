from pymongo import MongoClient
from datetime import datetime

class MongoDBService:
    def __init__(self):
        self._client = self._collection = None
        self._connected = False

    @property
    def collection(self):
        if self._collection is None:
            try:
                self._client = MongoClient("mongodb://mongodb:27017/", serverSelectionTimeoutMS=2000)
                self._client.server_info()  # Test connection
                self._collection = self._client["analytics_db"]["files"]
                self._connected = True
                print("[OK] Connected to MongoDB (analytics_db.files)")
            except Exception as e:
                print(f"[WARN] MongoDB not available: {e}")
                self._connected = False
                self._collection = None
        return self._collection

    def _fix_ids(self, files):
        return [{**f, "_id": str(f["_id"])} for f in files]

    def save_uploaded_file(self, filename: str, file_type: str, data: dict) -> str:
        if not self.collection:
            raise Exception("MongoDB not available")
        result = self.collection.insert_one({
            "filename": filename, "file_type": file_type, "uploaded_at": datetime.now(),
            "columns": data.get("columns", []), "row_count": data.get("row_count", 0),
            "preview_data": data.get("preview", [])[:10], "stats": data.get("stats", {})
        })
        return str(result.inserted_id)

    def get_all_files(self):
        return self._fix_ids(list(self.collection.find().sort("uploaded_at", -1))) if self.collection else []

    def search_files(self, keyword: str):
        if not self.collection: return []
        q = {"$or": [{"filename": {"$regex": keyword, "$options": "i"}}, {"columns": {"$regex": keyword, "$options": "i"}}]}
        return self._fix_ids(list(self.collection.find(q)))

mongo_service = MongoDBService()
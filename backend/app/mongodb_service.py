from pymongo import MongoClient
from datetime import datetime


class MongoDBService:
    """
    Very simple helper to talk to MongoDB.

    This is meant to be used when the app runs in Docker.
    The connection string points to the `mongodb` service name from docker-compose.
    """

    def __init__(self):
        # This URL works inside Docker because the MongoDB service is called "mongodb"
        self.client = MongoClient("mongodb://mongodb:27017/")
        self.db = self.client["analytics_db"]
        self.files_collection = self.db["files"]

        print("✅ Connected to MongoDB (analytics_db.files)")

    def save_uploaded_file(self, filename: str, file_type: str, data: dict) -> str:
        """Save uploaded file info to MongoDB."""
        result = self.files_collection.insert_one({
            "filename": filename, "file_type": file_type, "uploaded_at": datetime.now(),
            "columns": data.get("columns", []), "row_count": data.get("row_count", 0),
            "preview_data": data.get("preview", [])[:10], "stats": data.get("stats", {})
        })
        return str(result.inserted_id)

    def _convert_ids(self, files):
        """Helper to convert ObjectId to string"""
        for file in files:
            file["_id"] = str(file["_id"])
        return files

    def get_all_files(self):
        """Return all uploaded files from MongoDB."""
        return self._convert_ids(list(self.files_collection.find().sort("uploaded_at", -1)))

    def search_files(self, keyword: str):
        """Simple search by filename or columns."""
        query = {"$or": [{"filename": {"$regex": keyword, "$options": "i"}}, {"columns": {"$regex": keyword, "$options": "i"}}]}
        return self._convert_ids(list(self.files_collection.find(query)))


# Single shared instance
mongo_service = MongoDBService()


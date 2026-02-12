import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any

class DataStore:
    """Simple SQLite storage for file metadata"""
    
    def __init__(self):
        self.conn = sqlite3.connect('data_files.db', check_same_thread=False)
        self._create_table()
    
    def _create_table(self):
        """Create files table if not exists"""
        cursor = self.conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            columns TEXT NOT NULL,
            row_count INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_preview TEXT,
            stats TEXT
        )
        ''')
        self.conn.commit()
    
    def save_file_info(self, filename: str, file_type: str, data: Dict[str, Any]) -> int:
        """Save file metadata to database"""
        cursor = self.conn.cursor()
        # Use current local time instead of SQLite's UTC timestamp
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
        INSERT INTO uploaded_files (filename, file_type, columns, row_count, uploaded_at, data_preview, stats)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            filename,
            file_type,
            json.dumps(data['columns']),
            data['row_count'],
            current_time,
            json.dumps(data['preview']),
            json.dumps(data['stats'])
        ))
        self.conn.commit()
        return cursor.lastrowid
    
    def _row_to_dict(self, row):
        """Convert database row to dictionary"""
        # Format timestamp properly for frontend
        uploaded_at = row[5]
        if uploaded_at and isinstance(uploaded_at, str):
            # SQLite returns timestamp as string, ensure it's in ISO format
            try:
                # If it's already in a parseable format, convert to ISO
                dt = datetime.strptime(uploaded_at, '%Y-%m-%d %H:%M:%S')
                uploaded_at = dt.isoformat()
            except (ValueError, TypeError):
                # If parsing fails, keep original
                pass
        
        return {
            'id': row[0], 'filename': row[1], 'file_type': row[2],
            'columns': json.loads(row[3]), 'row_count': row[4],
            'uploaded_at': uploaded_at, 'preview': json.loads(row[6]),
            'stats': json.loads(row[7])
        }

    def get_all_files(self) -> List[Dict[str, Any]]:
        """Get all uploaded files"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM uploaded_files ORDER BY uploaded_at DESC')
        return [self._row_to_dict(row) for row in cursor.fetchall()]
    
    def get_file_by_id(self, file_id: int) -> Dict[str, Any]:
        """Get specific file by ID"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM uploaded_files WHERE id = ?', (file_id,))
        row = cursor.fetchone()
        return self._row_to_dict(row) if row else None
    
    def delete_file(self, file_id: int) -> bool:
        """Delete file by ID and return True if successful"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT filename FROM uploaded_files WHERE id = ?', (file_id,))
        row = cursor.fetchone()
        if not row:
            return False
        filename = row[0]
        cursor.execute('DELETE FROM uploaded_files WHERE id = ?', (file_id,))
        self.conn.commit()
        return True
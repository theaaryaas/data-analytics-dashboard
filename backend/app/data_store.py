import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any
import os

class DataStore:
    """Simple SQLite storage for file metadata"""

    def __init__(self):
        self.conn = sqlite3.connect(
            os.path.join(os.path.dirname(__file__), 'data_files.db'),
            check_same_thread=False
        )
        self._create_table()

    def _create_table(self):
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL, file_type TEXT NOT NULL,
                columns TEXT NOT NULL, row_count INTEGER,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_preview TEXT, stats TEXT, source TEXT DEFAULT 'sqlite'
            )
        ''')
        try:
            self.conn.execute("ALTER TABLE uploaded_files ADD COLUMN source TEXT DEFAULT 'sqlite'")
        except sqlite3.OperationalError:
            pass
        self.conn.commit()

    def save_file_info(self, filename: str, file_type: str, data: Dict[str, Any], source: str = 'sqlite') -> int:
        cursor = self.conn.execute(
            'INSERT INTO uploaded_files (filename, file_type, columns, row_count, uploaded_at, data_preview, stats, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (filename, file_type, json.dumps(data['columns']), data['row_count'],
             datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
             json.dumps(data['preview']), json.dumps(data['stats']), source)
        )
        self.conn.commit()
        return cursor.lastrowid

    def _row_to_dict(self, row) -> Dict[str, Any]:
        uploaded_at = row[5]
        if isinstance(uploaded_at, str):
            try: uploaded_at = datetime.strptime(uploaded_at, '%Y-%m-%d %H:%M:%S').isoformat()
            except (ValueError, TypeError): pass
        return {'id': row[0], 'filename': row[1], 'file_type': row[2], 'columns': json.loads(row[3]), 'row_count': row[4], 'uploaded_at': uploaded_at, 'preview': json.loads(row[6]), 'stats': json.loads(row[7]) if len(row) > 7 and row[7] else {}, 'source': row[8] if len(row) > 8 else 'sqlite'}

    def get_all_files(self) -> List[Dict[str, Any]]:
        return [self._row_to_dict(r) for r in self.conn.execute('SELECT * FROM uploaded_files ORDER BY uploaded_at DESC')]

    def get_files_by_source(self, source: str) -> List[Dict[str, Any]]:
        return [self._row_to_dict(r) for r in self.conn.execute('SELECT * FROM uploaded_files WHERE source = ? ORDER BY uploaded_at DESC', (source,))]

    def get_file_by_id(self, file_id: int) -> Dict[str, Any]:
        row = self.conn.execute('SELECT * FROM uploaded_files WHERE id = ?', (file_id,)).fetchone()
        return self._row_to_dict(row) if row else None

    def delete_file(self, file_id: int) -> bool:
        if not self.conn.execute('SELECT 1 FROM uploaded_files WHERE id = ?', (file_id,)).fetchone(): return False
        self.conn.execute('DELETE FROM uploaded_files WHERE id = ?', (file_id,))
        self.conn.commit()
        return True
from datetime import datetime
import json

class PostgresService:
    def __init__(self):
        self._conn = self._cursor = None
        self._initialized = False

    @property
    def conn(self):
        if self._conn is None:
            try:
                import psycopg2
                self._conn = psycopg2.connect(host="postgres", database="analytics_db",
                    user="admin", password="password123", port="5432", connect_timeout=2)
                self._cursor = self._conn.cursor()
                if not self._initialized:
                    self._create_table()
                    self._initialized = True
                    print("[OK] Connected to PostgreSQL!")
            except ImportError:
                print("[WARN] psycopg2 not installed")
                self._conn = None
            except Exception as e:
                print(f"[WARN] PostgreSQL connection error: {e}")
                self._conn = None
        if self._conn is None:
            raise Exception("PostgreSQL not available")
        return self._conn

    @property
    def cursor(self):
        if self._cursor is None: _ = self.conn
        return self._cursor

    def _create_table(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id SERIAL PRIMARY KEY, filename VARCHAR(255) NOT NULL,
                file_type VARCHAR(50) NOT NULL, columns TEXT,
                row_count INTEGER, uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.cursor.execute("ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS preview_data JSONB")
        self.conn.commit()

    def _row_to_dict(self, row):
        preview = json.loads(row[6]) if isinstance(row[6], str) else (row[6] or [])
        return {'id': row[0], 'filename': row[1], 'file_type': row[2],
                'columns': row[3].split(',') if row[3] else [],
                'row_count': row[4], 'uploaded_at': row[5], 'preview_data': preview}

    def _query(self, sql, params=()):
        try: self.cursor.execute(sql, params); return [self._row_to_dict(r) for r in self.cursor.fetchall()]
        except Exception as e: print(f"[ERROR] PostgreSQL error: {e}"); return []

    def save_file(self, filename, file_type, data):
        try:
            preview = data.get('preview', [])[:10]
            self.cursor.execute(
                "INSERT INTO uploaded_files (filename, file_type, columns, row_count, uploaded_at, preview_data) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (filename, file_type, ",".join(data.get('columns', [])), data.get('row_count', 0),
                 datetime.now(), json.dumps(preview) or None))
            file_id = self.cursor.fetchone()[0]
            self.conn.commit()
            print(f"[OK] Saved {filename} to PostgreSQL (ID: {file_id})")
            return file_id
        except Exception as e:
            print(f"[ERROR] PostgreSQL error: {e}"); self.conn.rollback(); return None

    def get_all_files(self):
        return self._query("SELECT id, filename, file_type, columns, row_count, uploaded_at, preview_data FROM uploaded_files ORDER BY uploaded_at DESC")

    def search_files(self, keyword):
        p = f"%{keyword}%"
        return self._query("SELECT id, filename, file_type, columns, row_count, uploaded_at, preview_data FROM uploaded_files WHERE filename ILIKE %s OR file_type ILIKE %s OR columns ILIKE %s ORDER BY uploaded_at DESC", (p, p, p))

    def get_stats(self):
        try:
            self.cursor.execute("SELECT COUNT(*) FROM uploaded_files")
            total = self.cursor.fetchone()[0]
            self.cursor.execute("SELECT file_type, COUNT(*) FROM uploaded_files GROUP BY file_type")
            return {"total_files": total, "by_type": {r[0]: r[1] for r in self.cursor.fetchall()}}
        except Exception as e: print(f"[ERROR] PostgreSQL error: {e}"); return {"total_files": 0, "by_type": {}}

postgres = PostgresService()
from datetime import datetime
import json

class PostgresService:
    """Super simple PostgreSQL connector"""
    
    def __init__(self):
        self._conn = None
        self._cursor = None
        self._initialized = False
    
    @property
    def conn(self):
        """Lazy connection - only connect when needed"""
        if self._conn is None:
            try:
                import psycopg2
                # Connect to PostgreSQL in Docker
                self._conn = psycopg2.connect(
                    host="postgres",
                    database="analytics_db",
                    user="admin",
                    password="password123",
                    port="5432"
                )
                self._cursor = self._conn.cursor()
                
                if not self._initialized:
                    self._create_table()
                    self._initialized = True
                    print("✅ Connected to PostgreSQL!")
            except ImportError:
                print("⚠️ psycopg2 not installed - PostgreSQL features disabled")
                raise
            except Exception as e:
                print(f"⚠️ PostgreSQL connection error: {e}")
                raise
        return self._conn
    
    @property
    def cursor(self):
        """Get cursor (creates connection if needed)"""
        if self._cursor is None:
            _ = self.conn  # Trigger connection
        return self._cursor
    
    def _create_table(self):
        """Create simple table for files"""
        # First, create table without preview_data
        create_table_query = """
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            columns TEXT,
            row_count INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        self.cursor.execute(create_table_query)
        self.conn.commit()
        
        # Add preview_data column if it doesn't exist (for existing databases)
        try:
            alter_query = """
            ALTER TABLE uploaded_files 
            ADD COLUMN IF NOT EXISTS preview_data JSONB
            """
            self.cursor.execute(alter_query)
            self.conn.commit()
        except Exception as e:
            # Column might already exist, that's okay
            print(f"Note: preview_data column check: {e}")
            pass
    
    def save_file(self, filename, file_type, data):
        """Save file info to PostgreSQL"""
        try:
            preview_data = data.get('preview', [])[:10]
            # Use Python's local datetime instead of PostgreSQL's CURRENT_TIMESTAMP
            current_time = datetime.now()
            self.cursor.execute("INSERT INTO uploaded_files (filename, file_type, columns, row_count, uploaded_at, preview_data) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (filename, file_type, ",".join(data.get('columns', [])), data.get('row_count', 0), current_time, json.dumps(preview_data) if preview_data else None))
            file_id = self.cursor.fetchone()[0]
            self.conn.commit()
            print(f"✅ Saved {filename} to PostgreSQL (ID: {file_id})")
            return file_id
        except Exception as e:
            print(f"❌ PostgreSQL error: {e}")
            self.conn.rollback()
            return None
    
    def _parse_preview_data(self, preview_data):
        """Helper to parse preview_data from JSONB"""
        if not preview_data:
            return []
        return json.loads(preview_data) if isinstance(preview_data, str) else preview_data

    def _row_to_dict(self, row):
        """Convert database row to dictionary"""
        return {
            'id': row[0], 'filename': row[1], 'file_type': row[2],
            'columns': row[3].split(',') if row[3] else [],
            'row_count': row[4], 'uploaded_at': row[5],
            'preview_data': self._parse_preview_data(row[6])
        }

    def get_all_files(self):
        """Get all files from PostgreSQL"""
        try:
            self.cursor.execute("SELECT id, filename, file_type, columns, row_count, uploaded_at, preview_data FROM uploaded_files ORDER BY uploaded_at DESC")
            return [self._row_to_dict(row) for row in self.cursor.fetchall()]
        except Exception as e:
            print(f"❌ PostgreSQL error: {e}")
            return []
    
    def search_files(self, keyword):
        """Search files by keyword"""
        try:
            pattern = f"%{keyword}%"
            self.cursor.execute("SELECT id, filename, file_type, columns, row_count, uploaded_at, preview_data FROM uploaded_files WHERE filename ILIKE %s OR file_type ILIKE %s OR columns ILIKE %s ORDER BY uploaded_at DESC", (pattern, pattern, pattern))
            return [self._row_to_dict(row) for row in self.cursor.fetchall()]
        except Exception as e:
            print(f"❌ PostgreSQL error: {e}")
            return []
    
    def get_stats(self):
        """Get PostgreSQL statistics"""
        try:
            self.cursor.execute("SELECT COUNT(*) FROM uploaded_files")
            total_files = self.cursor.fetchone()[0]
            self.cursor.execute("SELECT file_type, COUNT(*) FROM uploaded_files GROUP BY file_type")
            return {"total_files": total_files, "by_type": {row[0]: row[1] for row in self.cursor.fetchall()}}
        except Exception as e:
            print(f"❌ PostgreSQL error: {e}")
            return {"total_files": 0, "by_type": {}}

# Create one instance
postgres = PostgresService()

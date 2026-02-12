from opensearchpy import OpenSearch
from datetime import datetime

class OpenSearchService:
    """Super simple OpenSearch connector for beginners"""
    
    def __init__(self):
        self._client = None
        self._initialized = False
    
    @property
    def client(self):
        """Lazy connection - only connect when needed"""
        if self._client is None:
            try:
                # Connect to OpenSearch in Docker
                self._client = OpenSearch(
                    hosts=['http://opensearch:9200'],  # Docker service name
                    use_ssl=False,     # No SSL for local development
                    verify_certs=False # Don't verify certificates
                )
                # Test connection
                if self._client.ping():
                    print("✅ Connected to OpenSearch!")
                    if not self._initialized:
                        self._create_index()
                        self._initialized = True
                else:
                    print("⚠️ OpenSearch not ready yet")
            except Exception as e:
                print(f"⚠️ OpenSearch connection error: {e}")
                raise
        return self._client
    
    def _create_index(self):
        """Create simple index for files"""
        index_name = "files"
        
        # Check if index exists
        if not self.client.indices.exists(index=index_name):
            # Create simple index
            index_body = {
                "settings": {
                    "index": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    }
                },
                "mappings": {
                    "properties": {
                        "filename": {"type": "text"},
                        "file_type": {"type": "keyword"},
                        "columns": {"type": "keyword"},
                        "content": {"type": "text"},
                        "uploaded_at": {"type": "date"}
                    }
                }
            }
            
            self.client.indices.create(index=index_name, body=index_body)
            print(f"✅ Created OpenSearch index: {index_name}")
    
    def index_file(self, filename, file_type, data):
        """Add file to OpenSearch for searching"""
        try:
            content_text = " ".join(" ".join(str(v) for v in row.values()) for row in data.get('preview', [])[:5])
            response = self.client.index(index='files', body={
                'filename': filename, 'file_type': file_type, 'columns': data.get('columns', []),
                'content': content_text, 'uploaded_at': datetime.now()
            }, refresh=True)
            print(f"✅ Indexed {filename} in OpenSearch (ID: {response['_id']})")
            return response['_id']
        except Exception as e:
            print(f"❌ Error indexing in OpenSearch: {e}")
            return None
    
    def search_files(self, query):
        """Search files by keyword"""
        try:
            response = self.client.search(index='files', body={
                "query": {"multi_match": {"query": query, "fields": ["filename^3", "content", "columns"], "fuzziness": "AUTO"}}
            }, size=50)
            return [{**hit['_source'], 'score': hit['_score'], 'id': hit['_id']} for hit in response['hits']['hits']]
        except Exception as e:
            print(f"❌ Search error: {e}")
            return []
    
    def get_stats(self):
        """Get OpenSearch statistics"""
        try:
            stats = self.client.indices.stats(index='files')
            count = self.client.count(index='files')
            return {"indexed_files": count['count'], "total_size_bytes": stats['_all']['total']['store']['size_in_bytes']}
        except Exception as e:
            return {"error": str(e)}

# Create one instance (lazy connection)
opensearch = OpenSearchService()

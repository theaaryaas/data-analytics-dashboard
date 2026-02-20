from opensearchpy import OpenSearch
from datetime import datetime

INDEX = "files"
INDEX_BODY = {
    "settings": {"index": {"number_of_shards": 1, "number_of_replicas": 0}},
    "mappings": {"properties": {
        "filename": {"type": "text"}, "file_type": {"type": "keyword"},
        "columns": {"type": "keyword"}, "content": {"type": "text"},
        "uploaded_at": {"type": "date"}
    }}
}

class OpenSearchService:
    def __init__(self):
        self._client = None
        self._initialized = False

    @property
    def client(self):
        if self._client is None:
            try:
                self._client = OpenSearch(hosts=['http://opensearch:9200'], use_ssl=False, verify_certs=False, timeout=2)
                if self._client.ping():
                    print("[OK] Connected to OpenSearch!")
                    if not self._initialized:
                        if not self._client.indices.exists(index=INDEX):
                            self._client.indices.create(index=INDEX, body=INDEX_BODY)
                            print(f"[OK] Created OpenSearch index: {INDEX}")
                        self._initialized = True
                else:
                    print("[WARN] OpenSearch not ready yet")
                    self._client = None
            except Exception as e:
                print(f"[WARN] OpenSearch connection error: {e}")
                self._client = None
        if self._client is None:
            raise Exception("OpenSearch not available")
        return self._client

    def index_file(self, filename, file_type, data):
        try:
            content = " ".join(" ".join(str(v) for v in row.values()) for row in data.get('preview', [])[:5])
            r = self.client.index(index=INDEX, body={'filename': filename, 'file_type': file_type, 'columns': data.get('columns', []), 'content': content, 'uploaded_at': datetime.now()}, refresh=True)
            print(f"[OK] Indexed {filename} in OpenSearch (ID: {r['_id']})")
            return r['_id']
        except Exception as e: print(f"[ERROR] {e}"); return None

    def search_files(self, query):
        try:
            r = self.client.search(index=INDEX, size=50, body={"query": {"multi_match": {"query": query, "fields": ["filename^3", "content", "columns"], "fuzziness": "AUTO"}}})
            return [{**hit['_source'], 'score': hit['_score'], 'id': hit['_id']} for hit in r['hits']['hits']]
        except Exception as e: print(f"[ERROR] {e}"); return []

    def get_stats(self):
        try: return {"indexed_files": self.client.count(index=INDEX)['count'], "total_size_bytes": self.client.indices.stats(index=INDEX)['_all']['total']['store']['size_in_bytes']}
        except Exception as e: return {"error": str(e)}

opensearch = OpenSearchService()
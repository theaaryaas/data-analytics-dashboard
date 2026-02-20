import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileInfo {
  id: number; filename: string; file_type: string;
  columns?: string[]; row_count?: number; uploaded_at?: string;
  preview?: any[]; stats?: any; source?: string;
}

export interface SystemStats {
  total_files: number; total_rows: number; total_columns: number;
  file_types: { [key: string]: number };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  private upload(path: string, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.base}${path}`, fd);
  }

  private get<T>(path: string) { return this.http.get<T>(`${this.base}${path}`); }
  private search(path: string, q: string) { return this.get(`${path}?q=${encodeURIComponent(q)}`); }

  uploadFile(f: File)         { return this.upload('/api/upload/', f); }
  uploadToMongoDB(f: File)    { return this.upload('/api/mongodb/upload/', f); }
  uploadToOpenSearch(f: File) { return this.upload('/api/opensearch/upload/', f); }
  uploadToPostgres(f: File)   { return this.upload('/api/postgres/upload/', f); }

  getAllFiles()    { return this.get<{ success: boolean; files: FileInfo[] }>('/api/files/'); }
  getFileById(id: number) { return this.get<{ success: boolean; file: FileInfo }>(`/api/files/${id}`); }
  deleteFile(id: number)  { return this.http.delete(`${this.base}/api/files/${id}`); }

  getMongoDBFiles()   { return this.get<{ success: boolean; files: FileInfo[] }>('/api/mongodb/files/'); }
  getPostgresFiles()  { return this.get<{ success: boolean; files: FileInfo[] }>('/api/postgres/files/'); }
  getSystemStats()    { return this.get<{ success: boolean; stats: SystemStats }>('/api/stats/'); }
  getOpenSearchStats(){ return this.get('/api/opensearch/stats/'); }
  getPostgresStats()  { return this.get('/api/postgres/stats/'); }

  searchMongoDB(q: string)    { return this.search('/api/mongodb/search/', q); }
  searchOpenSearch(q: string) { return this.search('/api/opensearch/search/', q); }
  searchPostgres(q: string)   { return this.search('/api/postgres/search/', q); }

  getMetrics() { return this.http.get(`${this.base}/metrics`, { responseType: 'text' }); }
}
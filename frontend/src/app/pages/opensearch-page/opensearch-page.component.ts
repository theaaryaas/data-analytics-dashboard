import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { ChartRendererComponent } from '../../components/chart-renderer/chart-renderer.component';
import { ApiService, FileInfo } from '../../services/api.service';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = { CSV: { bg: '#E8F5E9', text: '#81C784' }, JSON: { bg: '#FFF3E0', text: '#FFB74D' }, EXCEL: { bg: '#E3F2FD', text: '#64B5F6' }, XLS: { bg: '#E3F2FD', text: '#64B5F6' } };
const DEFAULT_COLOR = { bg: '#F5F5F5', text: '#9E9E9E' };
const CARD_STYLE = 'border-radius:12px;border:1px solid rgba(255,179,167,.3);background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,248,245,.7));backdrop-filter:blur(10px)';

@Component({
  selector: 'app-opensearch-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatInputModule, MatButtonModule, MatIconModule, MatPaginatorModule, FormsModule, FileUploadComponent, DataTableComponent, ChartRendererComponent],
  template: `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h2 style="margin:0;display:flex;align-items:center;gap:8px"><mat-icon>search</mat-icon> OpenSearch</h2>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:linear-gradient(135deg,#FFF8F5,#FFE8E0);border-radius:8px;border:1px solid rgba(255,179,167,.3)">
          <mat-icon style="color:#FF8A65;font-size:20px;height:20px;width:20px">description</mat-icon>
          <span style="font-weight:600;color:#FF7043;font-size:14px">{{ files.length }} {{ files.length === 1 ? 'file' : 'files' }}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;align-items:start">
        <app-file-upload [targetDatabase]="'opensearch'" (onUploadSuccess)="handleUploadSuccess($event)"></app-file-upload>
        <div>
          <mat-card [style]="CARD_STYLE" style="margin-bottom:24px">
            <mat-card-header><mat-card-title style="color:#4A5568;font-weight:600">Search</mat-card-title></mat-card-header>
            <mat-card-content>
              <div style="display:flex;flex-direction:column;gap:12px">
                <input matInput [(ngModel)]="searchQuery" placeholder="Search..." style="width:100%;padding:12px;border:1px solid rgba(255,179,167,.3);border-radius:8px;font-size:14px">
                <button mat-raised-button (click)="search()" style="background:#FF8A65;color:white;width:100%"><mat-icon>search</mat-icon> Search</button>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card *ngIf="searchPerformed" [style]="CARD_STYLE">
            <mat-card-header>
              <mat-card-title style="color:#4A5568;font-weight:600">
                Search Results
                <span *ngIf="searchResults.length" style="font-size:14px;font-weight:500;color:#FF7043;margin-left:8px">({{ searchResults.length }} {{ searchResults.length === 1 ? 'result' : 'results' }})</span>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="searchLoading" style="text-align:center;padding:40px"><p>Searching...</p></div>
              <div *ngIf="!searchLoading && !searchResults.length" style="text-align:center;padding:40px">
                <p style="color:rgba(0,0,0,.45)">No results found for "{{ searchQuery }}"</p>
              </div>
              <div *ngIf="!searchLoading && searchResults.length" style="max-height:500px;overflow-y:auto">
                <div *ngFor="let r of searchResults" style="margin-bottom:16px;padding:16px;border:1px solid rgba(255,179,167,.3);border-radius:8px;background:linear-gradient(135deg,#FFF,#FFF8F5)">
                  <div style="display:flex;align-items:start;gap:12px">
                    <mat-icon style="color:#FF8A65;font-size:24px;height:24px;width:24px;margin-top:4px">description</mat-icon>
                    <div style="flex:1">
                      <h4 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#4A5568">{{ r.filename || r._source?.filename || 'Unknown File' }}</h4>
                      <p *ngIf="r._source" style="margin:4px 0;font-size:13px;color:#7F8C8D">
                        <span *ngIf="r._source.file_type" style="margin-right:12px">Type: <strong>{{ r._source.file_type }}</strong></span>
                        <span *ngIf="r._source.row_count !== undefined">Rows: <strong>{{ r._source.row_count }}</strong></span>
                      </p>
                      <div *ngIf="r.highlight" style="margin-top:8px">
                        <p style="font-size:12px;color:#666;margin:4px 0">Matches:</p>
                        <div *ngFor="let f of highlightFields(r.highlight)" style="margin:4px 0;padding:8px;background:rgba(255,204,188,.2);border-radius:4px;font-size:12px">
                          <strong>{{ f.key }}:</strong><span [innerHTML]="f.value"></span>
                        </div>
                      </div>
                      <span *ngIf="r._score" style="font-size:12px;color:#FF7043;font-weight:500;margin-top:8px;display:block">Relevance Score: {{ r._score.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <mat-card *ngIf="files.length" [style]="CARD_STYLE" style="margin-top:24px">
        <mat-card-header><mat-card-title style="color:#4A5568;font-weight:600">Files in OpenSearch ({{ files.length }})</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="paginatedFiles" class="files-table">
            <ng-container matColumnDef="filename">
              <th mat-header-cell *matHeaderCellDef>Filename</th>
              <td mat-cell *matCellDef="let f">{{ f.filename }}</td>
            </ng-container>
            <ng-container matColumnDef="file_type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let f">
                <span [style.background]="typeColor(f.file_type).bg" [style.color]="typeColor(f.file_type).text" style="padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500">{{ f.file_type }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="columns">
              <th mat-header-cell *matHeaderCellDef>Columns</th>
              <td mat-cell *matCellDef="let f">{{ f.columns?.length || 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="row_count">
              <th mat-header-cell *matHeaderCellDef>Rows</th>
              <td mat-cell *matCellDef="let f">{{ f.row_count || 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let f">
                <button mat-raised-button (click)="previewFile(f)" style="background:#FF8A65;color:white">Preview & Visualize</button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
          <mat-paginator [length]="files.length" [pageSize]="pageSize" [pageIndex]="pageIndex"
            [pageSizeOptions]="[10]" (page)="onPageChange($event)" style="background:transparent">
          </mat-paginator>
        </mat-card-content>
      </mat-card>

      <div *ngIf="selectedFile" style="margin-top:24px;display:grid;grid-template-columns:45% 55%;gap:20px;box-sizing:border-box">
        <app-data-table [data]="selectedFile.preview||[]" [columns]="tableColumns"></app-data-table>
        <app-chart-renderer [data]="selectedFile.preview||[]" [columns]="selectedFile.columns||[]"></app-chart-renderer>
      </div>
    </div>`,
  styles: [`
    .files-table { width:100%; }
    ::ng-deep .files-table .mat-mdc-header-cell { background:linear-gradient(135deg,rgba(255,204,188,.3),rgba(255,230,220,.3)); color:#4A5568; font-weight:600; border-bottom:2px solid rgba(255,138,101,.3); }
    ::ng-deep .files-table .mat-mdc-cell { border-bottom:1px solid rgba(255,179,167,.2); color:#4A5568; }
    ::ng-deep .files-table .mat-mdc-row:hover { background:rgba(255,204,188,.1); }
  `]
})
export class OpenSearchPageComponent implements OnInit {
  searchQuery = ''; files: FileInfo[] = []; selectedFile: FileInfo | null = null;
  searchResults: any[] = []; searchLoading = false; searchPerformed = false;
  cols = ['filename', 'file_type', 'columns', 'row_count', 'actions'];
  pageSize = 10; pageIndex = 0;
  readonly CARD_STYLE = CARD_STYLE;

  constructor(private apiService: ApiService) {}
  ngOnInit() { this.fetchFiles(); }

  fetchFiles() {
    this.apiService.getAllFiles().subscribe({
      next: r => {
        this.files = (r.files || []).filter((f: any) => f.source === 'opensearch').map((f: any) => ({ id: f.id, filename: f.filename, file_type: f.file_type, columns: Array.isArray(f.columns) ? f.columns : [], row_count: f.row_count || 0, uploaded_at: f.uploaded_at, preview: f.preview || [], source: 'opensearch' }));
        if (this.files.length <= this.pageIndex * this.pageSize) this.pageIndex = 0;
      },
      error: () => { this.files = []; this.pageIndex = 0; }
    });
  }

  handleUploadSuccess(event: any) {
    this.fetchFiles();
    if (event?.data_preview || event?.preview) this.selectedFile = { id: event.sqlite_file_id || 0, filename: event.filename || '', file_type: event.file_type || '', columns: event.columns || [], row_count: event.row_count || 0, preview: event.data_preview || event.preview || [], source: 'opensearch' };
  }

  previewFile(file: FileInfo) {
    this.selectedFile = file;
    setTimeout(() => document.querySelector('app-data-table')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  search() {
    if (!this.searchQuery.trim()) return;
    this.searchLoading = true; this.searchPerformed = true; this.searchResults = [];
    this.apiService.searchOpenSearch(this.searchQuery).subscribe({
      next: (r: any) => { this.searchResults = r.results || r.hits?.hits || []; this.searchLoading = false; },
      error: e => { this.searchLoading = false; alert('Search failed: ' + (e.error?.detail || e.message || 'Unknown error')); }
    });
  }

  typeColor(type: string) { return TYPE_COLORS[type?.toUpperCase()] ?? DEFAULT_COLOR; }
  highlightFields(h: any) { return Object.entries(h || {}).map(([key, v]) => ({ key, value: (Array.isArray(v) ? v : [v]).join(' ... ') })); }
  get paginatedFiles() { return this.files.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize); }
  get tableColumns() { return this.selectedFile?.columns?.map(col => ({ title: col, key: col })) ?? []; }
  onPageChange(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; }
}
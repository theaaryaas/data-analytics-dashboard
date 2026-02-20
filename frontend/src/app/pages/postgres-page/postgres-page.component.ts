import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { ChartRendererComponent } from '../../components/chart-renderer/chart-renderer.component';
import { ApiService, FileInfo } from '../../services/api.service';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = { CSV: { bg: '#E8F5E9', text: '#81C784' }, JSON: { bg: '#FFF3E0', text: '#FFB74D' }, EXCEL: { bg: '#E3F2FD', text: '#64B5F6' }, XLS: { bg: '#E3F2FD', text: '#64B5F6' } };
const DEFAULT_COLOR = { bg: '#F5F5F5', text: '#9E9E9E' };

@Component({
  selector: 'app-postgres-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatPaginatorModule, FileUploadComponent, DataTableComponent, ChartRendererComponent],
  template: `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h2 style="margin:0">PostgreSQL</h2>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:linear-gradient(135deg,#FFF8F5,#FFE8E0);border-radius:8px;border:1px solid rgba(255,179,167,.3)">
          <mat-icon style="color:#FF8A65;font-size:20px;height:20px;width:20px">description</mat-icon>
          <span style="font-weight:600;color:#FF7043;font-size:14px">{{ files.length }} {{ files.length === 1 ? 'file' : 'files' }}</span>
        </div>
      </div>

      <app-file-upload [targetDatabase]="'postgresql'" (onUploadSuccess)="fetchFiles()"></app-file-upload>

      <mat-card style="margin-top:24px;border-radius:12px;border:1px solid rgba(255,179,167,.3);background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,248,245,.7));backdrop-filter:blur(10px)">
        <mat-card-header><mat-card-title style="color:#4A5568;font-weight:600">Files in PostgreSQL ({{ files.length }})</mat-card-title></mat-card-header>
        <mat-card-content>
          <div *ngIf="!files.length" style="text-align:center;padding:40px">
            <p style="color:rgba(0,0,0,.45)">No files uploaded yet</p>
          </div>
          <div *ngIf="files.length">
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
          </div>
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
export class PostgresPageComponent implements OnInit {
  files: FileInfo[] = [];
  selectedFile: FileInfo | null = null;
  cols = ['filename', 'file_type', 'columns', 'row_count', 'actions'];
  pageSize = 10;
  pageIndex = 0;

  constructor(private apiService: ApiService) {}
  ngOnInit() { this.fetchFiles(); }

  fetchFiles() {
    this.apiService.getPostgresFiles().subscribe({
      next: r => {
        this.files = (r?.files || []).map((f: any) => ({ id: f.id, filename: f.filename, file_type: f.file_type, columns: Array.isArray(f.columns) ? f.columns : (f.columns?.split(',') ?? []), row_count: f.row_count || 0, uploaded_at: f.uploaded_at, preview: f.preview_data || f.preview || [], stats: f.stats, source: 'postgresql' }));
        if (this.files.length <= this.pageIndex * this.pageSize) this.pageIndex = 0;
      },
      error: e => { console.error('Failed to fetch PostgreSQL files:', e); this.files = []; this.pageIndex = 0; }
    });
  }
  previewFile(file: FileInfo) { this.selectedFile = file; setTimeout(() => document.querySelector('app-data-table')?.scrollIntoView({ behavior: 'smooth' }), 100); }

  typeColor(type: string) { return TYPE_COLORS[type?.toUpperCase()] ?? DEFAULT_COLOR; }
  get paginatedFiles() { return this.files.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize); }
  get tableColumns() { return this.selectedFile?.columns?.map(col => ({ title: col, key: col })) ?? []; }
  onPageChange(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; }
}
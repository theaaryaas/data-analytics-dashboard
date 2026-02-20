import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { ApiService, FileInfo } from '../../services/api.service';

@Component({
  selector: 'app-data-sources',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatPaginatorModule, FileUploadComponent],
  template: `
    <div>
      <app-file-upload (onUploadSuccess)="onFileUploaded()"></app-file-upload>
      <mat-card style="border-radius:12px;border:1px solid rgba(255,179,167,.3);background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,248,245,.7));backdrop-filter:blur(10px)">
        <mat-card-header>
          <mat-card-title style="color:#4A5568;font-weight:600">All Files ({{ files.length }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading" style="text-align:center;padding:40px"><p>Loading...</p></div>
          <div *ngIf="!loading && !files.length" style="text-align:center;padding:40px"><p>No files uploaded yet</p></div>
          <div *ngIf="!loading && files.length">
            <table mat-table [dataSource]="paginatedFiles" class="mat-elevation-z2">
              <ng-container matColumnDef="filename">
                <th mat-header-cell *matHeaderCellDef>Filename</th>
                <td mat-cell *matCellDef="let f">{{ f.filename }}</td>
              </ng-container>
              <ng-container matColumnDef="file_type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let f">{{ f.file_type }}</td>
              </ng-container>
              <ng-container matColumnDef="columns">
                <th mat-header-cell *matHeaderCellDef>Columns</th>
                <td mat-cell *matCellDef="let f">{{ f.columns?.length || 0 }}</td>
              </ng-container>
              <ng-container matColumnDef="row_count">
                <th mat-header-cell *matHeaderCellDef>Rows</th>
                <td mat-cell *matCellDef="let f">{{ f.row_count?.toLocaleString() || 0 }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
            <mat-paginator [length]="files.length" [pageSize]="pageSize" [pageIndex]="pageIndex"
              [pageSizeOptions]="[7]" (page)="onPageChange($event)" style="background:transparent">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>`,
  styles: [`
    table { width:100%; }
    ::ng-deep .mat-mdc-header-cell { background:linear-gradient(135deg,rgba(255,204,188,.3),rgba(255,230,220,.3)); color:#4A5568; font-weight:600; border-bottom:2px solid rgba(255,138,101,.3); }
    ::ng-deep .mat-mdc-cell { border-bottom:1px solid rgba(255,179,167,.2); color:#4A5568; }
    ::ng-deep .mat-mdc-row:hover { background:rgba(255,204,188,.1); }
    ::ng-deep .mat-mdc-icon-button { color:#FF8A65; }
    ::ng-deep .mat-mdc-icon-button:hover { background:rgba(255,138,101,.1); }
  `]
})
export class DataSourcesComponent implements OnInit {
  files: FileInfo[] = [];
  loading = true;
  cols = ['filename', 'file_type', 'columns', 'row_count'];
  pageSize = 7;
  pageIndex = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit() { this.fetchFiles(); }

  onFileUploaded() { setTimeout(() => this.fetchFiles(), 500); }

  fetchFiles() {
    this.loading = true;
    this.apiService.getAllFiles().subscribe({
      next: r => {
        this.files = r.files || [];
        if (this.files.length <= this.pageIndex * this.pageSize) this.pageIndex = 0;
        this.loading = false;
      },
      error: () => { this.loading = false; alert('Failed to load files. Please refresh the page.'); }
    });
  }

  get paginatedFiles() { return this.files.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize); }
  onPageChange(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; }
}
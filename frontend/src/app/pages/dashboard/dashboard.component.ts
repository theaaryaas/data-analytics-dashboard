import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { FileCardComponent } from '../../components/file-card/file-card.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { ChartRendererComponent } from '../../components/chart-renderer/chart-renderer.component';
import { ApiService, FileInfo, SystemStats } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, StatCardComponent, FileCardComponent, DataTableComponent, ChartRendererComponent],
  template: `
    <div style="width:100%;box-sizing:border-box;overflow-x:hidden">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:32px">
        <app-stat-card title="Total Files"   [value]="systemStats?.total_files||0"                          description="Uploaded to all sources"><mat-icon>storage</mat-icon></app-stat-card>
        <app-stat-card title="Total Rows"    [value]="(systemStats?.total_rows||0).toLocaleString()"        description="Across all datasets"><mat-icon>description</mat-icon></app-stat-card>
        <app-stat-card title="Total Columns" [value]="systemStats?.total_columns||0"                        description="All data fields"><mat-icon>table_chart</mat-icon></app-stat-card>
        <app-stat-card title="File Types"    [value]="fileTypesCount"                                       description="CSV, Excel, JSON"><mat-icon>cloud_upload</mat-icon></app-stat-card>
      </div>

      <div style="margin-bottom:32px;width:100%;box-sizing:border-box;overflow-x:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-size:20px;font-weight:600;color:#4A5568;margin:0">Recent Files</h3>
          <a mat-raised-button routerLink="/data-sources" class="view-all-btn">
            View All <mat-icon style="margin-left:8px;font-size:18px;width:18px;height:18px;vertical-align:middle">arrow_forward</mat-icon>
          </a>
        </div>
        <div *ngIf="loading" style="text-align:center;padding:40px"><p>Loading...</p></div>
        <div *ngIf="!loading && !recentFiles.length" style="text-align:center;padding:40px"><p>No files uploaded yet</p></div>
        <div *ngIf="!loading && recentFiles.length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;margin-bottom:24px">
          <app-file-card *ngFor="let file of recentFiles" [file]="file" [isSelected]="selectedFile?.id===file.id" (onPreview)="selectedFile=$event"></app-file-card>
        </div>
        <div *ngIf="selectedFile" style="margin-top:24px;width:100%;box-sizing:border-box;overflow-x:hidden">
          <h3 style="font-size:20px;font-weight:600;color:#4A5568;margin-bottom:16px">Preview: {{ selectedFile.filename }}</h3>
          <div style="display:grid;grid-template-columns:45% 55%;gap:20px">
            <app-data-table [data]="selectedFile.preview||[]" [columns]="tableColumns" [title]="'Data Preview'" [fileType]="selectedFile.file_type" [rowCount]="selectedFile.row_count||0"></app-data-table>
            <app-chart-renderer [data]="selectedFile.preview||[]" [columns]="selectedFile.columns||[]"></app-chart-renderer>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`
    .view-all-btn { background:linear-gradient(135deg,#FF8A65,#FF7043); color:white; border:none; padding:8px 20px; border-radius:8px; font-weight:500; font-size:14px; cursor:pointer; box-shadow:0 2px 4px rgba(255,112,67,.3); transition:all .3s; display:inline-flex; align-items:center; text-decoration:none; }
    .view-all-btn:hover { background:linear-gradient(135deg,#FF7043,#FF5722); box-shadow:0 4px 8px rgba(255,112,67,.4); transform:translateY(-1px); }
    .view-all-btn:active { transform:translateY(0); box-shadow:0 2px 4px rgba(255,112,67,.3); }
  `]
})
export class DashboardComponent implements OnInit {
  systemStats: SystemStats | null = null;
  recentFiles: FileInfo[] = [];
  selectedFile: FileInfo | null = null;
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getSystemStats().subscribe({ next: r => this.systemStats = r.stats, error: e => console.error('Failed to fetch stats:', e) });
    this.apiService.getAllFiles().subscribe({
      next: r => { this.recentFiles = r.files.slice(0, 5); if (this.recentFiles.length && !this.selectedFile) this.selectedFile = this.recentFiles[0]; this.loading = false; },
      error: e => { console.error('Failed to fetch files:', e); this.loading = false; }
    });
  }

  get fileTypesCount() { return Object.keys(this.systemStats?.file_types ?? {}).length; }
  get tableColumns()   { return (this.selectedFile?.columns ?? []).map(col => ({ title: col, key: col })); }
}
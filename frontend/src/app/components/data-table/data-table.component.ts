import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
  template: `
    <mat-card class="data-preview-card">
      <mat-card-header class="card-header">
        <mat-card-title class="card-title">
          <mat-icon style="font-size:20px;width:20px;height:20px;margin-right:8px;color:#FF8A65">table_chart</mat-icon>
          {{ title }}
        </mat-card-title>
      </mat-card-header>
      <mat-card-content class="card-content">
        <div *ngIf="!columns.length || !data.length" class="empty-state">
          <mat-icon style="font-size:48px;width:48px;height:48px;color:rgba(255,138,101,.3);margin-bottom:12px">inbox</mat-icon>
          <p>No data available</p>
        </div>
        <div *ngIf="columns.length && data.length" class="table-container-wrapper">
          <div class="table-info">
            <span class="info-badge">
              <mat-icon style="font-size:14px;width:14px;height:14px;margin-right:4px">info</mat-icon>
              Showing {{ displayData.length }} of {{ totalRowCount }} {{ totalRowCount === 1 ? 'row' : 'rows' }}
            </span>
          </div>
          <div class="table-wrapper">
            <table mat-table [dataSource]="displayData" class="data-table">
              <ng-container *ngFor="let col of tableColumns" [matColumnDef]="col.key">
                <th mat-header-cell *matHeaderCellDef class="table-header">{{ col.title }}</th>
                <td mat-cell *matCellDef="let row" class="table-cell">
                  <div class="cell-content" [title]="getCellValue(row[col.key])">{{ getCellValue(row[col.key]) }}</div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns" class="header-row"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns" class="data-row"></tr>
            </table>
          </div>
        </div>
      </mat-card-content>
    </mat-card>`,
  styles: [`
    .data-preview-card { border-radius:16px !important; border:1px solid rgba(255,179,167,.3) !important; box-shadow:0 4px 12px rgba(255,138,101,.1) !important; background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(255,248,245,.95)) !important; backdrop-filter:blur(10px); height:100%; display:flex; flex-direction:column; transition:all .3s; }
    .data-preview-card:hover { box-shadow:0 6px 16px rgba(255,138,101,.15) !important; transform:translateY(-2px); }
    .card-header { padding:16px 20px 12px !important; background:linear-gradient(135deg,rgba(255,248,245,.8),rgba(255,230,220,.8)); border-bottom:1px solid rgba(255,179,167,.2); }
    .card-title { font-size:18px !important; font-weight:600 !important; color:#4A5568 !important; margin:0 !important; display:flex; align-items:center; }
    .card-content { flex:1; padding:16px 20px 20px !important; display:flex; flex-direction:column; min-height:0; }
    .empty-state { text-align:center; padding:40px 20px; color:rgba(0,0,0,.45); flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:14px; }
    .empty-state p { margin:0; color:rgba(0,0,0,.5); }
    .table-container-wrapper { flex:1; display:flex; flex-direction:column; min-height:0; }
    .table-info { margin-bottom:12px; }
    .info-badge { display:inline-flex; align-items:center; padding:6px 12px; background:linear-gradient(135deg,rgba(255,248,245,.8),rgba(255,230,220,.8)); border:1px solid rgba(255,179,167,.3); border-radius:8px; font-size:12px; font-weight:500; color:#FF7043; }
    .table-wrapper { overflow:auto; flex:1; border:1px solid rgba(255,179,167,.2); border-radius:12px; max-height:400px; background:white; box-shadow:inset 0 2px 4px rgba(0,0,0,.02); }
    .data-table { width:100%; min-width:max-content; }
    ::ng-deep .table-header { font-weight:600 !important; color:#2C3E50 !important; background:linear-gradient(135deg,rgba(255,248,245,.9),rgba(255,230,220,.9)) !important; padding:14px 16px !important; border-bottom:2px solid rgba(255,138,101,.3) !important; white-space:nowrap !important; min-width:120px !important; max-width:250px !important; text-transform:uppercase; letter-spacing:.5px; font-size:12px !important; }
    ::ng-deep .table-cell { padding:12px 16px !important; border-bottom:1px solid rgba(255,179,167,.1) !important; color:#4A5568 !important; font-size:13px !important; min-width:120px !important; max-width:250px !important; }
    ::ng-deep .data-row { transition:background-color .2s; }
    ::ng-deep .data-row:hover { background-color:rgba(255,248,245,.5) !important; }
    ::ng-deep .data-row:nth-child(even) { background-color:rgba(255,248,245,.2); }
    .cell-content { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%; cursor:help; }
    .table-wrapper::-webkit-scrollbar { height:8px; width:8px; }
    .table-wrapper::-webkit-scrollbar-track { background:rgba(255,248,245,.5); border-radius:4px; }
    .table-wrapper::-webkit-scrollbar-thumb { background:rgba(255,138,101,.4); border-radius:4px; }
    .table-wrapper::-webkit-scrollbar-thumb:hover { background:rgba(255,138,101,.6); }
  `]
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: any[] = [];
  @Input() title = 'Data Preview';
  @Input() fileType = '';
  @Input() rowCount = 0;

  get displayData() { return this.data; }
  get tableColumns() {
    return this.columns.length ? this.columns
      : this.data.length ? Object.keys(this.data[0]).map(key => ({ key, title: key })) : [];
  }
  get displayedColumns() { return this.tableColumns.map(c => c.key); }
  get totalRowCount() { return this.rowCount > 0 ? this.rowCount : this.data.length; }
  getCellValue(value: any): string {
    if (value == null) return '';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FileInfo } from '../../services/api.service';

const TYPE_MAP: Record<string, { icon: string; color: string; bg: string; text: string }> = {
  Excel: { icon: 'table_chart',    color: '#64B5F6', bg: '#E3F2FD', text: '#64B5F6' },
  CSV:   { icon: 'description',    color: '#81C784', bg: '#E8F5E9', text: '#81C784' },
  JSON:  { icon: 'code',           color: '#FFB74D', bg: '#FFF3E0', text: '#FFB74D' },
};
const DEFAULT_TYPE = { icon: 'insert_drive_file', color: '#9E9E9E', bg: '#F5F5F5', text: '#9E9E9E' };

const SOURCE_MAP: Record<string, { bg: string; text: string }> = {
  PostgreSQL: { bg: '#E1BEE7', text: '#7B1FA2' },
  MongoDB:    { bg: '#B2DFDB', text: '#00796B' },
  OpenSearch: { bg: '#FFE082', text: '#F57F17' },
};
const DEFAULT_SOURCE = { bg: '#C8E6C9', text: '#388E3C' };

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="file-card"
      [style.border]="isSelected ? '2px solid #FF8A65' : 'none'"
      [style.box-shadow]="isSelected ? '0 4px 16px rgba(255,138,101,.3)' : '0 2px 8px rgba(0,0,0,.08)'"
      [style.background]="isSelected ? 'rgba(255,204,188,.15)' : '#FFF'"
      (click)="onPreview.emit(file)">

      <div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <mat-icon [style.font-size.px]="32" [style.height.px]="32" [style.width.px]="32" [style.color]="t.color">{{ t.icon }}</mat-icon>
          <h3 style="font-size:16px;font-weight:600;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#2C3E50">{{ file.filename }}</h3>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span [style.background]="t.bg" [style.color]="t.text" style="padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500">{{ file.file_type }}</span>
          <span *ngIf="file.source" [style.background]="s.bg" [style.color]="s.text" style="padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500;display:flex;align-items:center;gap:4px">
            <mat-icon style="font-size:14px;height:14px;width:14px">storage</mat-icon>{{ file.source }}
          </span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(0,0,0,.08)">
        <div *ngFor="let stat of [['Rows', (file.row_count||0).toLocaleString()], ['Columns', (file.columns||[]).length]]">
          <p style="font-size:12px;color:rgba(0,0,0,.5);margin:0 0 6px;font-weight:500">{{ stat[0] }}</p>
          <p style="font-size:18px;font-weight:600;margin:0;color:#2C3E50">{{ stat[1] }}</p>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(0,0,0,.5)">
        <mat-icon style="font-size:16px;height:16px;width:16px">calendar_today</mat-icon>
        <span>{{ formatDate(file.uploaded_at) }}</span>
      </div>
    </mat-card>`,
  styles: [`.file-card { border-radius:12px; cursor:pointer; height:100%; padding:20px; display:flex; flex-direction:column; justify-content:space-between; transition:all .3s; }`]
})
export class FileCardComponent {
  @Input() file!: FileInfo;
  @Input() isSelected = false;
  @Output() onPreview = new EventEmitter<FileInfo>();

  get t() { return TYPE_MAP[this.file.file_type] ?? DEFAULT_TYPE; }
  get s() { return SOURCE_MAP[this.file.source!] ?? DEFAULT_SOURCE; }

  formatDate(d?: string) {
    return d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'N/A';
  }
}
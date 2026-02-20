import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatRadioModule, MatDividerModule, FormsModule],
  template: `
    <mat-card style="margin-bottom:24px;border-radius:12px;border:1px solid rgba(255,179,167,.3);background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,248,245,.7));backdrop-filter:blur(10px)">
      <mat-card-header style="padding:16px 16px 8px">
        <mat-card-title style="font-size:16px;font-weight:600;margin:0">Upload Data File</mat-card-title>
      </mat-card-header>
      <mat-card-content style="padding:0 16px 16px">
        <div class="upload-area"
          [style.border]="isDragging ? '2px dashed #FF8A65' : '2px dashed rgba(255,138,101,.5)'"
          [style.background]="isDragging ? 'linear-gradient(135deg,#FFE0D6,#FFF0EB)' : 'linear-gradient(135deg,#FFF8F5,#FFE8E0)'"
          (dragover)="onDrag($event, true)" (dragleave)="onDrag($event, false)" (drop)="onDrop($event)" (click)="fileInput.click()">
          <mat-icon style="font-size:36px;height:36px;width:36px;color:#FF8A65;margin-bottom:12px">cloud_upload</mat-icon>
          <h4 style="margin-bottom:6px;font-size:16px;font-weight:500;color:#FF7043">Drag and drop your file here</h4>
          <p style="font-size:13px;color:#FF8A65;margin-bottom:12px">or click to browse</p>
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv,.json,.xlsx,.xls" style="display:none"/>
          <button mat-stroked-button (click)="fileInput.click();$event.stopPropagation()" style="border-color:#FF8A65;color:#FF8A65">Browse Files</button>
        </div>

        <div *ngIf="!targetDatabase && selectedFile" style="margin-top:16px;padding:20px;border:1px solid rgba(255,179,167,.3);border-radius:8px;background:linear-gradient(135deg,#F5F5F5,#FAFAFA)">
          <h5 style="margin-bottom:16px;font-size:16px;font-weight:600;color:#4A5568">Select Database to Store Dataset</h5>
          <p style="font-size:13px;color:#7F8C8D;margin-bottom:16px">Choose where you want to store your uploaded file.</p>
          <mat-radio-group [(ngModel)]="selectedDatabase">
            <div style="display:flex;flex-direction:column;gap:12px">
              <div *ngFor="let db of databases" (click)="selectedDatabase=db.value"
                [style.border]="selectedDatabase===db.value ? '2px solid '+db.color : '1px solid rgba(255,179,167,.3)'"
                [style.background]="selectedDatabase===db.value ? 'linear-gradient(135deg,'+db.bgColor+')' : 'linear-gradient(135deg,#FFF,#FFF8F5)'"
                style="padding:16px;border-radius:8px;transition:all .3s;cursor:pointer">
                <mat-radio-button [value]="db.value" (click)="$event.stopPropagation()">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                    <mat-icon [style.color]="db.color" style="font-size:18px;height:18px;width:18px">{{ db.icon }}</mat-icon>
                    <span style="font-weight:600;font-size:15px">{{ db.label }}</span>
                  </div>
                  <p style="font-size:12px;color:#7F8C8D;margin:4px 0 0 26px;line-height:1.5">{{ db.description }}</p>
                </mat-radio-button>
              </div>
            </div>
          </mat-radio-group>
          <mat-divider style="margin:20px 0"></mat-divider>
        </div>

        <div style="margin-top:20px">
          <p style="font-size:13px;font-weight:500;margin-bottom:10px">Supported File Types:</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div *ngFor="let t of fileTypes" [style.background]="t.bg" [style.color]="t.color" style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:6px;font-size:12px">
              <mat-icon style="font-size:16px;height:16px;width:16px">{{ t.icon }}</mat-icon>
              <span style="font-weight:500">{{ t.label }}</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>`,
  styles: [`.upload-area { border-radius:12px; padding:32px 24px; text-align:center; transition:all .3s; cursor:pointer; }`]
})
export class FileUploadComponent implements OnInit {
  @Output() onUploadSuccess = new EventEmitter<any>();
  @Input() targetDatabase?: string;

  selectedFile: File | null = null;
  selectedDatabase = 'sqlite';
  isDragging = false;

  databases = [
    { value: 'sqlite',     label: 'SQLite (Default)', icon: 'storage',     color: '#81C784', bgColor: '#E8F5E9 0%,#C8E6C9 100%',  description: 'Lightweight, file-based database. Best for small to medium datasets and quick prototyping.' },
    { value: 'postgresql', label: 'PostgreSQL',        icon: 'table_chart', color: '#64B5F6', bgColor: '#E3F2FD 0%,#BBDEFB 100%',  description: 'Powerful relational database. Ideal for complex queries, transactions, and large-scale applications.' },
    { value: 'mongodb',    label: 'MongoDB',           icon: 'storage',     color: '#80CBC4', bgColor: '#B2DFDB 0%,#80CBC4 100%',  description: 'NoSQL document database. Perfect for flexible schemas, JSON data, and horizontal scaling.' },
    { value: 'opensearch', label: 'OpenSearch',        icon: 'search',      color: '#FFB74D', bgColor: '#FFF3E0 0%,#FFE0B2 100%',  description: 'Search and analytics engine. Great for full-text search, log analytics, and real-time data exploration.' },
  ];

  fileTypes = [
    { label: 'Excel (.xlsx, .xls)', icon: 'table_chart', color: '#64B5F6', bg: '#E3F2FD' },
    { label: 'CSV (.csv)',           icon: 'description', color: '#81C784', bg: '#E8F5E9' },
    { label: 'JSON (.json)',         icon: 'code',        color: '#FFB74D', bg: '#FFF3E0' },
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() { if (this.targetDatabase) this.selectedDatabase = this.targetDatabase; }

  onDrag(e: DragEvent, dragging: boolean) { e.preventDefault(); e.stopPropagation(); this.isDragging = dragging; }

  onDrop(e: DragEvent) { e.preventDefault(); e.stopPropagation(); this.isDragging = false; const file = e.dataTransfer?.files[0]; if (file && this.validateFile(file)) { this.selectedFile = file; this.uploadFile(); } }
  onFileSelected(e: any) { const file = e.target.files?.[0]; if (file && this.validateFile(file)) { this.selectedFile = file; this.uploadFile(); } }

  validateFile(file: File): boolean {
    if (!['.csv','.xlsx','.xls','.json'].some(ext => file.name.toLowerCase().endsWith(ext))) return alert('Invalid file type. Please upload CSV, Excel, or JSON files.'), false;
    if (file.size / 1024 / 1024 >= 100) return alert('File size too large. Maximum size is 100MB.'), false;
    return true;
  }
  clearFile() { this.selectedFile = null; this.selectedDatabase = this.targetDatabase || 'sqlite'; }

  uploadFile() {
    if (!this.selectedFile) return;
    const uploads: Record<string, any> = {
      mongodb: this.apiService.uploadToMongoDB,
      postgresql: this.apiService.uploadToPostgres,
      opensearch: this.apiService.uploadToOpenSearch,
    };
    const upload$ = (uploads[this.selectedDatabase] ?? this.apiService.uploadFile).call(this.apiService, this.selectedFile);
    const fileName = this.selectedFile.name;
    const dbLabel = this.databases.find(d => d.value === this.selectedDatabase)?.label || 'Database';
    upload$.subscribe({
      next: (res: any) => { this.clearFile(); this.onUploadSuccess.emit(res); alert(`${fileName} uploaded successfully to ${dbLabel}!`); },
      error: (err: any) => alert('Upload failed: ' + (err.error?.detail || err.message || 'Unknown error'))
    });
  }
}
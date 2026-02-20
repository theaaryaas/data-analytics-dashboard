import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

interface MetricCard { title: string; value: string; icon: string; color: string; description: string; }

@Component({
  selector: 'app-simple-monitoring',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div>
      <button mat-raised-button (click)="fetchMetrics()" [disabled]="loading" style="margin-bottom:24px;background:#FF8A65;color:white">
        <mat-icon>refresh</mat-icon> Refresh Metrics
      </button>
      <div *ngIf="loading" style="text-align:center;padding:40px"><p>Loading metrics...</p></div>
      <div *ngIf="!loading && metricCards.length" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:24px">
        <mat-card *ngFor="let c of metricCards" style="border-radius:12px;border:1px solid rgba(255,179,167,.3);background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,248,245,.7));backdrop-filter:blur(10px);padding:20px">
          <div style="display:flex;align-items:flex-start;gap:16px">
            <div [style.background]="'linear-gradient(135deg,'+c.color+','+c.color+'dd)'" style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <mat-icon style="color:white;font-size:28px;height:28px;width:28px">{{ c.icon }}</mat-icon>
            </div>
            <div style="flex:1;min-width:0">
              <h3 style="margin:0 0 4px;font-size:14px;font-weight:500;color:#7F8C8D;text-transform:uppercase;letter-spacing:.5px">{{ c.title }}</h3>
              <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#4A5568">{{ c.value }}</p>
              <p style="margin:0;font-size:12px;color:#7F8C8D;line-height:1.4">{{ c.description }}</p>
            </div>
          </div>
        </mat-card>
      </div>
      <div *ngIf="!loading && !metricCards.length" style="text-align:center;padding:40px"><p style="color:#7F8C8D">No metrics available</p></div>
    </div>`,
  styles: []
})
export class SimpleMonitoringComponent implements OnInit {
  metricCards: MetricCard[] = [];
  loading = false;

  constructor(private apiService: ApiService) {}
  ngOnInit() { this.fetchMetrics(); }

  fetchMetrics() {
    this.loading = true;
    this.apiService.getMetrics().subscribe({
      next: d => { this.parseMetrics(d); this.loading = false; },
      error: e => { console.error('Failed to fetch metrics:', e); this.loading = false; }
    });
  }

  parseMetrics(text: string) {
    const match = (pattern: string) => text.match(new RegExp(pattern + '\\s+(\\d+\\.?\\d*)'));
    const num = (m: RegExpMatchArray | null) => m ? parseFloat(m[1]) : 0;

    const uploads = num(match('file_uploads_total'));
    const sum = num(match('upload_time_seconds_sum'));
    const count = num(match('upload_time_seconds_count'));
    const errors = num(match('errors_total'));
    const hasErrors = errors > 0;

    this.metricCards = [
      { title: 'Total Uploads',    value: uploads.toLocaleString(),                      icon: 'cloud_upload',                       color: '#FF8A65', description: 'Total number of files uploaded to the system' },
      { title: 'Avg Upload Time',  value: count > 0 ? (sum/count).toFixed(2)+'s':'0.00s', icon: 'schedule',                          color: '#FFB74D', description: 'Average time to process file uploads' },
      { title: 'System Errors',    value: errors.toLocaleString(),                        icon: hasErrors ? 'error' : 'check_circle', color: hasErrors ? '#F44336' : '#4CAF50', description: hasErrors ? 'Total errors encountered' : 'No errors detected. System is healthy' },
      { title: 'System Status',    value: hasErrors ? 'Attention Needed' : 'Running Smoothly', icon: hasErrors ? 'warning' : 'check_circle', color: hasErrors ? '#FF9800' : '#66BB6A', description: hasErrors ? 'Some issues detected. Check error logs.' : 'All systems operational' },
    ];
  }
}
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="stat-card" [class]="className">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <h3 style="font-size:14px;font-weight:500;color:rgba(0,0,0,.65);margin:0;text-transform:uppercase;letter-spacing:.5px">{{ title }}</h3>
        <div style="font-size:24px;color:#FF8A65;display:flex;align-items:center;opacity:.8"><ng-content></ng-content></div>
      </div>
      <div style="font-size:32px;font-weight:600;color:#2C3E50;margin-bottom:8px;line-height:1.2">{{ value }}</div>
      <p *ngIf="description" style="font-size:12px;color:rgba(0,0,0,.5);margin:0;line-height:1.4">{{ description }}</p>
    </mat-card>`,
  styles: [`.stat-card { border-radius:12px; border:none; box-shadow:0 2px 8px rgba(0,0,0,.08); background:#FFF; padding:24px; min-height:140px; display:flex; flex-direction:column; justify-content:space-between; transition:all .3s; }`]
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() description = '';
  @Input() className = '';
}
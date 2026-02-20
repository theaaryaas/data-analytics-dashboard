import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;gap:12px">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="#FF8A65" stop-opacity=".9"/>
            <stop offset="50%"  stop-color="#FFB74D" stop-opacity=".9"/>
            <stop offset="100%" stop-color="#FFCCBC" stop-opacity=".9"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" stroke="#FF7043" stroke-width="2"/>
        <rect x="25" y="45" width="8" height="20" fill="#FFF" rx="2"/>
        <rect x="38" y="35" width="8" height="30" fill="#FFF" rx="2"/>
        <rect x="51" y="30" width="8" height="35" fill="#FFF" rx="2"/>
        <rect x="64" y="40" width="8" height="25" fill="#FFF" rx="2"/>
        <circle cx="29" cy="38" r="2.5" fill="#FF7043"/>
        <circle cx="42" cy="28" r="2.5" fill="#FF7043"/>
        <circle cx="55" cy="23" r="2.5" fill="#FF7043"/>
        <circle cx="68" cy="33" r="2.5" fill="#FF7043"/>
        <path d="M 29 38 Q 35 30 42 28 T 55 23 T 68 33" stroke="#FF7043" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
      <div *ngIf="showText">
        <h1 style="font-size:20px;font-weight:700;margin:0 0 4px;color:#2C3E50;line-height:1.2">Data Analytics</h1>
        <p style="font-size:12px;color:#4A5568;margin:0">Dashboard Platform</p>
      </div>
    </div>`,
  styles: []
})
export class LogoComponent {
  @Input() size = 40;
  @Input() showText = true;
}
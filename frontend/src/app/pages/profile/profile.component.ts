import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

const FIELD_STYLE = 'display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,248,245,.5);border-radius:8px';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div>
      <div style="margin-bottom:24px">
        <h2 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#4A5568;display:flex;align-items:center;gap:12px">
          <mat-icon style="color:#FF8A65;font-size:32px;height:32px;width:32px">person</mat-icon>Profile
        </h2>
        <p style="font-size:14px;color:#7F8C8D;margin:0">Manage your account information and preferences</p>
      </div>

      <mat-card *ngIf="user" style="border-radius:12px;border:1px solid rgba(255,179,167,.3);background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,248,245,.7));backdrop-filter:blur(10px);max-width:600px">
        <mat-card-header style="padding:24px 24px 16px">
          <mat-card-title style="color:#4A5568;font-weight:600;font-size:18px">Account Information</mat-card-title>
        </mat-card-header>
        <mat-card-content style="padding:0 24px 24px">
          <div style="text-align:center;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,179,167,.2)">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#FF8A65,#FF7043);margin-bottom:16px;box-shadow:0 4px 12px rgba(255,138,101,.3)">
              <mat-icon style="font-size:60px;height:60px;width:60px;color:white">account_circle</mat-icon>
            </div>
            <h3 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#4A5568">{{ user.name || 'User' }}</h3>
            <p style="margin:0;font-size:14px;color:#7F8C8D">{{ user.email || 'No email provided' }}</p>
          </div>

          <div style="display:flex;flex-direction:column;gap:16px">
            <div *ngFor="let f of fields" [style]="FIELD_STYLE">
              <mat-icon style="color:#FF8A65;font-size:20px;height:20px;width:20px">{{ f.icon }}</mat-icon>
              <div>
                <p style="margin:0;font-size:12px;color:#7F8C8D;font-weight:500">{{ f.label }}</p>
                <p style="margin:4px 0 0;font-size:15px;color:#4A5568;font-weight:600">{{ f.value }}</p>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>`,
  styles: []
})
export class ProfileComponent implements OnInit {
  user: any = null;
  fields: { icon: string; label: string; value: string }[] = [];
  readonly FIELD_STYLE = FIELD_STYLE;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.user$.subscribe(u => {
      this.user = u;
      this.fields = [
        { icon: 'badge',          label: 'Full Name',      value: u?.name  || 'Not set' },
        { icon: 'email',          label: 'Email Address',  value: u?.email || 'Not set' },
        { icon: 'calendar_today', label: 'Member Since',   value: new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) },
      ];
    });
  }
}
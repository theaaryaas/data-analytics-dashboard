import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LogoComponent } from '../components/logo/logo.component';
import { BackgroundDecorationComponent } from '../components/background-decoration/background-decoration.component';
import { AuthService } from '../services/auth.service';
import { filter } from 'rxjs/operators';

const NAV_ITEMS = [
  { path: 'dashboard',      icon: 'dashboard',   label: 'Dashboard' },
  { path: 'data-sources',   icon: 'storage',     label: 'Data Sources' },
  { path: 'monitoring',     icon: 'show_chart',  label: 'Monitoring' },
  { path: 'mongodb-docker', icon: 'storage',     label: 'MongoDB Docker' },
  { path: 'opensearch',     icon: 'search',      label: 'OpenSearch' },
  { path: 'postgresql',     icon: 'table_chart', label: 'PostgreSQL' },
];

const PAGE_META: Record<string, { title: string; subtitle?: string; icon: string }> = {
  'dashboard':      { title: 'Dashboard',        icon: 'dashboard' },
  'data-sources':   { title: 'Data Sources',     icon: 'storage',     subtitle: 'Upload and manage your data files' },
  'monitoring':     { title: 'Monitoring',        icon: 'show_chart',  subtitle: 'System metrics and performance monitoring' },
  'mongodb-docker': { title: 'MongoDB Docker',   icon: 'storage' },
  'opensearch':     { title: 'OpenSearch',        icon: 'search' },
  'postgresql':     { title: 'PostgreSQL',        icon: 'table_chart' },
  'profile':        { title: 'Profile',           icon: 'person' },
  '':               { title: 'Dashboard',         icon: 'dashboard' },
};

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MatListModule, MatIconModule, MatButtonModule, MatMenuModule, LogoComponent, BackgroundDecorationComponent],
  template: `
    <div style="min-height:100vh;position:relative;overflow-x:hidden">
      <app-background-decoration></app-background-decoration>
      <div style="display:flex;position:relative;z-index:1;width:100%;overflow-x:hidden">
        <!-- Sidebar -->
        <div style="width:256px;min-height:100vh;position:fixed;left:0;top:0;bottom:0;background:linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,248,245,.85));border-right:1px solid rgba(255,179,167,.3);z-index:10;overflow-y:auto">
          <div style="padding:24px;border-bottom:1px solid rgba(255,179,167,.3);margin-bottom:8px;background:linear-gradient(135deg,rgba(255,204,188,.6),rgba(255,227,178,.6));border-radius:0 0 12px 12px">
            <app-logo [size]="48" [showText]="true"></app-logo>
          </div>
          <mat-nav-list>
            <a *ngFor="let n of navItems" mat-list-item [routerLink]="'/'+n.path" routerLinkActive="active">
              <mat-icon>{{ n.icon }}</mat-icon>
              <span style="margin-left:8px">{{ n.label }}</span>
            </a>
          </mat-nav-list>
        </div>
        <!-- Main -->
        <div style="flex:1;margin-left:256px;min-height:100vh;width:calc(100% - 256px);overflow-x:hidden;box-sizing:border-box">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,rgba(255,255,255,.6),rgba(255,248,245,.6));border-bottom:1px solid rgba(184,212,240,.3);padding:0 24px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100;backdrop-filter:blur(10px);min-height:64px;box-sizing:border-box">
            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="display:flex;align-items:center;gap:8px">
                <mat-icon style="color:#4A5568;font-size:24px">{{ meta.icon }}</mat-icon>
                <h2 style="margin:0;font-size:20px;font-weight:600;color:#4A5568;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ meta.title }}</h2>
              </div>
              <p *ngIf="meta.subtitle" style="margin:0 0 0 32px;font-size:14px;color:#7F8C8D;white-space:nowrap">{{ meta.subtitle }}</p>
            </div>
            <div style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 12px;border-radius:20px" [matMenuTriggerFor]="userMenu">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#FF8A65,#FFB74D);display:flex;align-items:center;justify-content:center">
                <mat-icon style="font-size:20px;height:20px;width:20px;color:white">account_circle</mat-icon>
              </div>
              <span style="color:#4A5568;font-weight:500;font-size:14px;white-space:nowrap">{{ currentUser?.name || currentUser?.email || 'User' }}</span>
            </div>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item routerLink="/profile"><mat-icon>person</mat-icon><span>Profile</span></button>
              <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Logout</span></button>
            </mat-menu>
          </div>
          <div style="padding:24px;min-height:calc(100vh - 80px);box-sizing:border-box">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`.active { background-color:rgba(255,204,188,.3) !important; }`]
})
export class LayoutComponent implements OnInit {
  currentUser: any = null;
  navItems = NAV_ITEMS;
  meta = PAGE_META[''];

  constructor(private authService: AuthService, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.authService.user$.subscribe(u => this.currentUser = u);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.updateMeta());
    this.updateMeta();
  }

  private getPath() {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    return route.snapshot.routeConfig?.path || '';
  }

  updateMeta() { this.meta = PAGE_META[this.getPath()] ?? PAGE_META['']; }

  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DataSourcesComponent } from './pages/data-sources/data-sources.component';
import { SimpleMonitoringComponent } from './pages/simple-monitoring/simple-monitoring.component';
import { MongoDBPageComponent } from './pages/mongodb-page/mongodb-page.component';
import { OpenSearchPageComponent } from './pages/opensearch-page/opensearch-page.component';
import { PostgresPageComponent } from './pages/postgres-page/postgres-page.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login',  component: LoginComponent },
  { path: 'signup', component: SignUpComponent },
  { path: '', component: LayoutComponent, canActivate: [authGuard], children: [
    { path: '',              redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard',    component: DashboardComponent },
    { path: 'data-sources', component: DataSourcesComponent },
    { path: 'monitoring',   component: SimpleMonitoringComponent },
    { path: 'mongodb-docker', component: MongoDBPageComponent },
    { path: 'opensearch',   component: OpenSearchPageComponent },
    { path: 'postgresql',   component: PostgresPageComponent },
    { path: 'profile',      component: ProfileComponent },
  ]},
  { path: '**', redirectTo: '/dashboard' }
];
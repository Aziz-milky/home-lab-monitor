import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/service-list/service-list.component').then(c => c.ServiceListComponent)
  },
  {
    path: 'services/:id',
    loadComponent: () => import('./pages/service-detail/service-detail.component').then(c => c.ServiceDetailComponent)
  },
  {
    path: 'alerts',
    loadComponent: () => import('./pages/alerts/alerts.component').then(c => c.AlertsComponent)
  },
  {
    path: 'alert-rules',
    loadComponent: () => import('./pages/alert-rules/alert-rules.component').then(c => c.AlertRulesComponent)
  },
  {
    path: 'diagnostics',
    loadComponent: () => import('./pages/diagnostics/diagnostics.component').then(c => c.DiagnosticsComponent)
  }
];

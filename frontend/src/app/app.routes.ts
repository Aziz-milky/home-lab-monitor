import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'hosts',
    loadComponent: () => import('./pages/hosts/hosts.component').then(c => c.HostsComponent)
  },
  {
    path: 'hosts/:id',
    loadComponent: () => import('./pages/host-detail/host-detail.component').then(c => c.HostDetailComponent)
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
    path: 'topology',
    loadComponent: () => import('./pages/topology/topology.component').then(c => c.TopologyComponent)
  },
  {
    path: 'logs',
    loadComponent: () => import('./pages/logs/logs.component').then(c => c.LogsComponent)
  },
  {
    path: 'containers',
    loadComponent: () => import('./pages/containers/containers.component').then(c => c.ContainersComponent)
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

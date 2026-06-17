import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, interval, switchMap, takeUntil, startWith, forkJoin, catchError, of } from 'rxjs';
import { AgCharts, ModuleRegistry, AllCommunityModule } from 'ag-charts-community';

ModuleRegistry.register(AllCommunityModule as any);
import { Network } from 'vis-network';
import { HealthApiService } from '../../services/health-api.service';
import { AlertApiService } from '../../services/alert-api.service';
import { DependencyApiService } from '../../services/dependency-api.service';
import { DashboardEntry } from '../../models/page.model';
import { ServiceDependency } from '../../models/dependency.model';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgFor, NgIf, NgClass, DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule,
    StatusBadgeComponent
  ],
  template: `
    <div class="page">
      <h1 class="page-title">Dashboard</h1>

      @if (loading) {
        <mat-spinner diameter="36" />
      }

      @if (!loading) {
        <div class="summary-grid">
          <mat-card class="stat-card">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">Total</span>
          </mat-card>
          <mat-card class="stat-card up-card">
            <span class="stat-value">{{ upCount }}</span>
            <span class="stat-label">Up</span>
          </mat-card>
          <mat-card class="stat-card down-card">
            <span class="stat-value">{{ downCount }}</span>
            <span class="stat-label">Down</span>
          </mat-card>
          <mat-card class="stat-card warn-card">
            <span class="stat-value">{{ unacknowledgedCount }}</span>
            <span class="stat-label">Alerts</span>
          </mat-card>
        </div>

        @if (entries.length > 0) {
          <div class="chart-row">
            <mat-card class="chart-card">
              <div #donutChart class="donut-container"></div>
            </mat-card>
          </div>
        }

        @if (dependencies.length > 0) {
          <div class="chart-row">
            <mat-card class="chart-card">
              <h2 class="section-title">Network Topology</h2>
              <div #topologyGraph class="topology-container"></div>
            </mat-card>
          </div>
        }

        @if (recentAlerts.length > 0) {
          <div class="chart-row">
            <mat-card class="chart-card alerts-card">
              <div class="alerts-header">
                <h2 class="section-title">Recent Alerts</h2>
                <a class="alerts-link" routerLink="/alerts">View all</a>
              </div>
              <div class="alerts-list">
                @for (a of recentAlerts; track a.id) {
                  <div class="alert-row" [ngClass]="a.severity.toLowerCase()">
                    <mat-icon class="alert-icon" [ngClass]="a.severity.toLowerCase()">
                      {{ a.severity === 'CRITICAL' ? 'error' : a.severity === 'WARNING' ? 'warning' : 'info' }}
                    </mat-icon>
                    <div class="alert-body">
                      <span class="alert-msg">{{ a.message }}</span>
                      <span class="alert-meta">{{ a.service?.name || 'Unknown' }} &middot; {{ timeAgo(a.triggeredAt) }}</span>
                    </div>
                    <button mat-icon-button class="alert-ack" (click)="acknowledge(a)" matTooltip="Acknowledge">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </mat-card>
          </div>
        }

        <div class="services-grid">
          @for (e of entries; track e.serviceId) {
            <mat-card class="service-card" [ngClass]="e.status.toLowerCase()">
              <div class="card-main">
                <a class="card-name" [routerLink]="['/services', e.serviceId]">{{ e.serviceName }}</a>
                <div class="card-meta">
                  <span class="meta-item">{{ e.serviceType }}</span>
                  <span class="meta-sep"></span>
                  <span class="meta-item">{{ e.responseTimeMs != null ? e.responseTimeMs + 'ms' : '-' }}</span>
                </div>
                <div class="card-footer">
                  <span class="footer-time">{{ e.checkedAt ? timeAgo(e.checkedAt) : '--' }}</span>
                  <app-status-badge [status]="e.status" />
                </div>
              </div>
            </mat-card>
          }
          @if (entries.length === 0) {
            <div class="empty-state">
              <mat-icon>radio_button_unchecked</mat-icon>
              <p>No services registered.</p>
              <button mat-raised-button color="primary" routerLink="/services">Add Service</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-title { font-size: 1.25rem; font-weight: 500; color: var(--text-primary); margin: 0 0 20px 0; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.7; }
    .section-title { font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin: 0 0 8px 0; letter-spacing: 0.03em; text-transform: uppercase; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: var(--surface-bg) !important; color: var(--text-primary) !important; text-align: center; padding: 14px 8px; border-left: 3px solid rgba(66,165,245,0.15) !important; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 300; line-height: 1.2; }
    .stat-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); margin-top: 2px; }
    .up-card { border-left-color: var(--status-up) !important; }
    .down-card { border-left-color: var(--status-down) !important; }
    .warn-card { border-left-color: var(--status-warn) !important; }
    .chart-row { margin-bottom: 20px; }
    .chart-card { background: var(--surface-bg) !important; padding: 12px !important; }
    .donut-container { width: 100%; height: 220px; }
    .topology-container { width: 100%; height: 300px; }
    .alerts-card { padding: 12px !important; }
    .alerts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .alerts-link { font-size: 0.8rem; color: var(--accent); text-decoration: none; }
    .alerts-list { display: flex; flex-direction: column; gap: 4px; }
    .alert-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; background: rgba(66,165,245,0.04); border-left: 3px solid transparent; }
    .alert-row.critical { border-left-color: #ef5350; }
    .alert-row.warning { border-left-color: #ffa726; }
    .alert-row.info { border-left-color: var(--accent); }
    .alert-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .alert-icon.critical { color: #ef5350; }
    .alert-icon.warning { color: #ffa726; }
    .alert-icon.info { color: var(--accent); }
    .alert-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .alert-msg { font-size: 0.82rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .alert-meta { font-size: 0.72rem; color: var(--text-secondary); }
    .alert-ack { width: 28px; height: 28px; line-height: 28px; flex-shrink: 0; }
    .alert-ack mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-secondary); }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .service-card { background: var(--surface-bg) !important; color: var(--text-primary) !important; padding: 14px 16px; border-left: 3px solid rgba(66,165,245,0.12) !important; }
    .service-card.up { border-left-color: var(--status-up) !important; }
    .service-card.down { border-left-color: var(--status-down) !important; }
    .service-card.warn { border-left-color: var(--status-warn) !important; }
    .card-main { display: flex; flex-direction: column; gap: 4px; }
    .card-name { font-size: 0.95rem; font-weight: 500; color: var(--accent); }
    .card-meta { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-secondary); }
    .meta-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--text-secondary); opacity: 0.4; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
    .footer-time { font-size: 0.75rem; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
    .empty-state { text-align: center; padding: 48px 24px; color: var(--text-secondary); grid-column: 1 / -1; }
    .empty-state mat-icon { font-size: 40px; opacity: 0.3; margin-bottom: 8px; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('donutChart', { static: false }) donutChartRef!: ElementRef;
  @ViewChild('topologyGraph', { static: false }) topologyRef!: ElementRef;

  entries: DashboardEntry[] = [];
  dependencies: ServiceDependency[] = [];
  recentAlerts: any[] = [];
  get totalCount(): number { return this.entries?.length ?? 0; }
  get upCount(): number { return this.entries?.filter(e => e.status === 'UP').length ?? 0; }
  get downCount(): number { return this.entries?.filter(e => e.status === 'DOWN').length ?? 0; }
  loading = true;
  unacknowledgedCount = 0;
  private destroy$ = new Subject<void>();
  private chart: any;
  private network: Network | null = null;

  constructor(
    private healthApi: HealthApiService,
    private alertApi: AlertApiService,
    private dependencyApi: DependencyApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    interval(15000).pipe(
      startWith(0),
      switchMap(() => forkJoin({
        health: this.healthApi.getLatest().pipe(catchError(() => of([] as DashboardEntry[]))),
        deps: this.dependencyApi.getAll().pipe(catchError(() => of([] as ServiceDependency[]))),
        alerts: this.alertApi.getAll(false, 0, 5).pipe(catchError(() => of({ content: [], totalElements: 0 })))
      })),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ health, deps, alerts }) => {
        this.entries = health;
        this.dependencies = deps;
        this.recentAlerts = alerts.content;
        this.loading = false;
        const newCount = alerts.totalElements;
        if (newCount > this.unacknowledgedCount && this.unacknowledgedCount !== 0) {
          this.snackBar.open(
            (newCount - this.unacknowledgedCount) + ' new unacknowledged alert(s)',
            'View',
            { duration: 5000 }
          );
        }
        this.unacknowledgedCount = newCount;
        setTimeout(() => {
          this.createDonutChart();
          this.createTopologyGraph();
        });
      },
      error: () => this.loading = false
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createDonutChart();
      this.createTopologyGraph();
    });
  }

  private createDonutChart(): void {
    if (!this.donutChartRef || !this.entries?.length) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const up = this.entries.filter(e => e.status === 'UP').length;
    const down = this.entries.filter(e => e.status === 'DOWN').length;
    const unknown = this.entries.filter(e => e.status === 'UNKNOWN').length;

    const opts: any = {
      container: this.donutChartRef.nativeElement,
      title: { text: 'Service Health', color: '#e3f2fd', fontSize: 14 },
      data: [
        { status: 'UP', count: up, color: '#29b6f6' },
        { status: 'DOWN', count: down, color: '#5c6bc0' },
        { status: 'UNKNOWN', count: unknown, color: '#78909c' },
      ].filter(d => d.count > 0),
      series: [{
        type: 'pie',
        angleKey: 'count',
        calloutLabelKey: 'status',
        fillKey: 'color',
        strokeWidth: 0,
        innerRadiusRatio: 0.6,
        calloutLabel: { enabled: true, color: '#e3f2fd', fontSize: 12 },
        sectorLabel: { enabled: true, color: '#e3f2fd', fontSize: 11, formatter: ({ value }: any) => String(value) },
      }],
      background: { fill: 'transparent' },
    };
    this.chart = AgCharts.create(opts);
  }

  private createTopologyGraph(): void {
    if (!this.topologyRef || !this.dependencies?.length || !this.entries?.length) return;
    if (this.network) { this.network.destroy(); this.network = null; }

    const nodes = this.entries.map(e => ({
      id: e.serviceId,
      label: e.serviceName,
      color: {
        background: e.status === 'UP' ? '#29b6f6' : e.status === 'DOWN' ? '#5c6bc0' : '#78909c',
        border: e.status === 'UP' ? '#4fc3f7' : e.status === 'DOWN' ? '#7986cb' : '#90a4ae',
        highlight: { background: '#42a5f5', border: '#90caf9' }
      },
      title: `${e.serviceName} (${e.status})`,
      borderWidth: 2,
      size: 22,
      font: { color: '#e3f2fd', size: 12, face: 'system-ui' }
    }));

    const edges = this.dependencies.map(d => ({
      from: d.sourceService.id,
      to: d.targetService.id,
      label: d.label,
      color: { color: 'rgba(120,144,156,0.5)', highlight: '#42a5f5', hover: '#42a5f5' },
      font: { color: '#78909c', size: 10, strokeWidth: 0, face: 'system-ui' },
      smooth: { type: 'curvedCW', roundness: 0.15 },
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      width: 1.5,
      hoverWidth: 2.5
    }));

    this.network = new Network(this.topologyRef.nativeElement, { nodes, edges } as any, {
      nodes: { shape: 'dot' },
      edges: {},
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -40, centralGravity: 0.005, springLength: 180, springConstant: 0.02, damping: 0.4 },
        stabilization: { iterations: 80 }
      },
      interaction: { hover: true, tooltipDelay: 150, dragNodes: true, dragView: true, zoomView: true },
      layout: { improvedLayout: true }
    });

    this.network.on('click', (params: any) => {
      if (params.nodes?.length) {
        const id = params.nodes[0];
        window.location.href = `/services/${id}`;
      }
    });
  }

  acknowledge(alert: any): void {
    this.alertApi.acknowledge(alert.id).subscribe(() => {
      this.snackBar.open('Alert acknowledged', 'Close', { duration: 2000 });
    });
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '--';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    return Math.floor(hours / 24) + 'd ago';
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
    if (this.network) this.network.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

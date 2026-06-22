import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, interval, switchMap, takeUntil, startWith, forkJoin, catchError, of } from 'rxjs';
import { HealthApiService } from '../../services/health-api.service';
import { AlertApiService } from '../../services/alert-api.service';
import { DependencyApiService } from '../../services/dependency-api.service';
import { DashboardEntry } from '../../models/page.model';
import { ServiceDependency } from '../../models/dependency.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgFor, NgIf, NgClass, DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule
  ],
  template: `
    <div class="page">
      <header class="topbar">
        <div>
          <h1 class="page-title">Infrastructure Overview</h1>
          <div class="page-sub">Last sync {{ lastSync }} · {{ totalCount }} monitored services</div>
        </div>
      </header>

      <div class="body">

        <!-- SKELETON LOADING -->
        @if (loading) {
          <div class="skeleton-grid">
            @for (_ of [0,0,0,0]; track _; let i = $index) {
              <div class="skeleton-card">
                <div class="skeleton-icon"></div>
                <div class="skeleton-line w-64"></div>
                <div class="skeleton-line w-90"></div>
              </div>
            }
          </div>
          <div class="skeleton-row">
            <div class="skeleton-donut"></div>
            <div class="skeleton-topo"></div>
          </div>
          <div class="skeleton-row">
            <div class="skeleton-alerts"></div>
            <div class="skeleton-services">
              @for (_ of [0,0,0,0,0,0]; track _) {
                <div class="skeleton-card h-124"></div>
              }
            </div>
          </div>
        }

        <!-- LOADED CONTENT -->
        @if (!loading) {

          <!-- STAT CARDS -->
          <div class="stat-grid">
            <div class="stat-card" style="--stat-color: var(--accent);">
              <span class="stat-glow"></span>
              <div class="stat-top">
                <div class="stat-icon-box" style="background: rgba(168,85,247,.12); color: var(--accent);">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>
                  </svg>
                </div>
                <span class="stat-delta">all regions</span>
              </div>
              <div class="stat-value">{{ totalCount }}</div>
              <div class="stat-label">Total services</div>
            </div>

            <div class="stat-card" style="--stat-color: var(--status-up);">
              <span class="stat-glow"></span>
              <div class="stat-top">
                <div class="stat-icon-box" style="background: rgba(52,211,153,.12); color: var(--status-up);">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4 12 14.01l-3-3"/>
                  </svg>
                </div>
                <span class="stat-delta">{{ pct(upCount) }}</span>
              </div>
              <div class="stat-value">{{ upCount }}</div>
              <div class="stat-label">Operational</div>
            </div>

            <div class="stat-card" style="--stat-color: var(--status-down);">
              <span class="stat-glow"></span>
              <div class="stat-top">
                <div class="stat-icon-box" style="background: rgba(168,85,247,.12); color: var(--status-down);">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>
                  </svg>
                </div>
                <span class="stat-delta">{{ downCount ? 'needs attention' : 'stable' }}</span>
              </div>
              <div class="stat-value">{{ downCount }}</div>
              <div class="stat-label">Down</div>
            </div>

            <div class="stat-card" style="--stat-color: var(--status-warn);">
              <span class="stat-glow"></span>
              <div class="stat-top">
                <div class="stat-icon-box" style="background: rgba(251,191,36,.12); color: var(--status-warn);">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>
                  </svg>
                </div>
                <span class="stat-delta">last hour</span>
              </div>
              <div class="stat-value">{{ unacknowledgedCount }}</div>
              <div class="stat-label">Active alerts</div>
            </div>
          </div>

          <!-- DONUT + TOPOLOGY -->
          <div class="row-2col">
            <section class="card">
              <div class="card-header">
                <h2>Status distribution</h2>
                <span class="badge-live">live</span>
              </div>
              <div class="donut-wrap">
                <svg width="190" height="190" viewBox="0 0 190 190" class="donut-svg">
                  <circle cx="95" cy="95" r="74" fill="none" stroke="rgba(255,255,255,.04)" stroke-width="18"/>
                  @for (seg of donutSegments; track seg) {
                    <circle cx="95" cy="95" r="74" fill="none" [attr.stroke]="seg.color" stroke-width="18" stroke-linecap="round" [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset"/>
                  }
                </svg>
                <div class="donut-center">
                  <div class="donut-total">{{ totalCount }}</div>
                  <div class="donut-label">services</div>
                </div>
              </div>
              <div class="donut-legend">
                @for (d of donutLegend; track d.label) {
                  <div class="legend-row">
                    <span class="legend-dot" [style.background]="d.color"></span>
                    <span class="legend-label">{{ d.label }}</span>
                    <span class="legend-count">{{ d.count }}</span>
                    <span class="legend-pct">{{ d.pct }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <div class="card-header">
                <h2>Service topology</h2>
                <div class="topo-legend">
                  <span class="topo-legend-item"><span class="topo-dot" style="background: var(--status-up);"></span>UP</span>
                  <span class="topo-legend-item"><span class="topo-dot" style="background: var(--status-down);"></span>DOWN</span>
                  <span class="topo-legend-item"><span class="topo-dot" style="background: var(--status-unknown);"></span>UNKNOWN</span>
                </div>
              </div>
              <div class="topo-svg-wrap">
                <svg viewBox="0 0 760 340" width="100%" height="100%" class="topo-svg">
                  @for (e of topoEdges; track $index) {
                    <line [attr.x1]="e.x1" [attr.y1]="e.y1" [attr.x2]="e.x2" [attr.y2]="e.y2" stroke="rgba(168,85,247,.18)" stroke-width="1.4"/>
                  }
                  @for (nd of topoNodes; track $index) {
                    <g class="topo-node" (click)="goService(nd.id)" style="cursor:pointer">
                      <circle [attr.cx]="nd.cx" [attr.cy]="nd.cy" [attr.r]="nd.halo" [attr.fill]="nd.glow" opacity="0.8"/>
                      <circle [attr.cx]="nd.cx" [attr.cy]="nd.cy" [attr.r]="nd.r" [attr.fill]="nd.fill" stroke="#0a0612" stroke-width="2.5"/>
                      <text [attr.x]="nd.cx" [attr.y]="nd.ty" text-anchor="middle" fill="#ab9ec6" font-size="12" font-family="Inter, sans-serif" font-weight="500">{{ nd.label }}</text>
                    </g>
                  }
                </svg>
              </div>
            </section>
          </div>

          <!-- ALERTS + SERVICES -->
          <div class="row-2col">
            <section class="card">
              <div class="card-header">
                <h2>Recent alerts</h2>
                <a class="card-link" routerLink="/alerts">View all</a>
              </div>
              <div class="alerts-list">
                @for (a of recentAlerts; track a.id) {
                  <div class="alert-item" [style.border-left-color]="a.color">
                    <span class="alert-dot" [style.background]="a.color" [style.box-shadow]="'0 0 0 4px ' + a.glow"></span>
                    <div class="alert-body">
                      <div class="alert-msg">{{ a.message }}</div>
                      <div class="alert-meta">
                        <span class="alert-service">{{ a.serviceName }}</span>
                        <span class="alert-time">{{ timeAgo(a.triggeredAt) }}</span>
                      </div>
                    </div>
                    <button class="alert-ack-btn" (click)="acknowledge(a)" title="Acknowledge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </button>
                  </div>
                }
                @if (recentAlerts.length === 0) {
                  <div class="empty-alerts">All clear — no active alerts.</div>
                }
              </div>
            </section>

            <section>
              <div class="service-header">
                <h2>Services</h2>
                <div class="filter-chips">
                  <span class="chip chip-active">All</span>
                  <span class="chip">Down only</span>
                </div>
              </div>
              <div class="service-grid">
                @for (sv of serviceCards; track sv.id) {
                  <a class="sv-card" [routerLink]="['/services', sv.id]">
                    <div class="sv-top">
                      <div class="sv-title-row">
                        <span class="sv-dot" [style.background]="sv.color" [style.boxShadow]="'0 0 0 3px ' + sv.glow"></span>
                        <span class="sv-name">{{ sv.name }}</span>
                      </div>
                      <div class="sv-type">{{ sv.type }}</div>
                    </div>
                    <div class="sv-metrics">
                      <div class="sv-metric">
                        <div class="sv-metric-label">Response</div>
                        <div class="sv-metric-value">{{ sv.rt }}</div>
                      </div>
                      <div class="sv-metric">
                        <div class="sv-metric-label">Uptime</div>
                        <div class="sv-metric-value">{{ sv.uptime }}</div>
                      </div>
                    </div>
                    <div class="sv-footer">
                      <span class="sv-time">{{ sv.time }}</span>
                      <span class="sv-badge" [style.color]="sv.color" [style.background]="sv.glow">{{ sv.statusLabel }}</span>
                    </div>
                  </a>
                }
              </div>
            </section>
          </div>

        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 0; max-width: 1200px; margin: 0 auto; }
    .topbar { padding: 26px 28px 6px; line-height: 1.2; }
    .page-title { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -.4px; color: var(--text-primary); }
    .page-sub { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }
    .body { padding: 6px 28px 40px; display: flex; flex-direction: column; gap: 22px; }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .skeleton-card { background: var(--surface-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px 20px; }
    .skeleton-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.05); animation: pulse 1.4s ease-in-out infinite; }
    .skeleton-line { height: 20px; border-radius: 6px; background: rgba(255,255,255,.05); margin-top: 14px; animation: pulse 1.4s ease-in-out infinite; }
    .skeleton-line.w-64 { width: 64px; }
    .skeleton-line.w-90 { width: 90px; margin-top: 9px; }
    .skeleton-row { display: grid; grid-template-columns: 360px 1fr; gap: 22px; }
    .skeleton-donut { height: 280px; border-radius: 14px; background: rgba(255,255,255,.03); animation: pulse 1.4s ease-in-out infinite; }
    .skeleton-topo { height: 280px; border-radius: 14px; background: rgba(255,255,255,.03); animation: pulse 1.4s ease-in-out infinite; }
    .skeleton-alerts { height: 320px; border-radius: 14px; background: rgba(255,255,255,.03); animation: pulse 1.4s ease-in-out infinite; }
    .skeleton-services { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 14px; }
    .h-124 { height: 124px; }

    /* Stat cards */
    .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
    .stat-card { position: relative; overflow: hidden; background: var(--surface-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px 20px; transition: border-color .18s, transform .18s; }
    .stat-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
    .stat-glow { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--stat-color); }
    .stat-glow::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 120px; background: linear-gradient(90deg, var(--stat-color), transparent); opacity: 0.12; pointer-events: none; }
    .stat-top { position: relative; display: flex; align-items: center; justify-content: space-between; }
    .stat-icon-box { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-delta { font-size: 11.5px; font-weight: 600; color: var(--stat-color); opacity: .9; white-space: nowrap; }
    .stat-value { position: relative; font-size: 28px; font-weight: 700; letter-spacing: -1px; margin-top: 12px; line-height: 1; color: var(--text-primary); }
    .stat-label { position: relative; font-size: 12.5px; color: var(--text-muted); margin-top: 6px; font-weight: 500; }

    /* Cards */
    .card { background: var(--surface-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px 22px; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .card-header h2 { margin: 0; font-size: 14.5px; font-weight: 600; }
    .card-link { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 500; }
    .badge-live { font-size: 11px; color: var(--text-muted); background: rgba(255,255,255,.03); padding: 3px 9px; border-radius: 20px; }

    /* 2-column row */
    .row-2col { display: grid; grid-template-columns: 360px 1fr; gap: 22px; align-items: start; }

    /* Donut */
    .donut-wrap { position: relative; display: flex; justify-content: center; align-items: center; padding: 22px 0 16px; }
    .donut-svg { display: block; }
    .donut-center { position: absolute; text-align: center; line-height: 1; }
    .donut-total { font-size: 38px; font-weight: 700; letter-spacing: -1.5px; color: var(--text-primary); }
    .donut-label { font-size: 11.5px; color: var(--text-muted); margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
    .donut-legend { display: flex; flex-direction: column; gap: 9px; }
    .legend-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
    .legend-label { color: #b9acd4; }
    .legend-count { margin-left: auto; font-weight: 600; color: var(--text-primary); }
    .legend-pct { color: var(--text-muted); width: 42px; text-align: right; }

    /* Topology */
    .topo-legend { display: flex; align-items: center; gap: 16px; }
    .topo-legend-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #9486ad; }
    .topo-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
    .topo-svg-wrap { border-radius: 12px; background: radial-gradient(circle at 50% 45%, rgba(168,85,247,.05), transparent 70%); border: 1px solid rgba(168,85,247,.06); min-height: 300px; }
    .topo-svg { display: block; }
    .topo-node { transition: opacity .15s; }
    .topo-node:hover { opacity: .8; }

    /* Alerts */
    .alerts-list { display: flex; flex-direction: column; gap: 9px; margin-top: 8px; }
    .alert-item { display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: 10px; background: rgba(255,255,255,.022); border-left: 3px solid; transition: background .16s; }
    .alert-item:hover { background: rgba(255,255,255,.045); }
    .alert-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
    .alert-body { min-width: 0; flex: 1; }
    .alert-msg { font-size: 12.8px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e4dbf7; }
    .alert-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .alert-service { font-size: 10.5px; font-weight: 600; color: #ab9ec6; background: rgba(168,85,247,.08); padding: 1px 7px; border-radius: 5px; }
    .alert-time { font-size: 11px; color: var(--text-muted); }
    .alert-ack-btn { flex: none; width: 28px; height: 28px; border-radius: 8px; background: transparent; border: 1px solid var(--border-color); color: #8175a0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: border-color .16s, color .16s; }
    .alert-ack-btn:hover { border-color: rgba(52,211,153,.5); color: var(--status-up); }
    .empty-alerts { text-align: center; padding: 22px 0; color: var(--text-muted); font-size: 13px; }

    /* Service grid */
    .service-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .service-header h2 { margin: 0; font-size: 14.5px; font-weight: 600; }
    .filter-chips { display: flex; gap: 6px; }
    .chip { font-size: 12px; color: #9486ad; padding: 5px 12px; border-radius: 8px; cursor: pointer; transition: color .15s, background .15s; }
    .chip:hover { color: var(--text-primary); }
    .chip-active { color: var(--text-primary); background: rgba(168,85,247,.12); font-weight: 500; }
    .service-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 14px; }
    .sv-card { display: block; position: relative; background: var(--surface-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px 17px; cursor: pointer; transition: border-color .18s, transform .18s; text-decoration: none; color: inherit; }
    .sv-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
    .sv-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .sv-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
    .sv-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
    .sv-type { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; margin-left: 16px; }
    .sv-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 15px; }
    .sv-metric-label { font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; }
    .sv-metric-value { font-size: 15px; font-weight: 600; margin-top: 3px; color: var(--text-primary); }
    .sv-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; }
    .sv-time { font-size: 11px; color: var(--text-muted); }
    .sv-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: .5px; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  entries: DashboardEntry[] = [];
  dependencies: ServiceDependency[] = [];
  recentAlerts: any[] = [];
  loading = true;
  unacknowledgedCount = 0;
  lastSync = 'just now';
  private destroy$ = new Subject<void>();

  get totalCount(): number { return this.entries?.length ?? 0; }
  get upCount(): number { return this.entries?.filter(e => e.status === 'UP').length ?? 0; }
  get downCount(): number { return this.entries?.filter(e => e.status === 'DOWN').length ?? 0; }

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
        this.lastSync = 'just now';
        this.recentAlerts = alerts.content.map((a: any) => ({
          ...a,
          color: a.severity === 'CRITICAL' ? '#f87171' : a.severity === 'WARNING' ? '#fbbf24' : '#a855f7',
          glow: a.severity === 'CRITICAL' ? 'rgba(248,113,113,.16)' : a.severity === 'WARNING' ? 'rgba(251,191,36,.16)' : 'rgba(168,85,247,.16)',
          serviceName: a.service?.name || 'Unknown'
        }));
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
      },
      error: () => this.loading = false
    });
  }

  get donutSegments(): any[] {
    const total = this.totalCount || 1;
    const C = 2 * Math.PI * 74;
    const segs = [
      { n: this.upCount, color: '#34d399' },
      { n: this.downCount, color: '#a855f7' },
      { n: this.entries.filter(e => e.status === 'UNKNOWN').length, color: '#64748b' },
    ].filter(s => s.n > 0);
    let acc = 0;
    return segs.map(s => {
      const frac = s.n / total;
      const len = Math.max(frac * C - 4, 0.1);
      const seg = { color: s.color, dash: `${len} ${C}`, offset: -(acc * C) };
      acc += frac;
      return seg;
    });
  }

  get donutLegend(): any[] {
    const total = this.totalCount || 1;
    const pct = (n: number) => Math.round((n / total) * 100) + '%';
    return [
      { label: 'Operational', color: '#34d399', count: this.upCount, pct: pct(this.upCount) },
      { label: 'Down', color: '#a855f7', count: this.downCount, pct: pct(this.downCount) },
      { label: 'Unknown', color: '#64748b', count: this.entries.filter(e => e.status === 'UNKNOWN').length, pct: pct(this.entries.filter(e => e.status === 'UNKNOWN').length) },
    ];
  }

  get topoNodes(): any[] {
    if (!this.entries.length) return [];
    const cx0 = 380, cy0 = 170, R = 122;
    const nodes = [{ cx: cx0, cy: cy0, r: 16, halo: 26, fill: '#a855f7', glow: 'rgba(168,85,247,.14)', label: 'gateway', ty: cy0 + 34, id: 'gateway' }];
    const statusColor = (s: string) => s === 'UP' ? '#34d399' : s === 'DOWN' ? '#a855f7' : '#64748b';
    const statusGlow = (s: string) => s === 'UP' ? 'rgba(52,211,153,.14)' : s === 'DOWN' ? 'rgba(168,85,247,.14)' : 'rgba(100,116,139,.16)';
    this.entries.slice(0, 7).forEach((sv, i) => {
      const ang = (i / Math.min(this.entries.length, 7)) * Math.PI * 2 - Math.PI / 2;
      const x = cx0 + Math.cos(ang) * R;
      const y = cy0 + Math.sin(ang) * R * 0.92;
      nodes.push({ cx: x, cy: y, r: 11, halo: 19, fill: statusColor(sv.status), glow: statusGlow(sv.status), label: sv.serviceName, ty: y < cy0 ? y - 18 : y + 28, id: sv.serviceId });
    });
    return nodes;
  }

  get topoEdges(): any[] {
    if (!this.entries.length || !this.dependencies.length) return [];
    const cx0 = 380, cy0 = 170, R = 122;
    const nodePositions: Record<string, {cx: number, cy: number}> = {};
    const center = { cx: cx0, cy: cy0 };
    this.entries.slice(0, 7).forEach((sv, i) => {
      const ang = (i / Math.min(this.entries.length, 7)) * Math.PI * 2 - Math.PI / 2;
      nodePositions[sv.serviceId] = {
        cx: cx0 + Math.cos(ang) * R,
        cy: cy0 + Math.sin(ang) * R * 0.92
      };
    });
    const edges: any[] = [];
    this.dependencies.forEach(d => {
      const src = nodePositions[d.sourceService.id];
      const tgt = nodePositions[d.targetService.id];
      if (src && tgt) {
        edges.push({ x1: src.cx, y1: src.cy, x2: tgt.cx, y2: tgt.cy });
      } else if (src) {
        edges.push({ x1: cx0, y1: cy0, x2: src.cx, y2: src.cy });
      }
    });
    return edges;
  }

  get serviceCards(): any[] {
    const statusColor = (s: string) => s === 'UP' ? '#34d399' : s === 'DOWN' ? '#a855f7' : '#64748b';
    const statusGlow = (s: string) => s === 'UP' ? 'rgba(52,211,153,.12)' : s === 'DOWN' ? 'rgba(168,85,247,.12)' : 'rgba(100,116,139,.12)';
    return this.entries.map(e => ({
      id: e.serviceId,
      name: e.serviceName,
      type: e.serviceType,
      rt: e.responseTimeMs != null ? e.responseTimeMs + 'ms' : '—',
      uptime: '—',
      time: e.checkedAt ? this.timeAgo(e.checkedAt) : '--',
      statusLabel: e.status,
      color: statusColor(e.status),
      glow: statusGlow(e.status),
      status: e.status,
    }));
  }

  pct(n: number): string {
    return Math.round((n / Math.max(this.totalCount, 1)) * 100) + '%';
  }

  goService(id: string): void {
    if (id && id !== 'gateway') {
      window.location.href = `/services/${id}`;
    }
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
    this.destroy$.next();
    this.destroy$.complete();
  }
}

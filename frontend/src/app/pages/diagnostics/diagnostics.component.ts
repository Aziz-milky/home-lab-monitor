import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { DiagnosticReport } from '../../models/diagnostic.model';

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [
    NgFor, NgIf, NgClass, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Metrics</h1>
      </div>

      @if (loading) {
        <mat-spinner diameter="36" />
      }

      @if (!loading) {
        <div class="diag-summary">
          <div class="diag-stat"><span class="diag-stat-value">{{ reports.length }}</span><span class="diag-stat-label">Services</span></div>
          <div class="diag-stat"><span class="diag-stat-value">{{ avgScore }}</span><span class="diag-stat-label">Avg Score</span></div>
          <div class="diag-stat warn-stat"><span class="diag-stat-value">{{ totalIssues }}</span><span class="diag-stat-label">Issues</span></div>
        </div>

        <div class="reports-list">
          @for (r of reports; track r.serviceId) {
            <mat-card class="report-card" [ngClass]="'score-' + scoreBand(r.healthScore)">
              <div class="report-header">
                <div class="report-name-group">
                  <a class="report-name" [routerLink]="['/services', r.serviceId]">{{ r.serviceName }}</a>
                  <span class="report-type">{{ r.serviceType }}</span>
                </div>
                <div class="report-score">
                  <span class="score-value">{{ r.healthScore }}</span>
                  <span class="score-label">/100</span>
                </div>
              </div>

              <div class="report-metrics">
                <div class="metric"><span class="metric-value">{{ (r.uptime24h * 100).toFixed(1) }}%</span><span class="metric-label">24h uptime</span></div>
                <div class="metric"><span class="metric-value">{{ r.avgResponseTimeMs.toFixed(0) }}ms</span><span class="metric-label">avg response</span></div>
                <div class="metric"><span class="metric-value">{{ r.activeAlerts }}</span><span class="metric-label">alerts</span></div>
                <div class="metric"><span class="metric-value" [ngClass]="trendClass(r.trend)">{{ r.trend }}</span><span class="metric-label">trend</span></div>
              </div>

              @if (r.issues.length > 0) {
                <div class="issues-list">
                  @for (issue of r.issues; track issue.type + issue.description) {
                    <div class="issue" [ngClass]="'sev-' + issue.severity.toLowerCase()">
                      <span class="issue-type">{{ issue.type }}</span>
                      <span class="issue-desc">{{ issue.description }}</span>
                    </div>
                  }
                </div>
              }

              @if (r.aiInsight) {
                <div class="ai-insight">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 3h-2v10h2z"/><path d="M13 17h-2v4h2z"/></svg>
                  <span>{{ r.aiInsight }}</span>
                </div>
              }
            </mat-card>
          }
          @if (reports.length === 0) {
            <div class="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="opacity:.3"><path d="M3 3v18h18"/><path d="M7 14l3-4 3 2 4-6"/></svg>
              <p>No services to analyze.</p>
              <button mat-raised-button color="primary" routerLink="/services">Add Service</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -.4px; }
    .diag-summary { display: flex; gap: 14px; margin-bottom: 24px; }
    .diag-stat { background: var(--surface-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 24px; min-width: 120px; }
    .diag-stat-value { display: block; font-size: 24px; font-weight: 700; letter-spacing: -.4px; }
    .diag-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-top: 2px; font-weight: 600; }
    .warn-stat .diag-stat-value { color: var(--status-warn); }
    .reports-list { display: flex; flex-direction: column; gap: 12px; }
    .report-card { padding: 20px; border-left: 3px solid rgba(168,85,247,.12) !important; }
    .report-card.score-high { border-left-color: #34d399 !important; }
    .report-card.score-mid { border-left-color: #fbbf24 !important; }
    .report-card.score-low { border-left-color: #ef4444 !important; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .report-name-group { display: flex; align-items: center; gap: 8px; }
    .report-name { font-size: 15px; font-weight: 600; }
    .report-type { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
    .report-score { text-align: right; }
    .score-value { font-size: 22px; font-weight: 700; letter-spacing: -.3px; }
    .score-label { font-size: 11px; color: var(--text-muted); margin-left: 2px; }
    .report-metrics { display: flex; gap: 24px; margin-bottom: 12px; flex-wrap: wrap; }
    .metric { display: flex; flex-direction: column; gap: 1px; }
    .metric-value { font-size: 14px; font-weight: 600; }
    .metric-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
    .trend-degrading { color: var(--status-warn); }
    .trend-improving { color: var(--status-up); }
    .trend-stable { color: var(--text-muted); }
    .issues-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
    .issue { display: flex; gap: 8px; font-size: 12px; padding: 6px 10px; border-radius: 6px; }
    .sev-critical { background: rgba(239,68,68,.08); }
    .sev-warning { background: rgba(251,191,36,.07); }
    .sev-info { background: rgba(168,85,247,.07); }
    .issue-type { font-weight: 600; min-width: 70px; color: var(--text-primary); }
    .issue-desc { color: var(--text-secondary); }
    .ai-insight { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--text-secondary); padding: 10px 12px; background: rgba(168,85,247,.06); border-radius: 8px; }
    .ai-insight svg { flex: none; margin-top: 1px; opacity: .6; }
    .ai-insight.loading { opacity: .5; }
    .ai-insight.disabled { background: transparent; border: 1px dashed var(--border-color); }
    .empty-state { text-align: center; padding: 48px 24px; color: var(--text-muted); }
    .empty-state p { font-size: 14px; }
    mat-spinner { margin: 40px auto; }
  `]
})
export class DiagnosticsComponent implements OnInit {
  reports: DiagnosticReport[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  get avgScore(): number {
    if (!this.reports.length) return 0;
    return Math.round(this.reports.reduce((s, r) => s + r.healthScore, 0) / this.reports.length);
  }

  get totalIssues(): number {
    return this.reports.reduce((s, r) => s + r.issues.length, 0);
  }

  constructor(private diagnosticApi: DiagnosticApiService) {}

  ngOnInit(): void {
    this.diagnosticApi.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.reports = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  scoreBand(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
  }

  trendClass(trend: string): string {
    return 'trend-' + trend;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil } from 'rxjs';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { DiagnosticReport } from '../../models/diagnostic.model';

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [
    NgFor, NgIf, NgClass, DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatExpansionModule
  ],
  template: `
    <div class="page">
      <h1 class="page-title">Diagnostics</h1>

      @if (loading) {
        <mat-spinner diameter="36" />
      }

      @if (!loading) {
        <div class="summary-grid">
          <mat-card class="stat-card">
            <span class="stat-value">{{ reports.length }}</span>
            <span class="stat-label">Services</span>
          </mat-card>
          <mat-card class="stat-card">
            <span class="stat-value">{{ avgScore }}</span>
            <span class="stat-label">Avg Score</span>
          </mat-card>
          <mat-card class="stat-card warn-card">
            <span class="stat-value">{{ totalIssues }}</span>
            <span class="stat-label">Issues</span>
          </mat-card>
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

              @if (r.aiAvailable && r.aiInsight) {
                <div class="ai-insight">
                  <mat-icon>auto_awesome</mat-icon>
                  <span>{{ r.aiInsight }}</span>
                </div>
              }
              @if (r.aiAvailable && !r.aiInsight) {
                <div class="ai-insight loading">
                  <mat-icon>hourglass_empty</mat-icon>
                  <span>AI analysis pending...</span>
                </div>
              }
              @if (!r.aiAvailable) {
                <div class="ai-insight disabled">
                  <mat-icon>smartphone</mat-icon>
                  <span>AI diagnostics not configured (set ollama.enabled=true)</span>
                </div>
              }
            </mat-card>
          }
          @if (reports.length === 0) {
            <div class="empty-state">
              <mat-icon>insights</mat-icon>
              <p>No services to analyze.</p>
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
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: var(--surface-bg) !important; color: var(--text-primary) !important; text-align: center; padding: 14px 8px; border-left: 3px solid rgba(66,165,245,0.15) !important; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 300; line-height: 1.2; }
    .stat-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); margin-top: 2px; }
    .warn-card { border-left-color: var(--status-warn) !important; }
    .reports-list { display: flex; flex-direction: column; gap: 12px; }
    .report-card { background: var(--surface-bg) !important; padding: 16px; border-left: 3px solid rgba(66,165,245,0.12) !important; }
    .report-card.score-high { border-left-color: #4fc3f7 !important; }
    .report-card.score-mid { border-left-color: #42a5f5 !important; }
    .report-card.score-low { border-left-color: #5c6bc0 !important; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .report-name-group { display: flex; align-items: center; gap: 8px; }
    .report-name { font-size: 1rem; font-weight: 500; color: var(--accent); }
    .report-type { font-size: 0.75rem; color: var(--text-secondary); }
    .report-score { text-align: right; }
    .score-value { font-size: 1.5rem; font-weight: 300; }
    .score-label { font-size: 0.75rem; color: var(--text-secondary); margin-left: 2px; }
    .report-metrics { display: flex; gap: 20px; margin-bottom: 8px; }
    .metric { display: flex; flex-direction: column; }
    .metric-value { font-size: 0.9rem; font-weight: 500; }
    .metric-label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .trend-degrading { color: #5c6bc0; }
    .trend-improving { color: #4fc3f7; }
    .trend-stable { color: var(--text-secondary); }
    .issues-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
    .issue { display: flex; gap: 8px; font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; }
    .sev-critical { background: rgba(92,107,192,0.1); }
    .sev-warning { background: rgba(66,165,245,0.08); }
    .sev-info { background: rgba(144,164,174,0.06); }
    .issue-type { font-weight: 500; min-width: 70px; color: var(--text-primary); }
    .issue-desc { color: var(--text-secondary); }
    .ai-insight { display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; color: var(--text-secondary); padding: 8px; background: rgba(66,165,245,0.06); border-radius: 4px; }
    .ai-insight mat-icon { font-size: 16px; width: 16px; height: 16px; margin-top: 2px; opacity: 0.6; }
    .ai-insight.loading { opacity: 0.5; }
    .ai-insight.disabled { background: transparent; }
    .empty-state { text-align: center; padding: 48px 24px; color: var(--text-secondary); }
    .empty-state mat-icon { font-size: 40px; opacity: 0.3; margin-bottom: 8px; }
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

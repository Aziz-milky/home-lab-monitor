import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AgCharts } from 'ag-charts-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-charts-community';

ModuleRegistry.register(AllCommunityModule as any);
import { ServiceApiService } from '../../services/service-api.service';
import { HealthApiService } from '../../services/health-api.service';
import { AlertRuleApiService } from '../../services/alert-rule-api.service';
import { Service } from '../../models/service.model';
import { HealthCheck } from '../../models/health-check.model';
import { AlertRule } from '../../models/alert-rule.model';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { AlertRuleFormDialogComponent } from '../../dialogs/alert-rule-form-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [
    NgFor, NgIf, DatePipe, RouterLink,
    MatCardModule, MatTableModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule,
    StatusBadgeComponent
  ],
  template: `
    <div class="page">
      <ng-container *ngIf="loading; else content">
        <mat-spinner diameter="40" />
      </ng-container>

      <ng-template #content>
        <div class="page-header">
          <a routerLink="/services" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
            Services
          </a>
          <h1>{{ service?.name }}</h1>
        </div>

        <mat-card class="info-card">
          <mat-card-content class="info-grid">
            <div class="info-item"><span class="info-label">Host</span><span class="info-value">{{ service?.host }}:{{ service?.port }}</span></div>
            <div class="info-item"><span class="info-label">Type</span><span class="info-value">{{ service?.serviceType }}</span></div>
            <div class="info-item"><span class="info-label">Check URL</span><span class="info-value">{{ service?.checkUrl || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Active</span><span class="info-value">{{ service?.active ? 'Yes' : 'No' }}</span></div>
            <div class="info-item"><span class="info-label">Created</span><span class="info-value">{{ service?.createdAt | date:'medium' }}</span></div>
          </mat-card-content>
        </mat-card>

        @if (chartData.length > 0) {
          <h2 class="section-title">Response Time</h2>
          <mat-card class="chart-card">
            <div #lineChart class="line-chart"></div>
          </mat-card>
        }

        <h2 class="section-title">Health Check History</h2>
        <table mat-table [dataSource]="healthChecks">

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let h">
              <app-status-badge [status]="h.status" />
            </td>
          </ng-container>

          <ng-container matColumnDef="responseTime">
            <th mat-header-cell *matHeaderCellDef>Response Time</th>
            <td mat-cell *matCellDef="let h">{{ h.responseTimeMs }} ms</td>
          </ng-container>

          <ng-container matColumnDef="httpStatus">
            <th mat-header-cell *matHeaderCellDef>HTTP Status</th>
            <td mat-cell *matCellDef="let h">{{ h.httpStatus }}</td>
          </ng-container>

          <ng-container matColumnDef="error">
            <th mat-header-cell *matHeaderCellDef>Error</th>
            <td mat-cell *matCellDef="let h">{{ h.errorMessage || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="checkedAt">
            <th mat-header-cell *matHeaderCellDef>Checked At</th>
            <td mat-cell *matCellDef="let h">{{ h.checkedAt | date:'medium' }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="healthColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: healthColumns;"></tr>

          <tr class="mat-row" *ngIf="healthChecks.length === 0">
            <td class="mat-cell empty" [attr.colspan]="healthColumns.length">No health checks yet.</td>
          </tr>
        </table>

        <div class="section-header">
          <h2 class="section-title" style="margin:0">Alert Rules</h2>
          <button mat-raised-button color="primary" (click)="addRule()">+ Add Rule</button>
        </div>

        <table mat-table [dataSource]="rules">

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Rule Type</th>
            <td mat-cell *matCellDef="let r">{{ r.ruleType }}</td>
          </ng-container>

          <ng-container matColumnDef="threshold">
            <th mat-header-cell *matHeaderCellDef>Threshold</th>
            <td mat-cell *matCellDef="let r">{{ r.ruleType === 'RESPONSE_TIME' ? (r.thresholdMs + ' ms') : (r.failureCount + ' failures') }}</td>
          </ng-container>

          <ng-container matColumnDef="enabled">
            <th mat-header-cell *matHeaderCellDef>Enabled</th>
            <td mat-cell *matCellDef="let r">{{ r.enabled ? 'Yes' : 'No' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button (click)="deleteRule(r)" matTooltip="Delete">
                <span class="mi">delete</span>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="ruleColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: ruleColumns;"></tr>

          <tr class="mat-row" *ngIf="rules.length === 0">
            <td class="mat-cell empty" [attr.colspan]="ruleColumns.length">No alert rules.</td>
          </tr>
        </table>
      </ng-template>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 8px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -.4px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
    .back-link:hover { color: var(--accent); }
    .info-card { margin-bottom: 24px; }
    .info-grid { display: flex; flex-wrap: wrap; gap: 20px; padding: 4px 0; }
    .info-item { display: flex; flex-direction: column; gap: 2px; min-width: 150px; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-weight: 600; }
    .info-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }
    .section-title { font-size: 15px; font-weight: 600; margin: 28px 0 14px; letter-spacing: -.2px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin: 28px 0 14px; }
    .chart-card { margin-bottom: 24px; padding: 16px !important; }
    .line-chart { width: 100%; height: 250px; }
    .empty { text-align: center; padding: 24px; color: var(--text-muted); }
    mat-spinner { margin: 40px auto; }
  `]
})
export class ServiceDetailComponent implements OnInit, OnDestroy {
  @ViewChild('lineChart', { static: false }) lineChartRef!: ElementRef;
  service: Service | null = null;
  healthChecks: HealthCheck[] = [];
  chartData: { time: string; responseTime: number; status: string }[] = [];
  rules: AlertRule[] = [];
  healthColumns = ['status', 'responseTime', 'httpStatus', 'error', 'checkedAt'];
  ruleColumns = ['type', 'threshold', 'enabled', 'actions'];
  loading = true;
  private chart: any;
  private serviceId = '';

  constructor(
    private route: ActivatedRoute,
    private serviceApi: ServiceApiService,
    private healthApi: HealthApiService,
    private ruleApi: AlertRuleApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id')!;
    this.loadData();
  }

  private loadData(): void {
    this.serviceApi.getById(this.serviceId).subscribe(s => this.service = s);
    this.healthApi.getHistory(this.serviceId, 0, 100).subscribe({
      next: (page) => {
        this.healthChecks = page.content;
        this.chartData = [...page.content]
          .reverse()
          .filter(h => h.responseTimeMs > 0)
          .map(h => ({
            time: new Date(h.checkedAt).toLocaleTimeString(),
            responseTime: h.responseTimeMs,
            status: h.status
          }));
        setTimeout(() => this.createLineChart(), 100);
      }
    });
    this.ruleApi.getAll().subscribe({
      next: (page) => {
        this.rules = page.content.filter(r => r.service.id === this.serviceId);
        this.loading = false;
        setTimeout(() => this.createLineChart(), 200);
      },
      error: () => {
        this.loading = false;
        setTimeout(() => this.createLineChart(), 200);
      }
    });
  }

  private createLineChart(): void {
    if (!this.lineChartRef || this.chartData.length === 0) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const opts: any = {
      container: this.lineChartRef.nativeElement,
      data: this.chartData,
      series: [{
        type: 'line',
        xKey: 'time',
        yKey: 'responseTime',
        yName: 'Response Time (ms)',
        stroke: '#a855f7',
        marker: {
          enabled: true,
          size: 5,
          fill: '#a855f7',
          stroke: '#0a0612',
          strokeWidth: 2,
        },
      }],
      axes: [
        { type: 'category', position: 'bottom' as const, title: { text: 'Time', color: '#6f648e' }, label: { color: '#6f648e', fontSize: 10 } },
        { type: 'number', position: 'left' as const, title: { text: 'ms', color: '#6f648e' }, label: { color: '#6f648e', fontSize: 10 } },
      ],
      background: { fill: 'transparent' },
    };
    this.chart = AgCharts.create(opts);
  }

  addRule(): void {
    const ref = this.dialog.open(AlertRuleFormDialogComponent, {
      width: '500px',
      data: { serviceId: this.serviceId }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.ruleApi.create(result).subscribe(() => {
          this.snackBar.open('Rule created', 'Close', { duration: 2000 });
          this.loadData();
        });
      }
    });
  }

  deleteRule(rule: AlertRule): void {
    if (confirm('Delete this rule?')) {
      this.ruleApi.delete(rule.id).subscribe(() => {
        this.snackBar.open('Rule deleted', 'Close', { duration: 2000 });
        this.loadData();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }
}

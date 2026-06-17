import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    NgFor, NgIf, DatePipe,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule,
    StatusBadgeComponent
  ],
  template: `
    <ng-container *ngIf="loading; else content">
      <mat-spinner diameter="40" />
    </ng-container>

    <ng-template #content>
      <h1>{{ service?.name }}</h1>

      <mat-card class="info-card">
        <mat-card-content class="info-grid">
          <div><strong>Host:</strong> {{ service?.host }}:{{ service?.port }}</div>
          <div><strong>Type:</strong> {{ service?.serviceType }}</div>
          <div><strong>Check URL:</strong> {{ service?.checkUrl || '-' }}</div>
          <div><strong>Active:</strong> {{ service?.active ? 'Yes' : 'No' }}</div>
          <div><strong>Created:</strong> {{ service?.createdAt | date:'medium' }}</div>
        </mat-card-content>
      </mat-card>

      @if (chartData.length > 0) {
        <h2>Response Time</h2>
        <mat-card class="chart-card">
          <div #lineChart class="line-chart"></div>
        </mat-card>
      }

      <h2>Health Check History</h2>
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

      <h2>Alert Rules</h2>
      <button mat-raised-button color="primary" (click)="addRule()" class="add-rule-btn">Add Rule</button>

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
              <mat-icon>delete</mat-icon>
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
  `,
  styles: [`
    .info-card { margin-bottom: 24px; }
    .info-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .info-grid div { min-width: 180px; }
    .chart-card { margin-bottom: 24px; padding: 8px !important; }
    .line-chart { width: 100%; height: 250px; }
    .empty { text-align: center; padding: 24px; color: #888; }
    .add-rule-btn { margin-bottom: 12px; }
    mat-spinner { margin: 40px auto; }
  `]
})
export class ServiceDetailComponent implements OnInit, OnDestroy, AfterViewInit {
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

  ngAfterViewInit(): void {
    setTimeout(() => this.createLineChart());
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
        setTimeout(() => this.createLineChart());
      }
    });
    this.ruleApi.getAll().subscribe({
      next: (page) => {
        this.rules = page.content.filter(r => r.service.id === this.serviceId);
        this.loading = false;
      },
      error: () => this.loading = false
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
        stroke: '#42a5f5',
        marker: {
          enabled: true,
          size: 5,
          fill: '#42a5f5',
          stroke: '#0d0d1f',
          strokeWidth: 1,
        },
      }],
      axes: [
        { type: 'category', position: 'bottom' as const, title: { text: 'Time', color: '#78909c' }, label: { color: '#78909c', fontSize: 10 } },
        { type: 'number', position: 'left' as const, title: { text: 'ms', color: '#78909c' }, label: { color: '#78909c', fontSize: 10 } },
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

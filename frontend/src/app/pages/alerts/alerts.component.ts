import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertApiService } from '../../services/alert-api.service';
import { Alert } from '../../models/alert.model';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    NgFor, NgIf, DatePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Alerts</h1>
        <mat-slide-toggle [(ngModel)]="showUnacknowledgedOnly" (toggleChange)="loadAlerts()" *ngIf="!loading" class="filter-toggle">
          Unacknowledged only
        </mat-slide-toggle>
      </div>

      <mat-spinner *ngIf="loading" diameter="36" />

      <table mat-table [dataSource]="alerts" *ngIf="!loading">

        <ng-container matColumnDef="severity">
          <th mat-header-cell *matHeaderCellDef>Severity</th>
          <td mat-cell *matCellDef="let a">
            <span class="sev-chip" [class.sev-critical]="a.severity === 'CRITICAL'" [class.sev-warning]="a.severity === 'WARNING'" [class.sev-info]="a.severity === 'INFO'">{{ a.severity }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="message">
          <th mat-header-cell *matHeaderCellDef>Message</th>
          <td mat-cell *matCellDef="let a">{{ a.message }}</td>
        </ng-container>

        <ng-container matColumnDef="triggeredAt">
          <th mat-header-cell *matHeaderCellDef>Triggered</th>
          <td mat-cell *matCellDef="let a">{{ a.triggeredAt | date:'medium' }}</td>
        </ng-container>

        <ng-container matColumnDef="acknowledged">
          <th mat-header-cell *matHeaderCellDef>Acknowledged</th>
          <td mat-cell *matCellDef="let a">{{ a.acknowledged ? (a.acknowledgedAt | date:'short') : 'No' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let a">
            <button mat-stroked-button (click)="toggleAck(a)" class="ack-btn">
              {{ a.acknowledged ? 'Un-ack' : 'Acknowledge' }}
            </button>
            <button mat-icon-button color="warn" (click)="deleteAlert(a)" matTooltip="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *ngIf="alerts.length === 0">
          <td class="mat-cell empty" [attr.colspan]="displayedColumns.length">No alerts.</td>
        </tr>
      </table>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -.4px; }
    .filter-toggle { font-size: 12px; }
    .empty { text-align: center; padding: 32px; color: var(--text-muted); }
    mat-spinner { margin: 40px auto; }
    .sev-chip { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 3px 10px; border-radius: 20px; }
    .sev-critical { background: rgba(239,68,68,.15); color: #ef4444; }
    .sev-warning { background: rgba(251,191,36,.12); color: #fbbf24; }
    .sev-info { background: rgba(168,85,247,.12); color: #c084fc; }
    .ack-btn { font-size: 12px; padding: 0 12px; line-height: 30px; border-radius: 6px; border-color: var(--border-color) !important; color: var(--text-secondary) !important; min-width: 0; }
    .ack-btn:hover { border-color: var(--accent) !important; color: var(--text-primary) !important; }
  `]
})
export class AlertsComponent implements OnInit {
  alerts: Alert[] = [];
  displayedColumns = ['severity', 'message', 'triggeredAt', 'acknowledged', 'actions'];
  showUnacknowledgedOnly = false;
  loading = true;

  constructor(
    private api: AlertApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    const obs = this.showUnacknowledgedOnly
      ? this.api.getAll(false)
      : this.api.getAll();
    obs.subscribe({
      next: (page) => { this.alerts = page.content; this.loading = false; },
      error: () => { this.loading = false; this.snackBar.open('Failed to load alerts', 'Close', { duration: 3000 }); }
    });
  }

  toggleAck(alert: Alert): void {
    this.api.acknowledge(alert.id).subscribe(() => {
      this.snackBar.open(
        alert.acknowledged ? 'Alert un-acknowledged' : 'Alert acknowledged',
        'Close', { duration: 2000 }
      );
      this.loadAlerts();
    });
  }

  deleteAlert(alert: Alert): void {
    if (confirm('Delete this alert?')) {
      this.api.delete(alert.id).subscribe(() => {
        this.snackBar.open('Alert deleted', 'Close', { duration: 2000 });
        this.loadAlerts();
      });
    }
  }

}

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
    MatSlideToggleModule, MatProgressSpinnerModule, MatChipsModule
  ],
  template: `
    <div class="header-row">
      <h1>Alerts</h1>
      <mat-slide-toggle [(ngModel)]="showUnacknowledgedOnly" (toggleChange)="loadAlerts()" *ngIf="!loading">
        Unacknowledged only
      </mat-slide-toggle>
    </div>

    <mat-spinner *ngIf="loading" diameter="40" />

    <table mat-table [dataSource]="alerts" *ngIf="!loading">

      <ng-container matColumnDef="severity">
        <th mat-header-cell *matHeaderCellDef>Severity</th>
        <td mat-cell *matCellDef="let a">
          <mat-chip [color]="severityColor(a.severity)" highlighted>
            {{ a.severity }}
          </mat-chip>
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
          <button mat-button [color]="a.acknowledged ? '' : 'primary'" (click)="toggleAck(a)">
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
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .empty { text-align: center; padding: 32px; color: #888; }
    mat-spinner { margin: 40px auto; }
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

  severityColor(severity: string): 'primary' | 'accent' | 'warn' {
    switch (severity) {
      case 'CRITICAL': return 'warn';
      case 'WARNING': return 'accent';
      default: return 'primary';
    }
  }
}

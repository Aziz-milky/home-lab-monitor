import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlertRuleApiService } from '../../services/alert-rule-api.service';
import { AlertRule } from '../../models/alert-rule.model';
import { AlertRuleFormDialogComponent } from '../../dialogs/alert-rule-form-dialog';

@Component({
  selector: 'app-alert-rules',
  standalone: true,
  imports: [
    NgFor, NgIf, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatSlideToggleModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="header-row">
      <h1>Alert Rules</h1>
      <button mat-raised-button color="primary" (click)="addRule()">
        <mat-icon>add</mat-icon> New Rule
      </button>
    </div>

    <mat-spinner *ngIf="loading" diameter="40" />

    <table mat-table [dataSource]="rules" *ngIf="!loading">

      <ng-container matColumnDef="serviceName">
        <th mat-header-cell *matHeaderCellDef>Service</th>
        <td mat-cell *matCellDef="let r">{{ r.service.id }}</td>
      </ng-container>

      <ng-container matColumnDef="ruleType">
        <th mat-header-cell *matHeaderCellDef>Rule Type</th>
        <td mat-cell *matCellDef="let r">{{ r.ruleType }}</td>
      </ng-container>

      <ng-container matColumnDef="threshold">
        <th mat-header-cell *matHeaderCellDef>Threshold</th>
        <td mat-cell *matCellDef="let r">
          {{ r.ruleType === 'RESPONSE_TIME' ? (r.thresholdMs + ' ms') : (r.failureCount + ' failures') }}
        </td>
      </ng-container>

      <ng-container matColumnDef="enabled">
        <th mat-header-cell *matHeaderCellDef>Enabled</th>
        <td mat-cell *matCellDef="let r">
          <mat-slide-toggle [checked]="r.enabled" (toggleChange)="toggleRule(r)"></mat-slide-toggle>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let r">
          <button mat-icon-button (click)="editRule(r)" matTooltip="Edit">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deleteRule(r)" matTooltip="Delete">
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

      <tr class="mat-row" *ngIf="rules.length === 0">
        <td class="mat-cell empty" [attr.colspan]="displayedColumns.length">No alert rules. Create one to get notified.</td>
      </tr>
    </table>
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .empty { text-align: center; padding: 32px; color: #888; }
    mat-spinner { margin: 40px auto; }
  `]
})
export class AlertRulesComponent implements OnInit {
  rules: AlertRule[] = [];
  displayedColumns = ['serviceName', 'ruleType', 'threshold', 'enabled', 'actions'];
  loading = true;

  constructor(
    private api: AlertRuleApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  private loadRules(): void {
    this.loading = true;
    this.api.getAll().subscribe({
      next: (page) => { this.rules = page.content; this.loading = false; },
      error: () => { this.loading = false; this.snackBar.open('Failed to load rules', 'Close', { duration: 3000 }); }
    });
  }

  addRule(): void {
    const ref = this.dialog.open(AlertRuleFormDialogComponent, {
      width: '500px',
      data: { serviceId: '' }
    });
    ref.afterClosed().subscribe(result => {
      if (result && result.serviceId) {
        this.api.create(result).subscribe(() => {
          this.snackBar.open('Rule created', 'Close', { duration: 2000 });
          this.loadRules();
        });
      } else if (result) {
        this.snackBar.open('Service ID is required', 'Close', { duration: 3000 });
      }
    });
  }

  editRule(rule: AlertRule): void {
    const ref = this.dialog.open(AlertRuleFormDialogComponent, {
      width: '500px',
      data: { rule, serviceId: rule.service.id }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        const { serviceId, ...body } = result;
        this.api.update(rule.id, body).subscribe(() => {
          this.snackBar.open('Rule updated', 'Close', { duration: 2000 });
          this.loadRules();
        });
      }
    });
  }

  toggleRule(rule: AlertRule): void {
    this.api.toggle(rule.id).subscribe(() => {
      this.snackBar.open(`Rule ${rule.enabled ? 'disabled' : 'enabled'}`, 'Close', { duration: 2000 });
      this.loadRules();
    });
  }

  deleteRule(rule: AlertRule): void {
    if (confirm('Delete this rule?')) {
      this.api.delete(rule.id).subscribe(() => {
        this.snackBar.open('Rule deleted', 'Close', { duration: 2000 });
        this.loadRules();
      });
    }
  }
}

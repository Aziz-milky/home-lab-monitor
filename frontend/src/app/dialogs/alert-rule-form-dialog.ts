import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { AlertRule } from '../models/alert-rule.model';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-alert-rule-form-dialog',
  standalone: true,
  imports: [
    NgFor, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Alert Rule' : 'New Alert Rule' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Rule Type</mat-label>
          <mat-select formControlName="ruleType">
            <mat-option value="RESPONSE_TIME">Response Time</mat-option>
            <mat-option value="FAILURE_COUNT">Failure Count</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Threshold (ms) — for RESPONSE_TIME</mat-label>
          <input matInput type="number" formControlName="thresholdMs">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Failure Count — for FAILURE_COUNT</mat-label>
          <input matInput type="number" formControlName="failureCount">
        </mat-form-field>

        <mat-slide-toggle formControlName="enabled">Enabled</mat-slide-toggle>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit">
          {{ data ? 'Update' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 12px; }`]
})
export class AlertRuleFormDialogComponent {
  form = this.fb.group({
    ruleType: ['RESPONSE_TIME'],
    thresholdMs: [null as number | null],
    failureCount: [null as number | null],
    enabled: [true]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AlertRuleFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { rule?: AlertRule; serviceId: string }
  ) {
    if (data?.rule) {
      this.form.patchValue(data.rule);
    }
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.form.value,
        serviceId: this.data.serviceId
      });
    }
  }
}

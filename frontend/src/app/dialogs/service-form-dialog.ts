import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { Service, SERVICE_TYPES } from '../models/service.model';

@Component({
  selector: 'app-service-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Service' : 'New Service' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="My App">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Host</mat-label>
          <input matInput formControlName="host" placeholder="192.168.1.100">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Port</mat-label>
          <input matInput type="number" formControlName="port">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="serviceType">
            <mat-option *ngFor="let t of serviceTypes" [value]="t">{{ t }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Health Check URL</mat-label>
          <input matInput formControlName="checkUrl" placeholder="http://192.168.1.100:8080/health">
        </mat-form-field>

        <mat-slide-toggle formControlName="active">Active</mat-slide-toggle>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data ? 'Update' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 12px; }`]
})
export class ServiceFormDialogComponent {
  serviceTypes = SERVICE_TYPES;

  form = this.fb.group({
    name: ['', Validators.required],
    host: ['', Validators.required],
    port: [0, [Validators.required, Validators.min(1), Validators.max(65535)]],
    serviceType: ['GENERIC' as Service['serviceType'], Validators.required],
    checkUrl: [''],
    active: [true]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ServiceFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Service | null
  ) {
    if (data) {
      this.form.patchValue(data);
    }
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

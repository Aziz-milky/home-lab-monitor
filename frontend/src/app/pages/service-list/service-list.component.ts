import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceApiService } from '../../services/service-api.service';
import { Service } from '../../models/service.model';
import { ServiceFormDialogComponent } from '../../dialogs/service-form-dialog';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [
    NgFor, NgIf, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="header-row">
      <h1>Services</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> New Service
      </button>
    </div>

    <mat-spinner *ngIf="loading" diameter="40" />

    <table mat-table [dataSource]="services" *ngIf="!loading">

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let s">
          <a [routerLink]="['/services', s.id]">{{ s.name }}</a>
        </td>
      </ng-container>

      <ng-container matColumnDef="host">
        <th mat-header-cell *matHeaderCellDef>Host</th>
        <td mat-cell *matCellDef="let s">{{ s.host }}:{{ s.port }}</td>
      </ng-container>

      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef>Type</th>
        <td mat-cell *matCellDef="let s">{{ s.serviceType }}</td>
      </ng-container>

      <ng-container matColumnDef="active">
        <th mat-header-cell *matHeaderCellDef>Active</th>
        <td mat-cell *matCellDef="let s">{{ s.active ? 'Yes' : 'No' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let s">
          <button mat-icon-button (click)="openEdit(s)" matTooltip="Edit">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deleteService(s)" matTooltip="Delete">
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

      <tr class="mat-row" *ngIf="services.length === 0">
        <td class="mat-cell empty" [attr.colspan]="displayedColumns.length">
          No services yet. Click "New Service" to add one.
        </td>
      </tr>
    </table>
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .empty { text-align: center; padding: 32px; color: #888; }
    table a { text-decoration: none; font-weight: 500; }
    mat-spinner { margin: 40px auto; }
  `]
})
export class ServiceListComponent implements OnInit {
  services: Service[] = [];
  displayedColumns = ['name', 'host', 'type', 'active', 'actions'];
  loading = true;

  constructor(
    private api: ServiceApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  private loadServices(): void {
    this.loading = true;
    this.api.getAll().subscribe({
      next: (page) => { this.services = page.content; this.loading = false; },
      error: () => { this.loading = false; this.snackBar.open('Failed to load services', 'Close', { duration: 3000 }); }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(ServiceFormDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.create(result).subscribe(() => {
          this.snackBar.open('Service created', 'Close', { duration: 2000 });
          this.loadServices();
        });
      }
    });
  }

  openEdit(service: Service): void {
    const ref = this.dialog.open(ServiceFormDialogComponent, { width: '500px', data: service });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.update(service.id, { ...result }).subscribe(() => {
          this.snackBar.open('Service updated', 'Close', { duration: 2000 });
          this.loadServices();
        });
      }
    });
  }

  deleteService(service: Service): void {
    if (confirm(`Delete service "${service.name}"?`)) {
      this.api.delete(service.id).subscribe(() => {
        this.snackBar.open('Service deleted', 'Close', { duration: 2000 });
        this.loadServices();
      });
    }
  }
}

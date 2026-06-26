import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceApiService } from '../../services/service-api.service';
import { Service, ServiceType, SERVICE_TYPES } from '../../models/service.model';

export const C = {
  NAME: 'name',
  HOST: 'host',
  TYPE: 'type',
  ACTIVE: 'active',
  ACTIONS: 'actions',
} as const;

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Services</h1>
        <button class="btn-primary" (click)="toggleCreateForm()">
          <span class="mi" style="font-size:14px">add</span> New Service
        </button>
      </div>

      @if (loading) {
        <div class="spinner-wrap">
          <div class="spinner"></div>
        </div>
      }

      @if (!loading) {
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Host</th>
              <th>Type</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (showCreateForm) {
            <tr class="form-row">
              <td><input [(ngModel)]="formName" placeholder="Name" class="inp" /></td>
              <td>
                <input [(ngModel)]="formHost" placeholder="Host" class="inp" style="width:100px" />
                <span style="color:#5a5175;margin:0 4px">:</span>
                <input [(ngModel)]="formPort" placeholder="Port" type="number" class="inp" style="width:70px" />
              </td>
              <td>
                <select [(ngModel)]="formType" class="inp">
                  @for (t of serviceTypes; track t) {
                  <option [value]="t">{{ t }}</option>
                  }
                </select>
              </td>
              <td>
                <label class="toggle-wrap">
                  <input type="checkbox" [(ngModel)]="formActive" class="toggle-inp" />
                  <span class="toggle-slider"></span>
                </label>
              </td>
              <td class="actions-cell">
                <span class="mi" style="font-size:20px;color:#34d399;cursor:pointer" (click)="saveCreate()">check</span>
                <span class="mi" style="font-size:20px;color:#f87171;cursor:pointer" (click)="cancelCreate()">close</span>
              </td>
            </tr>
            }
            @for (s of services; track s.id) {
            <tr>
              <td>
                <a class="sv-link" [routerLink]="['/services', s.id]">{{ s.name }}</a>
              </td>
              <td>{{ s.host }}:{{ s.port }}</td>
              <td>{{ s.serviceType }}</td>
              <td>{{ s.active ? 'Yes' : 'No' }}</td>
              <td class="actions-cell">
                <span class="mi" style="font-size:16px;color:#8175a0;cursor:pointer" (click)="openEdit(s)">edit</span>
                <span class="mi" style="font-size:16px;color:#f87171;cursor:pointer" (click)="deleteService(s)">delete</span>
              </td>
            </tr>
            }
            @if (services.length === 0 && !showCreateForm) {
            <tr>
              <td colspan="5" class="empty">No services yet. Click "New Service" to add one.</td>
            </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -.4px; color: #ece6fb; }
    .btn-primary { display:flex; align-items:center; gap:6px; height:32px; padding:0 14px; border-radius:7px; font-size:11px; font-weight:500; color:#fff; background:linear-gradient(135deg,#a855f7,#6d28d9); border:none; cursor:pointer; }
    .btn-primary:hover { opacity:.9; }
    .sv-link { font-weight:500; color:#a855f7; text-decoration:none; }
    .sv-link:hover { text-decoration:underline; }
    table { width:100%; background:#0e0b1e; border:1px solid rgba(168,85,247,.10); border-radius:8px; border-collapse:collapse; }
    th { font-size:10px; color:#5a5175; text-transform:uppercase; letter-spacing:.06em; padding:12px 14px; border-bottom:1px solid rgba(168,85,247,.10); text-align:left; font-weight:600; }
    td { font-size:12px; color:#ece6fb; padding:10px 14px; border-bottom:1px solid rgba(168,85,247,.05); }
    tbody tr:hover { background:#161028; }
    .actions-cell { white-space:nowrap; display:flex; gap:10px; align-items:center; }
    .empty { text-align:center; padding:32px; color:#5a5175; }
    .inp { background:#161028; border:1px solid rgba(168,85,247,.15); border-radius:5px; padding:6px 8px; color:#ece6fb; font-size:11px; outline:none; }
    .inp:focus { border-color:#a855f7; }
    select.inp { cursor:pointer; }
    .form-row td { padding:8px 14px; vertical-align:middle; }
    .toggle-wrap { position:relative; display:inline-block; width:30px; height:16px; }
    .toggle-inp { opacity:0; width:0; height:0; }
    .toggle-slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:#161028; border-radius:8px; transition:.2s; border:1px solid rgba(168,85,247,.15); }
    .toggle-inp:checked + .toggle-slider { background:#a855f7; border-color:#a855f7; }
    .toggle-slider::before { content:''; position:absolute; height:12px; width:12px; border-radius:50%; left:1px; bottom:1px; background:#5a5175; transition:.2s; }
    .toggle-inp:checked + .toggle-slider::before { transform:translateX(14px); background:#fff; }
    .spinner-wrap { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid rgba(168,85,247,.15); border-top-color:#a855f7; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class ServiceListComponent implements OnInit {
  readonly C = C;
  readonly serviceTypes: ServiceType[] = SERVICE_TYPES;

  services: Service[] = [];
  loading = true;

  showCreateForm = false;
  formName = '';
  formHost = '';
  formPort = 0;
  formType: ServiceType = 'GENERIC';
  formActive = true;

  constructor(private api: ServiceApiService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  private loadServices(): void {
    this.loading = true;
    this.api.getAll().subscribe({
      next: (page) => { this.services = page.content; this.loading = false; },
      error: () => {
        this.loading = false;
        this.services = this.generateFakeServices();
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.formName = '';
      this.formHost = '';
      this.formPort = 0;
      this.formType = 'GENERIC';
      this.formActive = true;
    }
  }

  cancelCreate(): void {
    this.showCreateForm = false;
  }

  saveCreate(): void {
    const svc: Partial<Service> = {
      name: this.formName,
      host: this.formHost,
      port: this.formPort,
      serviceType: this.formType,
      active: this.formActive,
    };
    this.api.create(svc).subscribe(() => {
      this.showCreateForm = false;
      this.loadServices();
    });
  }

  openEdit(service: Service): void {
    const name = prompt('Name:', service.name);
    if (name === null) return;
    const host = prompt('Host:', service.host) ?? service.host;
    const portStr = prompt('Port:', String(service.port)) ?? String(service.port);
    const port = parseInt(portStr, 10) || service.port;
    const typeStr = prompt('Type (PROXMOX|TRUENAS|PIHOLE|GRAFANA|OLLAMA|GENERIC):', service.serviceType) ?? service.serviceType;
    const type = SERVICE_TYPES.includes(typeStr as ServiceType) ? (typeStr as ServiceType) : service.serviceType;
    const active = confirm('Set active?') === true;

    this.api.update(service.id, { name, host, port, serviceType: type, active }).subscribe(() => {
      this.loadServices();
    });
  }

  deleteService(service: Service): void {
    if (confirm(`Delete service "${service.name}"?`)) {
      this.api.delete(service.id).subscribe(() => {
        this.loadServices();
      });
    }
  }

  private generateFakeServices(): Service[] {
    const fake: Service[] = [];
    const now = new Date().toISOString();
    for (let i = 1; i <= 9; i++) {
      fake.push({
        id: `fake-${i}`,
        name: `Service ${i}`,
        host: `192.168.1.${10 + i}`,
        port: 3000 + i,
        serviceType: SERVICE_TYPES[i % SERVICE_TYPES.length],
        checkUrl: `http://192.168.1.${10 + i}:${3000 + i}/health`,
        active: i % 3 !== 0,
        createdAt: now,
      });
    }
    return fake;
  }
}

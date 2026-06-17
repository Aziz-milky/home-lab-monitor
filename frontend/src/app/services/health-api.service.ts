import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthCheck } from '../models/health-check.model';
import { Page, DashboardEntry } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  private readonly base = '/api/health';

  constructor(private http: HttpClient) {}

  getLatest(): Observable<DashboardEntry[]> {
    return this.http.get<DashboardEntry[]>(`${this.base}/latest`);
  }

  getHistory(serviceId: string, page = 0, size = 50): Observable<Page<HealthCheck>> {
    return this.http.get<Page<HealthCheck>>(`${this.base}/service/${serviceId}`, {
      params: { page, size }
    });
  }
}

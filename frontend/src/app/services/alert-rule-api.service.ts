import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlertRule } from '../models/alert-rule.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AlertRuleApiService {
  private readonly base = '/api/alert-rules';

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 50): Observable<Page<AlertRule>> {
    return this.http.get<Page<AlertRule>>(this.base, { params: { page, size } });
  }

  getById(id: string): Observable<AlertRule> {
    return this.http.get<AlertRule>(`${this.base}/${id}`);
  }

  create(rule: Record<string, unknown>): Observable<AlertRule> {
    return this.http.post<AlertRule>(this.base, rule);
  }

  update(id: string, rule: Record<string, unknown>): Observable<AlertRule> {
    return this.http.put<AlertRule>(`${this.base}/${id}`, rule);
  }

  toggle(id: string): Observable<AlertRule> {
    return this.http.patch<AlertRule>(`${this.base}/${id}/toggle`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

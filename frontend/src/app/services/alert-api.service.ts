import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert } from '../models/alert.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AlertApiService {
  private readonly base = '/api/alerts';

  constructor(private http: HttpClient) {}

  getAll(acknowledged?: boolean, page = 0, size = 50): Observable<Page<Alert>> {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (acknowledged !== undefined) {
      params['acknowledged'] = String(acknowledged);
    }
    return this.http.get<Page<Alert>>(this.base, { params });
  }

  acknowledge(id: string): Observable<Alert> {
    return this.http.patch<Alert>(`${this.base}/${id}/acknowledge`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

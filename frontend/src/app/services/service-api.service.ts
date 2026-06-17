import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Service } from '../models/service.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly base = '/api/services';

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20): Observable<Page<Service>> {
    return this.http.get<Page<Service>>(this.base, { params: { page, size } });
  }

  getById(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.base}/${id}`);
  }

  create(service: Partial<Service>): Observable<Service> {
    return this.http.post<Service>(this.base, service);
  }

  update(id: string, service: Partial<Service>): Observable<Service> {
    return this.http.put<Service>(`${this.base}/${id}`, service);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiagnosticReport } from '../models/diagnostic.model';

@Injectable({ providedIn: 'root' })
export class DiagnosticApiService {
  private readonly base = '/api/diagnostics';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DiagnosticReport[]> {
    return this.http.get<DiagnosticReport[]>(this.base);
  }

  getReport(serviceId: string): Observable<DiagnosticReport> {
    return this.http.get<DiagnosticReport>(`${this.base}/${serviceId}`);
  }

  getAiInsight(serviceId: string): Observable<string> {
    return this.http.post(`${this.base}/ai/${serviceId}`, {}, { responseType: 'text' });
  }
}

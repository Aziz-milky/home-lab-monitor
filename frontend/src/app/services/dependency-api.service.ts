import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceDependency } from '../models/dependency.model';

@Injectable({ providedIn: 'root' })
export class DependencyApiService {
  private readonly base = '/api/dependencies';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ServiceDependency[]> {
    return this.http.get<ServiceDependency[]>(this.base);
  }
}

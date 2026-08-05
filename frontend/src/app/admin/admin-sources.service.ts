import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SourceType = 'RSS' | 'WEBSOCKET';

export interface AdminSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  pollIntervalSeconds: number;
  active: boolean;
  categoryId: string;
}

export interface AdminSourceInput {
  name: string;
  url: string;
  type: SourceType;
  categoryId: string;
  pollIntervalSeconds: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminSourcesService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/sources';

  list(): Observable<AdminSource[]> {
    return this.http.get<AdminSource[]>(this.base);
  }

  create(data: AdminSourceInput): Observable<AdminSource> {
    return this.http.post<AdminSource>(this.base, data);
  }

  update(id: string, data: Partial<AdminSourceInput>): Observable<AdminSource> {
    return this.http.patch<AdminSource>(`${this.base}/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

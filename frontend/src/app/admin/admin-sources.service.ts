import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SourceType = 'RSS' | 'WEBSOCKET';

/** A news source as returned by the admin `/api/admin/sources` endpoints. */
export interface AdminSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  pollIntervalSeconds: number;
  active: boolean;
  categoryId: string;
}

/** Payload shape for creating/updating a source. */
export interface AdminSourceInput {
  name: string;
  url: string;
  type: SourceType;
  categoryId: string;
  pollIntervalSeconds: number;
  active: boolean;
}

/** Admin CRUD client for news sources. */
@Injectable({ providedIn: 'root' })
export class AdminSourcesService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/sources';

  /** Lists all sources. */
  list(): Observable<AdminSource[]> {
    return this.http.get<AdminSource[]>(this.base);
  }

  /** Creates a source. */
  create(data: AdminSourceInput): Observable<AdminSource> {
    return this.http.post<AdminSource>(this.base, data);
  }

  /** Partially updates a source. */
  update(id: string, data: Partial<AdminSourceInput>): Observable<AdminSource> {
    return this.http.patch<AdminSource>(`${this.base}/${id}`, data);
  }

  /** Deletes a source. */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

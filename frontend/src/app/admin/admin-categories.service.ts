import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  slackWebhookUrl: string | null;
}

export interface AdminCategoryInput {
  name: string;
  slug: string;
  slackWebhookUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/categories';

  list(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(this.base);
  }

  create(data: AdminCategoryInput): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(this.base, data);
  }

  update(id: string, data: Partial<AdminCategoryInput>): Observable<AdminCategory> {
    return this.http.patch<AdminCategory>(`${this.base}/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

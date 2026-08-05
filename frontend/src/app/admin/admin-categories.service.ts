import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** A category as returned by the admin `/api/admin/categories` endpoints. */
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  slackWebhookUrl: string | null;
}

/** Payload shape for creating/updating a category. */
export interface AdminCategoryInput {
  name: string;
  slug: string;
  slackWebhookUrl?: string | null;
}

/** Admin CRUD client for categories. */
@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/categories';

  /** Lists all categories. */
  list(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(this.base);
  }

  /** Creates a category. */
  create(data: AdminCategoryInput): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(this.base, data);
  }

  /** Partially updates a category. */
  update(id: string, data: Partial<AdminCategoryInput>): Observable<AdminCategory> {
    return this.http.patch<AdminCategory>(`${this.base}/${id}`, data);
  }

  /** Deletes a category. */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

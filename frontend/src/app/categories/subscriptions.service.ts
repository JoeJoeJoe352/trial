import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './categories.service';

export interface CategorySubscription {
  id: string;
  category: Category;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/me/subscriptions';

  list(): Observable<CategorySubscription[]> {
    return this.http.get<CategorySubscription[]>(this.base);
  }

  subscribe(categoryId: string): Observable<CategorySubscription> {
    return this.http.post<CategorySubscription>(this.base, { categoryId });
  }

  unsubscribe(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${categoryId}`);
  }
}

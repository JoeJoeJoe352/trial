import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './categories.service';

/** The current user's subscription to a category. */
export interface CategorySubscription {
  id: string;
  category: Category;
}

/** Client for the current user's category subscriptions (`/api/me/subscriptions`). */
@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/me/subscriptions';

  /** Lists the current user's active subscriptions. */
  list(): Observable<CategorySubscription[]> {
    return this.http.get<CategorySubscription[]>(this.base);
  }

  /** Subscribes the current user to a category. */
  subscribe(categoryId: string): Observable<CategorySubscription> {
    return this.http.post<CategorySubscription>(this.base, { categoryId });
  }

  /** Unsubscribes the current user from a category. */
  unsubscribe(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${categoryId}`);
  }
}

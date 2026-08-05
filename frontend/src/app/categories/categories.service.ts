import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** A news category as exposed by the public `/api/categories` endpoint. */
export interface Category {
  id: string;
  name: string;
  slug: string;
}

/** Fetches the public list of categories, used for filtering news and subscribing. */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  /** Lists all categories. */
  list(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }
}

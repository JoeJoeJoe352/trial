import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
    category: { id: string; name: string; slug: string };
  };
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly http = inject(HttpClient);

  list(categoryId?: string | null): Observable<NewsItem[]> {
    let params = new HttpParams();
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    return this.http.get<NewsItem[]>('/api/news', { params });
  }
}

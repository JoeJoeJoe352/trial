import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { CategoriesService, Category } from '../categories/categories.service';
import { NewsService, NewsItem } from '../news/news.service';

@Component({
  selector: 'app-home',
  imports: [DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
/** Main page: shows the latest news feed with a category filter. */
export class Home implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly newsService = inject(NewsService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly news = signal<NewsItem[]>([]);
  protected readonly selectedCategoryId = signal<string | null>(null);
  protected readonly loading = signal(true);

  /** Loads the category filter list and the initial (unfiltered) news feed. */
  ngOnInit(): void {
    this.categoriesService.list().subscribe((categories) => this.categories.set(categories));
    this.loadNews();
  }

  /** Sets the active category filter (or clears it with `null`) and reloads the news feed. */
  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
    this.loadNews();
  }

  /** Fetches news for the currently selected category filter. */
  private loadNews(): void {
    this.loading.set(true);
    this.newsService.list(this.selectedCategoryId()).subscribe({
      next: (news) => {
        this.news.set(news);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

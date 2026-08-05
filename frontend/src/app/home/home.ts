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
export class Home implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly newsService = inject(NewsService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly news = signal<NewsItem[]>([]);
  protected readonly selectedCategoryId = signal<string | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.categoriesService.list().subscribe((categories) => this.categories.set(categories));
    this.loadNews();
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
    this.loadNews();
  }

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

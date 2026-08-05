import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CategoriesService, Category } from '../categories.service';
import { SubscriptionsService } from '../subscriptions.service';

@Component({
  selector: 'app-categories-page',
  imports: [],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.css',
})
export class CategoriesPage implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly subscriptionsService = inject(SubscriptionsService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly subscribedIds = signal<Set<string>>(new Set());
  protected readonly pendingIds = signal<Set<string>>(new Set());
  protected readonly loading = signal(true);

  ngOnInit(): void {
    forkJoin({
      categories: this.categoriesService.list(),
      subscriptions: this.subscriptionsService.list(),
    }).subscribe({
      next: ({ categories, subscriptions }) => {
        this.categories.set(categories);
        this.subscribedIds.set(new Set(subscriptions.map((s) => s.category.id)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(categoryId: string): void {
    const isSubscribed = this.subscribedIds().has(categoryId);
    this.setPending(categoryId, true);

    const onSuccess = () => {
      const ids = new Set(this.subscribedIds());
      if (isSubscribed) {
        ids.delete(categoryId);
      } else {
        ids.add(categoryId);
      }
      this.subscribedIds.set(ids);
      this.setPending(categoryId, false);
    };
    const onError = () => this.setPending(categoryId, false);

    if (isSubscribed) {
      this.subscriptionsService.unsubscribe(categoryId).subscribe({ next: onSuccess, error: onError });
    } else {
      this.subscriptionsService.subscribe(categoryId).subscribe({ next: onSuccess, error: onError });
    }
  }

  private setPending(categoryId: string, pending: boolean): void {
    const ids = new Set(this.pendingIds());
    if (pending) {
      ids.add(categoryId);
    } else {
      ids.delete(categoryId);
    }
    this.pendingIds.set(ids);
  }
}

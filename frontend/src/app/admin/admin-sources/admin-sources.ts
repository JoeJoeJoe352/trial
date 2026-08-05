import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminSourcesService, AdminSource, SourceType } from '../admin-sources.service';
import { CategoriesService, Category } from '../../categories/categories.service';

@Component({
  selector: 'app-admin-sources',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-sources.html',
})
export class AdminSources implements OnInit {
  private readonly service = inject(AdminSourcesService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  protected readonly sources = signal<AdminSource[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    url: ['', Validators.required],
    type: ['RSS' as SourceType, Validators.required],
    categoryId: ['', Validators.required],
    pollIntervalSeconds: [300, [Validators.required, Validators.min(10)]],
    active: [true],
  });

  ngOnInit(): void {
    this.refresh();
    this.categoriesService.list().subscribe((categories) => this.categories.set(categories));
  }

  refresh(): void {
    this.service.list().subscribe((sources) => this.sources.set(sources));
  }

  categoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? categoryId;
  }

  startEdit(source: AdminSource): void {
    this.editingId.set(source.id);
    this.form.setValue({
      name: source.name,
      url: source.url,
      type: source.type,
      categoryId: source.categoryId,
      pollIntervalSeconds: source.pollIntervalSeconds,
      active: source.active,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', url: '', type: 'RSS', categoryId: '', pollIntervalSeconds: 300, active: true });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    const payload = this.form.getRawValue();
    const id = this.editingId();
    const request = id ? this.service.update(id, payload) : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.refresh();
      },
      error: (err: HttpErrorResponse) => this.errorMessage.set(err.error?.error ?? 'Something went wrong'),
    });
  }

  remove(id: string): void {
    this.errorMessage.set('');
    this.service.remove(id).subscribe({
      next: () => this.refresh(),
      error: (err: HttpErrorResponse) => this.errorMessage.set(err.error?.error ?? 'Something went wrong'),
    });
  }
}

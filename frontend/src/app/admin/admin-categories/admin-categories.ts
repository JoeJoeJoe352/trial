import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminCategoriesService, AdminCategory } from '../admin-categories.service';
import { slugify } from '../../shared/slugify';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories.html',
})
export class AdminCategories implements OnInit {
  private readonly service = inject(AdminCategoriesService);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slackWebhookUrl: [''],
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.service.list().subscribe((categories) => this.categories.set(categories));
  }

  startEdit(category: AdminCategory): void {
    this.editingId.set(category.id);
    this.form.setValue({
      name: category.name,
      slackWebhookUrl: category.slackWebhookUrl ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', slackWebhookUrl: '' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    const { name, slackWebhookUrl } = this.form.getRawValue();
    const payload = { name, slug: slugify(name), slackWebhookUrl: slackWebhookUrl || null };
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

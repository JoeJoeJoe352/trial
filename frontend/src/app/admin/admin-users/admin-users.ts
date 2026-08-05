import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminUsersService, AdminUser, UserRole } from '../admin-users.service';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-users.html',
})
export class AdminUsers implements OnInit {
  private readonly service = inject(AdminUsersService);
  private readonly fb = inject(FormBuilder);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['USER' as UserRole, Validators.required],
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.service.list().subscribe((users) => this.users.set(users));
  }

  startEdit(user: AdminUser): void {
    this.editingId.set(user.id);
    this.form.setValue({ name: user.name, email: user.email, password: '', role: user.role });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', email: '', password: '', role: 'USER' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, role } = this.form.getRawValue();
    const id = this.editingId();

    if (!id && password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }

    this.errorMessage.set('');
    const request = id
      ? this.service.update(id, { name, email, role, ...(password ? { password } : {}) })
      : this.service.create({ name, email, password, role });

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

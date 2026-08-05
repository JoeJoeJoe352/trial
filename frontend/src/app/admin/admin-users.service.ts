import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole = 'ADMIN' | 'USER';

/** A user as returned by the admin `/api/admin/users` endpoints. */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Payload shape for creating a user. */
export interface AdminUserCreateInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/** Payload shape for updating a user; `password` is only sent when changing it. */
export interface AdminUserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

/** Admin CRUD client for users. */
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/users';

  /** Lists all users. */
  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.base);
  }

  /** Creates a user. */
  create(data: AdminUserCreateInput): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.base, data);
  }

  /** Partially updates a user. */
  update(id: string, data: AdminUserUpdateInput): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/${id}`, data);
  }

  /** Deletes a user. */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

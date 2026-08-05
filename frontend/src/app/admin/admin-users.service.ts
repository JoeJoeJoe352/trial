import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole = 'ADMIN' | 'USER';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AdminUserCreateInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AdminUserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/users';

  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.base);
  }

  create(data: AdminUserCreateInput): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.base, data);
  }

  update(id: string, data: AdminUserUpdateInput): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

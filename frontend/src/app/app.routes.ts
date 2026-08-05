import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { authGuard, adminGuard } from './auth/auth.guard';
import { CategoriesPage } from './categories/categories-page/categories-page';
import { AdminShell } from './admin/admin-shell/admin-shell';
import { AdminCategories } from './admin/admin-categories/admin-categories';
import { AdminSources } from './admin/admin-sources/admin-sources';
import { AdminUsers } from './admin/admin-users/admin-users';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'categories', component: CategoriesPage, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminShell,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      { path: 'categories', component: AdminCategories },
      { path: 'sources', component: AdminSources },
      { path: 'users', component: AdminUsers },
    ],
  },
  { path: '**', redirectTo: '' },
];

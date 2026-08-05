import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth.service';

/** Route guard: waits for the initial auth check, then allows navigation only if a user is logged in (else redirects to /login). */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.checked).pipe(
    filter((checked) => checked),
    take(1),
    map(() => auth.currentUser() !== null || router.createUrlTree(['/login'])),
  );
};

/** Route guard: waits for the initial auth check, then allows navigation only if the user has the ADMIN role (else redirects home). */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.checked).pipe(
    filter((checked) => checked),
    take(1),
    map(() => auth.currentUser()?.role === 'ADMIN' || router.createUrlTree(['/'])),
  );
};

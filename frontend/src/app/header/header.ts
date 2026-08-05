import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
/** Site header showing auth-aware navigation (login/register vs. logout). */
export class Header {
  protected readonly auth = inject(AuthService);

  /** Logs the current user out via {@link AuthService}. */
  logout(): void {
    this.auth.logout().subscribe();
  }
}

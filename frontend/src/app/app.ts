import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html'
})
/** Root component: renders the header and routed content, and kicks off the initial auth check. */
export class App {
  private readonly auth = inject(AuthService);

  constructor() {
    this.auth.init();
  }
}

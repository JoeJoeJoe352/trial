import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);
  protected readonly message = signal('Loading...');

  constructor() {
    this.http.get<{ message: string }>('/api/hello').subscribe({
      next: (res) => this.message.set(res.message),
      error: () => this.message.set('Hello World (backend unreachable)'),
    });
  }
}

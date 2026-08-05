import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { withCredentialsInterceptor } from './auth/with-credentials.interceptor';

/** Root providers: global error listeners, HttpClient with the credentials interceptor, and the app router. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([withCredentialsInterceptor])),
    provideRouter(routes),
  ]
};

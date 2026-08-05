import { HttpInterceptorFn } from '@angular/common/http';

/** HTTP interceptor that sends the auth cookie with every request, so the backend can authenticate cross-origin XHR/fetch calls. */
export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};

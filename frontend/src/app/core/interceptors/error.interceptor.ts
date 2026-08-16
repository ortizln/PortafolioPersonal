import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  let retryCount = 0;
  const maxRetries = 1;
  const isAuthEndpoint = /\/auth\/(login|register|refresh|forgot-password|reset-password)/.test(req.url);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint && retryCount < maxRetries) {
        retryCount++;
        return authService.refreshToken().pipe(
          switchMap((tokens) => {
            const cloned = req.clone({
              setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            return next(cloned);
          }),
          catchError((refreshError) => {
            authService.clearStorage();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

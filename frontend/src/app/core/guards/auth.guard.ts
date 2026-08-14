import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) return router.parseUrl('/auth/login');

  try {
    const decoded: { exp?: number; role?: string } = jwtDecode(token);
    if (!decoded.exp) {
      authService.clearStorage();
      return router.parseUrl('/auth/login');
    }
    if (decoded.exp * 1000 > Date.now()) {
      if (decoded.role !== 'ADMIN') {
        authService.clearStorage();
        return router.parseUrl('/auth/login');
      }
      return true;
    }
  } catch {
    return router.parseUrl('/auth/login');
  }

  return authService.refreshToken().pipe(
    map(() => {
      const refreshed = authService.getToken();
      if (!refreshed) return router.parseUrl('/auth/login');
      const decoded: { role?: string } = jwtDecode(refreshed);
      if (decoded.role !== 'ADMIN') {
        authService.clearStorage();
        return router.parseUrl('/auth/login');
      }
      return true;
    }),
    catchError(() => {
      authService.clearStorage();
      return of(router.parseUrl('/auth/login'));
    })
  );
};

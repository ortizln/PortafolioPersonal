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
    const decoded: { exp?: number } = jwtDecode(token);
    if (!decoded.exp) {
      authService.clearStorage();
      return router.parseUrl('/auth/login');
    }
    if (decoded.exp * 1000 > Date.now()) {
      return true;
    }
  } catch {
    return router.parseUrl('/auth/login');
  }

  return authService.refreshToken().pipe(
    map(() => true),
    catchError(() => {
      authService.clearStorage();
      return of(router.parseUrl('/auth/login'));
    })
  );
};

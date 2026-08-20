import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { jwtDecode } from 'jwt-decode';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'PROJECT_MANAGER', 'TEAM_MEMBER'];

function isAdminUser(authService: AuthService): boolean {
  const user = authService.getCurrentUser();
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.roles?.length) {
    return user.roles.some((r) => ADMIN_ROLES.includes(r));
  }
  return false;
}

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const apiService = inject(ApiService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) return router.parseUrl('/auth/login');

  const ensureRoles = () => {
    const user = authService.getCurrentUser();
    if (user && user.roles && user.roles.length > 0) return of(true);
    // sesión anterior a FASE 5: recuperar roles
    return apiService.getMe().pipe(
      map((fresh) => {
        authService.setCurrentUser(fresh);
        return fresh.roles && fresh.roles.length > 0;
      }),
      catchError(() => of(false))
    );
  };

  try {
    const decoded: { exp?: number } = jwtDecode(token);
    if (!decoded.exp) {
      authService.clearStorage();
      return router.parseUrl('/auth/login');
    }
    if (decoded.exp * 1000 > Date.now()) {
      if (isAdminUser(authService)) return true;
      return ensureRoles().pipe(
        map((ok) => (ok && isAdminUser(authService) ? true : (authService.clearStorage(), router.parseUrl('/auth/login'))))
      );
    }
  } catch {
    return router.parseUrl('/auth/login');
  }

  return authService.refreshToken().pipe(
    switchMap(() => {
      const refreshed = authService.getToken();
      if (!refreshed) return of(router.parseUrl('/auth/login'));
      return ensureRoles().pipe(
        map((ok) => (ok && isAdminUser(authService) ? true : (authService.clearStorage(), router.parseUrl('/auth/login'))))
      );
    }),
    catchError(() => {
      authService.clearStorage();
      return of(router.parseUrl('/auth/login'));
    })
  );
};

export const permissionGuard = (...permissions: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if (permissions.length === 1) {
      if (authService.hasPermission(permissions[0])) return true;
    } else {
      if (authService.hasAnyPermission(permissions)) return true;
    }
    return router.parseUrl('/admin');
  };
};

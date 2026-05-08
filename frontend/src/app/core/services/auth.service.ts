import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiService = inject(ApiService);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.apiService.login({ email, password }).pipe(
      tap((res) => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      }),
      catchError((err) => {
        this.clearStorage();
        return throwError(() => err);
      })
    );
  }

  register(data: { email: string; password: string; name: string }): Observable<{ user: User; accessToken: string; refreshToken: string }> {
    return this.apiService.register(data);
  }

  logout(): void {
    this.apiService.logout().subscribe({
      next: () => this.clearStorage(),
      error: () => this.clearStorage(),
    });
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refresh = this.getRefreshToken();
    if (!refresh) return throwError(() => new Error('No refresh token available'));

    return this.apiService.refreshToken(refresh).pipe(
      tap((tokens) => {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private clearStorage(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}

import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">Portfolio</div>
          <h1>Welcome back</h1>
          <p>Sign in to your admin account</p>
        </div>

        <div *ngIf="error" class="alert-error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
            <div *ngIf="email?.invalid && email?.touched" class="field-error">
              <span *ngIf="email?.errors?.['required']">Email is required</span>
              <span *ngIf="email?.errors?.['email']">Enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="Enter your password" autocomplete="current-password" />
            <div *ngIf="password?.invalid && password?.touched" class="field-error">
              <span>Password is required</span>
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
            <span *ngIf="loading" class="spinner"></span>
            <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <div class="register-link">
          Don't have an account? <a routerLink="/auth/register">Register</a>
        </div>
        <div class="back-link">
          <a routerLink="/">&larr; Go Back</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  error = '';

  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err.status === 401 ? 'Invalid credentials' : (err.error?.message || 'An error occurred');
      },
    });
  }
}

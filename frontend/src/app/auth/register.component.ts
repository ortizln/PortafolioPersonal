import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

export const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  return password && confirm && password.value !== confirm.value ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="logo">Portfolio</div>
          <h1>Create account</h1>
          <p>Register to manage your portfolio</p>
        </div>

        <div *ngIf="error" class="alert-error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input id="name" type="text" formControlName="name" placeholder="John Doe" autocomplete="name" />
            <div *ngIf="name?.invalid && name?.touched" class="field-error">
              <span *ngIf="name?.errors?.['required']">Name is required</span>
              <span *ngIf="name?.errors?.['minlength']">At least 2 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
            <div *ngIf="email?.invalid && email?.touched" class="field-error">
              <span *ngIf="email?.errors?.['required']">Email is required</span>
              <span *ngIf="email?.errors?.['email']">Enter a valid email</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">Password</label>
              <input id="password" type="password" formControlName="password" placeholder="Min. 6 characters" autocomplete="new-password" />
              <div *ngIf="password?.invalid && password?.touched" class="field-error">
                <span *ngIf="password?.errors?.['required']">Password is required</span>
                <span *ngIf="password?.errors?.['minlength']">At least 6 characters</span>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Repeat password" autocomplete="new-password" />
              <div *ngIf="confirmPassword?.invalid && confirmPassword?.touched" class="field-error">
                <span *ngIf="confirmPassword?.errors?.['required']">Confirm your password</span>
              </div>
              <div *ngIf="form.errors?.['passwordsMismatch'] && confirmPassword?.touched && password?.touched" class="field-error">
                Passwords do not match
              </div>
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
            <span *ngIf="loading" class="spinner"></span>
            <span>{{ loading ? 'Creating account...' : 'Create Account' }}</span>
          </button>
        </form>

        <div class="login-link">
          Already have an account? <a routerLink="/auth/login">Sign In</a>
        </div>
        <div class="back-link">
          <a routerLink="/">&larr; Cancel</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatchValidator });

  loading = false;
  error = '';

  get name() { return this.form.get('name'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { name, email, password } = this.form.getRawValue();
          this.authService.register({ name, email, password }).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      },
    });
  }
}

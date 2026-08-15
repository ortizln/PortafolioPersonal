import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">ALANTEK</div>
          <h1>Recuperar contraseña</h1>
          <p>Ingresa tu correo y te enviaremos un enlace para restablecerla</p>
        </div>

        <div *ngIf="sent" class="alert-success">
          Si el correo existe, recibirás un enlace de recuperación.
        </div>
        <div *ngIf="error" class="alert-error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="tu@empresa.com" autocomplete="email" />
            <div *ngIf="email?.invalid && email?.touched" class="field-error">
              <span *ngIf="email?.errors?.['required']">El correo es obligatorio</span>
              <span *ngIf="email?.errors?.['email']">Ingresa un correo válido</span>
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
            <span *ngIf="loading" class="spinner"></span>
            <span>{{ loading ? 'Enviando...' : 'Enviar enlace' }}</span>
          </button>
        </form>

        <div class="back-link">
          <a routerLink="/auth/login">&larr; Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  sent = false;
  error = '';

  get email() { return this.form.get('email'); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.apiService.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => {
        this.loading = false;
        this.sent = true;
      },
      error: () => {
        this.loading = false;
        this.sent = true;
      },
    });
  }
}

import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ApiService } from '../core/services/api.service';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">ALANTEK</div>
          <h1>Nueva contraseña</h1>
          <p>Define una contraseña nueva para tu cuenta</p>
        </div>

        <div *ngIf="done" class="alert-success">Contraseña actualizada. Redirigiendo...</div>
        <div *ngIf="error" class="alert-error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="password">Nueva contraseña</label>
            <input id="password" type="password" formControlName="password" placeholder="Mín. 8 caracteres" autocomplete="new-password" />
            <div *ngIf="password?.invalid && password?.touched" class="field-error">
              <span *ngIf="password?.errors?.['required']">La contraseña es obligatoria</span>
              <span *ngIf="password?.errors?.['pattern']">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirm">Confirmar contraseña</label>
            <input id="confirm" type="password" formControlName="confirm" placeholder="Repite la contraseña" autocomplete="new-password" />
            <div *ngIf="confirm?.invalid && confirm?.touched" class="field-error">
              <span>Las contraseñas no coinciden</span>
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
            <span *ngIf="loading" class="spinner"></span>
            <span>{{ loading ? 'Guardando...' : 'Guardar contraseña' }}</span>
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
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
    confirm: ['', Validators.required],
  });

  loading = false;
  done = false;
  error = '';

  get password() { return this.form.get('password'); }
  get confirm() { return this.form.get('confirm'); }

  ngOnInit(): void {
    this.form.get('confirm')!.addValidators((c) => (c.value === this.password?.value ? null : { mismatch: true }));
    this.form.get('confirm')!.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const token = this.router.parseUrl(this.router.url).queryParamMap.get('token');
    if (!token) {
      this.error = 'Enlace de recuperación inválido o expirado.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.apiService.resetPassword(token, this.form.getRawValue().password).subscribe({
      next: () => {
        this.loading = false;
        this.done = true;
        setTimeout(() => this.router.navigate(['/auth/login']), 1800);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'No se pudo restablecer la contraseña. El enlace pudo expirar.';
      },
    });
  }
}

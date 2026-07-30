import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Profile, SocialLink } from '../core/models';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="container">
          <a routerLink="/portfolio" class="back-link">&larr; Volver al Portafolio</a>
          <h1>Contacto</h1>
        </div>
      </div>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle"></i>
        <p>No se pudo cargar la información de contacto. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error" class="page-content">
        <div class="container">
          <div class="contact-layout">
            <div class="contact-info" data-aos="fade-right">
              <h2 class="contact-heading">Trabajemos juntos</h2>
              <p class="contact-text">Siempre estoy abierto a nuevas oportunidades, colaboraciones y proyectos interesantes. ¡No dudes en contactarme!</p>

              <div class="contact-details">
                <div class="contact-item" *ngIf="profile?.email">
                  <div class="contact-item-icon"><i class="bi bi-envelope-fill"></i></div>
                  <div class="contact-item-text">
                    <span class="contact-item-label">Correo</span>
                    <a [href]="'mailto:' + profile!.email" class="contact-item-value">{{ profile!.email }}</a>
                  </div>
                </div>
                <div class="contact-item" *ngIf="profile?.phone">
                  <div class="contact-item-icon"><i class="bi bi-telephone-fill"></i></div>
                  <div class="contact-item-text">
                    <span class="contact-item-label">Teléfono</span>
                    <span class="contact-item-value">{{ profile!.phone }}</span>
                  </div>
                </div>
                <div class="contact-item" *ngIf="profile?.location">
                  <div class="contact-item-icon"><i class="bi bi-geo-alt-fill"></i></div>
                  <div class="contact-item-text">
                    <span class="contact-item-label">Ubicación</span>
                    <span class="contact-item-value">{{ profile!.location }}</span>
                  </div>
                </div>
              </div>

              <div class="contact-socials">
                <a *ngFor="let link of socialLinks" [href]="link.url" target="_blank" rel="noopener noreferrer" class="contact-social-link" [attr.aria-label]="link.platform">
                  <i class="bi" [ngClass]="getIcon(link.platform)"></i>
                </a>
              </div>
            </div>

            <div class="contact-form-wrapper" data-aos="fade-left">
              <div class="success-message" *ngIf="submitted">
                <i class="bi bi-check-circle-fill"></i>
                <h3>¡Mensaje Enviado!</h3>
                <p>Gracias por contactarme. Te responderé pronto.</p>
                <button class="btn-secondary" (click)="submitted = false">Enviar otro</button>
              </div>

              <form #contactForm="ngForm" (ngSubmit)="onSubmit(contactForm)" class="contact-form" *ngIf="!submitted">
                <div class="form-group">
                  <label class="form-label" for="name">Nombre</label>
                  <input id="name" name="name" type="text" class="form-input" [(ngModel)]="formData.name" required minlength="2" #name="ngModel" placeholder="Tu nombre" />
                  <span class="form-error" *ngIf="name.invalid && name.touched">Por favor ingresa tu nombre</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="email">Correo</label>
                  <input id="email" name="email" type="email" class="form-input" [(ngModel)]="formData.email" required email #email="ngModel" placeholder="tu@correo.com" />
                  <span class="form-error" *ngIf="email.invalid && email.touched">Ingresa un correo válido</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="subject">Asunto</label>
                  <input id="subject" name="subject" type="text" class="form-input" [(ngModel)]="formData.subject" required minlength="3" #subject="ngModel" placeholder="¿De qué trata?" />
                  <span class="form-error" *ngIf="subject.invalid && subject.touched">Ingresa un asunto</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="message">Mensaje</label>
                  <textarea id="message" name="message" class="form-input form-textarea" rows="5" [(ngModel)]="formData.message" required minlength="10" #message="ngModel" placeholder="Tu mensaje..."></textarea>
                  <span class="form-error" *ngIf="message.invalid && message.touched">El mensaje debe tener al menos 10 caracteres</span>
                </div>
                <button type="submit" class="btn-primary" [disabled]="contactForm.invalid || sending">
                  <span *ngIf="!sending"><i class="bi bi-send-fill"></i> Enviar Mensaje</span>
                  <span *ngIf="sending"><i class="bi bi-hourglass-split"></i> Enviando...</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .page-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 24px 0; }
    .page-header h1 { font-size: 1.5rem; color: var(--white); margin: 8px 0 0; }
    .back-link { color: var(--accent); font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: var(--transition); }
    .back-link:hover { opacity: 0.8; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .page-loading { display: flex; justify-content: center; padding: 120px 0; }
    .page-error { text-align: center; padding: 120px 24px; color: var(--text-muted); }
    .page-error i { font-size: 3rem; color: var(--accent); margin-bottom: 16px; }
    .btn-retry { background: var(--accent); color: var(--bg-primary); border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-retry:hover { opacity: 0.9; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-content { padding: 60px 0; }
    .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 60px; max-width: 1000px; margin: 0 auto; }
    @media (max-width: 768px) { .contact-layout { grid-template-columns: 1fr; gap: 40px; } }
    .contact-heading { font-size: 1.5rem; color: var(--white); margin: 0 0 12px; }
    .contact-text { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 32px; }
    .contact-details { display: flex; flex-direction: column; gap: 20px; margin-bottom: 32px; }
    .contact-item { display: flex; align-items: flex-start; gap: 16px; }
    .contact-item-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(var(--accent-rgb, 100, 255, 218), 0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .contact-item-label { display: block; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 2px; }
    .contact-item-value { font-size: 0.9rem; color: var(--text-secondary); }
    .contact-socials { display: flex; gap: 12px; }
    .contact-social-link { width: 44px; height: 44px; border-radius: 12px; background: rgba(var(--accent-rgb, 100, 255, 218), 0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: var(--transition); }
    .contact-social-link:hover { background: var(--accent); color: var(--bg-primary); transform: translateY(-3px); }
    .contact-form-wrapper { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 32px; }
    .success-message { text-align: center; padding: 40px 20px; }
    .success-message i { font-size: 3rem; color: #22c55e; margin-bottom: 16px; }
    .success-message h3 { color: var(--white); margin: 0 0 8px; }
    .success-message p { color: var(--text-secondary); margin: 0 0 20px; }
    .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--text-primary); padding: 12px 28px; border-radius: 12px; cursor: pointer; }
    .btn-secondary:hover { border-color: var(--accent); }
    .contact-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
    .form-input { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; color: var(--text-primary); font-size: 0.9rem; transition: var(--transition); outline: none; }
    .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 100, 255, 218), 0.1); }
    .form-textarea { resize: vertical; min-height: 120px; }
    .form-error { font-size: 0.78rem; color: var(--error); }
    .btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--bg-primary); border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(100, 255, 218, 0.3); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ContactPageComponent implements OnInit {
  private api = inject(ApiService);
  profile: Profile | null = null;
  socialLinks: SocialLink[] = [];
  loading = true;
  error = false;
  formData = { name: '', email: '', subject: '', message: '' };
  submitted = false;
  sending = false;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = false;
    this.api.getPortfolio().subscribe({
      next: (data) => {
        this.profile = data.profile;
        this.socialLinks = data.socialLinks || [];
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }

  getIcon(platform: string): string {
    const map: Record<string, string> = {
      github: 'bi-github', linkedin: 'bi-linkedin', twitter: 'bi-twitter-x', 'x-twitter': 'bi-twitter-x',
      youtube: 'bi-youtube', instagram: 'bi-instagram', facebook: 'bi-facebook', email: 'bi-envelope-fill',
      website: 'bi-globe2', medium: 'bi-medium', dev: 'bi-code-slash', stackoverflow: 'bi-stack-overflow',
    };
    return map[platform.toLowerCase()] || 'bi-link-45deg';
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;
    this.sending = true;
    this.api.createContactMessage(this.formData).subscribe({
      next: () => {
        this.submitted = true; this.sending = false;
        this.formData = { name: '', email: '', subject: '', message: '' };
        form.resetForm();
      },
      error: () => { this.submitted = true; this.sending = false; },
    });
  }
}

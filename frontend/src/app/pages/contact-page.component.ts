import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Profile, SocialLink } from '../core/models';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, RouterLink, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--center">
        <div class="container-alantek">
          <a routerLink="/portfolio" class="hero-back">&larr; Volver al Portafolio</a>
          <span class="eyebrow">Hablemos</span>
          <h1 class="page-title">Contacto</h1>
          <p class="page-subtitle">Contáctanos para conversar sobre tu próximo proyecto.</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No se pudo cargar la información de contacto. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()">Reintentar</button>
      </div>

      <section class="page-section" *ngIf="!loading && !error">
        <div class="container-alantek">
          <div class="contact-layout">
            <div class="contact-info card-glass" appScrollReveal>
              <h2 class="contact-heading">Trabajemos juntos</h2>
              <p class="contact-text">Siempre estoy abierto a nuevas oportunidades, colaboraciones y proyectos interesantes. ¡No dudes en contactarme!</p>

              <div class="contact-details">
                <div class="contact-item" *ngIf="profile?.email">
                  <div class="contact-item-icon"><i class="bi bi-envelope-fill" aria-hidden="true"></i></div>
                  <div class="contact-item-text">
                    <span class="contact-item-label">Correo</span>
                    <a [href]="'mailto:' + profile!.email" class="contact-item-value">{{ profile!.email }}</a>
                  </div>
                </div>
                <div class="contact-item" *ngIf="profile?.phone">
                  <div class="contact-item-icon"><i class="bi bi-telephone-fill" aria-hidden="true"></i></div>
                  <div class="contact-item-text">
                    <span class="contact-item-label">Teléfono</span>
                    <span class="contact-item-value">{{ profile!.phone }}</span>
                  </div>
                </div>
                <div class="contact-item" *ngIf="profile?.location">
                  <div class="contact-item-icon"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i></div>
                  <div class="contact-item-text">
                    <span class="contact-item-label">Ubicación</span>
                    <span class="contact-item-value">{{ profile!.location }}</span>
                  </div>
                </div>
              </div>

              <div class="contact-socials">
                <a *ngFor="let link of socialLinks" [href]="link.url" target="_blank" rel="noopener noreferrer" class="contact-social-link" [attr.aria-label]="link.platform">
                  <i class="bi" [ngClass]="getIcon(link.platform)" aria-hidden="true"></i>
                </a>
              </div>
            </div>

            <div class="contact-form-wrapper card-alantek" appScrollReveal [revealDelay]="120">
              <div class="error-message" *ngIf="submitError" role="alert">
                <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                <h3>Error al enviar</h3>
                <p>No se pudo enviar el mensaje. Intenta de nuevo más tarde.</p>
                <button type="button" class="btn-alantek-outline" (click)="submitError = false">Reintentar</button>
              </div>

              <div class="success-message" *ngIf="submitted" role="status">
                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                <h3>¡Mensaje Enviado!</h3>
                <p>Gracias por contactarme. Te responderé pronto.</p>
                <button type="button" class="btn-alantek-outline" (click)="submitted = false">Enviar otro</button>
              </div>

              <form #contactForm="ngForm" (ngSubmit)="onSubmit(contactForm)" class="contact-form" *ngIf="!submitted && !submitError">
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
                <button type="submit" class="btn-alantek-accent submit-btn" [disabled]="contactForm.invalid || sending">
                  <span *ngIf="!sending"><i class="bi bi-send-fill" aria-hidden="true"></i> Enviar Mensaje</span>
                  <span *ngIf="sending"><i class="bi bi-hourglass-split" aria-hidden="true"></i> Enviando...</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <app-contact-cta
        eyebrow="Trabajemos juntos"
        title="¿Tienes un proyecto en mente?"
        text="Cuéntanos tu idea y te ayudaremos a hacerla realidad."
      ></app-contact-cta>
    </div>
  `,
  styles: [`
    .hero-back {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--accent);
      font-size: var(--fs-sm);
      text-decoration: none;
      margin-bottom: var(--space-4);
      transition: opacity var(--duration-base) var(--ease-out);
    }
    .hero-back:hover { opacity: 0.8; }
    .contact-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: var(--space-7);
      align-items: start;
      max-width: 1100px;
      margin: 0 auto;
    }
    @media (max-width: 900px) {
      .contact-layout { grid-template-columns: 1fr; gap: var(--space-6); }
    }
    .contact-info { padding: var(--space-6); }
    .contact-heading {
      font-family: var(--font-heading);
      font-size: var(--fs-2xl);
      font-weight: var(--fw-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-3);
    }
    .contact-text {
      font-size: var(--fs-base);
      color: var(--text-secondary);
      line-height: var(--lh-normal);
      margin: 0 0 var(--space-6);
    }
    .contact-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      margin-bottom: var(--space-6);
    }
    .contact-item { display: flex; align-items: flex-start; gap: var(--space-4); }
    .contact-item-icon {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      background: rgba(var(--accent-rgb), 0.1);
      color: var(--accent);
      font-size: 1.15rem;
    }
    .contact-item-label {
      display: block;
      font-size: var(--fs-xs);
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .contact-item-value {
      font-size: var(--fs-base);
      color: var(--text-secondary);
      text-decoration: none;
      transition: color var(--duration-base) var(--ease-out);
    }
    a.contact-item-value:hover { color: var(--accent); }
    .contact-socials { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .contact-social-link {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      background: rgba(var(--accent-rgb), 0.1);
      color: var(--accent);
      font-size: 1.15rem;
      transition: all var(--duration-base) var(--ease-out);
    }
    .contact-social-link:hover {
      background: var(--accent);
      color: #fff;
      transform: translateY(-3px);
    }
    .contact-form-wrapper { padding: var(--space-6); }
    .contact-form { display: flex; flex-direction: column; gap: var(--space-5); }
    .form-group { display: flex; flex-direction: column; gap: var(--space-2); }
    .form-label {
      font-size: var(--fs-sm);
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
    }
    .form-input {
      width: 100%;
      box-sizing: border-box;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      color: var(--text-primary);
      font-size: var(--fs-base);
      font-family: inherit;
      outline: none;
      transition: var(--transition);
    }
    .form-input::placeholder { color: var(--text-muted); }
    .form-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.15);
    }
    .form-textarea { resize: vertical; min-height: 120px; }
    .form-error { font-size: var(--fs-xs); color: var(--error); }
    .submit-btn { width: 100%; }
    .success-message,
    .error-message {
      text-align: center;
      padding: var(--space-7) var(--space-4);
    }
    .success-message i,
    .error-message i {
      display: block;
      font-size: 3rem;
      margin-bottom: var(--space-4);
    }
    .success-message i { color: var(--success); }
    .error-message i { color: var(--error); }
    .success-message h3,
    .error-message h3 {
      font-family: var(--font-heading);
      font-size: var(--fs-xl);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
    }
    .success-message p,
    .error-message p {
      color: var(--text-secondary);
      margin: 0 0 var(--space-5);
    }
  `],
})
export class ContactPageComponent implements OnInit {
  private api = inject(ApiService);
  private seoService = inject(SeoService);
  profile: Profile | null = null;
  socialLinks: SocialLink[] = [];
  loading = true;
  error = false;
  formData = { name: '', email: '', subject: '', message: '' };
  submitted = false;
  sending = false;
  submitError = false;

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'Contacto | ALANTEK',
      description: 'Contáctanos para conversar sobre tu próximo proyecto.',
      canonical: this.seoService.canonicalUrl('/contacto'),
      robots: 'index,follow',
    });
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
      error: () => { this.submitError = true; this.sending = false; },
    });
  }
}

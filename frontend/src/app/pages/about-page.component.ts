import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Profile, SocialLink } from '../core/models';
import { UploadUrlPipe } from '../shared/upload-url.pipe';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, UploadUrlPipe, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--compact">
        <div class="container-alantek">
          <span class="eyebrow">Portafolio</span>
          <h1 class="page-title">Sobre Mí</h1>
          <a routerLink="/portfolio" class="back-link">&larr; Volver al Portafolio</a>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No se pudo cargar el perfil. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()" aria-label="Reintentar">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !profile" class="page-empty">
        <i class="bi bi-person" aria-hidden="true"></i>
        <p>No hay información de perfil aún.</p>
      </div>

      <section class="page-section" *ngIf="!loading && profile">
        <div class="container-alantek">
          <div class="about-layout">
            <div appScrollReveal="left">
              <img
                class="about-image"
                [src]="(profile.profileImage | uploadUrl) || 'assets/default-avatar.svg'"
                [alt]="profile.fullName"
              />
            </div>

            <div appScrollReveal="right">
              <h2 class="about-name">{{ profile.fullName }}</h2>
              <p class="about-title">{{ profile.professionalTitle }}</p>
              <p class="about-bio">{{ profile.aboutMe || profile.description || 'No hay descripción disponible.' }}</p>

              <div class="detail-meta">
                <span *ngIf="profile.email">
                  <i class="bi bi-envelope-fill" aria-hidden="true"></i>{{ profile.email }}
                </span>
                <span *ngIf="profile.phone">
                  <i class="bi bi-whatsapp" aria-hidden="true"></i>
                  <a [href]="whatsAppUrl(profile.phone)" target="_blank" rel="noopener noreferrer" class="phone-link">
                    {{ profile.phone }}
                  </a>
                </span>
                <span *ngIf="profile.location">
                  <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>{{ profile.location }}
                </span>
              </div>

              <div class="about-cv" *ngIf="profile.cvFile">
                <a [href]="profile.cvFile | uploadUrl" target="_blank" rel="noopener noreferrer" class="btn-alantek-accent">
                  <i class="bi bi-download" aria-hidden="true"></i> Descargar CV
                </a>
              </div>

              <div class="about-socials" *ngIf="socialLinks.length">
                <a
                  *ngFor="let link of socialLinks"
                  [href]="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-icon-only"
                  [attr.aria-label]="link.platform"
                >
                  <i class="bi" [ngClass]="getIcon(link.platform)" aria-hidden="true"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <app-contact-cta></app-contact-cta>
    </div>
  `,
  styles: [`
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      margin-top: var(--space-4);
      font-size: var(--fs-sm);
      font-weight: var(--fw-semibold);
      color: var(--accent);
      text-decoration: none;
      transition: opacity var(--duration-base) var(--ease-out);
    }
    .back-link:hover { opacity: 0.8; }
    .about-layout {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: var(--space-8);
      align-items: center;
      max-width: 1000px;
      margin: 0 auto;
    }
    @media (max-width: 768px) {
      .about-layout { grid-template-columns: 1fr; gap: var(--space-6); }
    }
    .about-image {
      display: block;
      width: 300px;
      max-width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      margin: 0 auto;
      border-radius: var(--radius-full);
      border: 3px solid var(--accent);
      box-shadow: var(--shadow-glow);
    }
    .about-name {
      font-family: var(--font-heading);
      font-size: var(--fs-3xl);
      font-weight: var(--fw-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
    }
    .about-title { font-size: var(--fs-lg); color: var(--accent); margin: 0 0 var(--space-4); }
    .about-bio { font-size: var(--fs-md); color: var(--text-secondary); line-height: var(--lh-normal); margin: 0; }
    .detail-meta i { color: var(--accent); }
    .phone-link { color: inherit; text-decoration: none; transition: var(--transition); }
    .phone-link:hover { color: #25D366; }
    .about-cv { margin-bottom: var(--space-5); }
    .about-socials { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  `]
})
export class AboutPageComponent implements OnInit {
  private api = inject(ApiService);
  profile: Profile | null = null;
  socialLinks: SocialLink[] = [];
  loading = true;
  error = false;

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

  whatsAppUrl(phone: string): string {
    return 'https://wa.me/' + phone.replace(/[^0-9]/g, '');
  }

  getIcon(platform: string): string {
    const map: Record<string, string> = {
      github: 'bi-github', linkedin: 'bi-linkedin', twitter: 'bi-twitter-x', 'x-twitter': 'bi-twitter-x',
      youtube: 'bi-youtube', instagram: 'bi-instagram', facebook: 'bi-facebook', email: 'bi-envelope-fill',
      website: 'bi-globe2', medium: 'bi-medium', dev: 'bi-code-slash', stackoverflow: 'bi-stack-overflow',
    };
    return map[platform.toLowerCase()] || 'bi-link-45deg';
  }
}

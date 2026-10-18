import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Company, TeamMember } from '../core/models';
import { applyCompanyBrand } from '../core/utils/brand.util';
import { environment } from '../../environments/environment';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { AvatarComponent } from '../shared/components/avatar.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-nosotros-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ContactCtaComponent, AvatarComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--center">
        <div class="container-alantek">
          <span class="eyebrow">Nosotros</span>
          <h1 class="page-title">Sobre {{ companyName }}</h1>
          <p class="page-subtitle">{{ company?.slogan || 'Tecnología que impulsa tu negocio' }}</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No pudimos cargar la información. Intenta de nuevo.</p>
        <button class="btn-retry" (click)="retry()" aria-label="Reintentar">Reintentar</button>
      </div>

      <ng-container *ngIf="!loading">
        <section class="page-section">
          <div class="container-alantek container-narrow">
            <div class="prose" appScrollReveal>
              <p class="intro">{{ company?.description || company?.shortDescription }}</p>
              <div class="story" *ngIf="company?.history">
                <h2>Nuestra historia</h2>
                <p>{{ company.history }}</p>
              </div>
            </div>
            <div class="mv-grid" *ngIf="company?.mission || company?.vision">
              <div class="card-alantek mv-card" *ngIf="company?.mission" appScrollReveal>
                <i class="bi bi-bullseye" aria-hidden="true"></i>
                <h2>Misión</h2>
                <p>{{ company?.mission }}</p>
              </div>
              <div class="card-alantek mv-card" *ngIf="company?.vision" appScrollReveal [revealDelay]="120">
                <i class="bi bi-eye" aria-hidden="true"></i>
                <h2>Visión</h2>
                <p>{{ company?.vision }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="page-section page-section--alt" *ngIf="team.length">
          <div class="container-alantek">
            <div class="section-head" appScrollReveal>
              <span class="eyebrow">Equipo</span>
              <h2>Nuestro equipo</h2>
              <p class="section-subtitle">Los profesionales detrás de cada proyecto.</p>
            </div>
            <div class="grid-team">
              <a class="card-member" *ngFor="let m of team" [routerLink]="['/equipo', m.slug]" appScrollReveal>
                <app-avatar class="member-photo" [src]="getPhoto(m)" [name]="m.fullName" [size]="128"></app-avatar>
                <h3>{{ m.fullName }}</h3>
                <span class="member-role">{{ m.professionalTitle }}</span>
              </a>
            </div>
          </div>
        </section>
      </ng-container>

      <app-contact-cta></app-contact-cta>
    </div>
  `,
  styles: [`
    .intro { font-size: var(--fs-lg); white-space: pre-wrap; }
    .story p { white-space: pre-wrap; }
    .mv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-5); margin-top: var(--space-7); }
    .mv-card i { font-size: 1.6rem; color: var(--accent); }
    .mv-card h2 { font-family: var(--font-heading); font-size: var(--fs-xl); font-weight: var(--fw-semibold); color: var(--text-primary); margin: var(--space-4) 0 var(--space-2); }
    .mv-card p { color: var(--text-secondary); line-height: var(--lh-normal); margin: 0; }
    .section-head { margin-bottom: var(--space-6); }
    .section-head h2 { font-family: var(--font-heading); font-size: var(--fs-3xl); font-weight: var(--fw-bold); color: var(--text-primary); margin: 0 0 var(--space-2); }
    .section-subtitle { color: var(--text-secondary); margin: 0; }
  `],
})
export class NosotrosPageComponent implements OnInit {
  private api = inject(ApiService);
  private seoService = inject(SeoService);

  company: Company | null = null;
  companyName = 'ALANTEK';
  team: TeamMember[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.loading = true;
    this.error = false;
    this.seoService.setSeo({
      title: 'Nosotros | ALANTEK',
      description: 'Conoce la historia, misión y visión de ALANTEK.',
      canonical: this.seoService.canonicalUrl('/nosotros'),
      robots: 'index,follow',
    });
    this.api.getPublicCompany().subscribe({
      next: (c) => {
        this.company = c;
        if (c?.name) this.companyName = c.name;
        applyCompanyBrand(c);
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => { this.loading = false; this.error = true; },
    });
    this.api.getPublicTeam().subscribe({
      next: (list) => (this.team = (list || []).slice(0, 8)),
      error: () => { this.error = true; },
    });
  }

  getPhoto(m: TeamMember): string | null {
    if (!m.photoUrl) return null;
    if (m.photoUrl.startsWith('http://') || m.photoUrl.startsWith('https://') || m.photoUrl.startsWith('data:')) return m.photoUrl;
    return `${environment.uploadUrl}/${m.photoUrl}`;
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }

  retry(): void {
    this.loading = true;
    this.error = false;
    this.api.getPublicCompany().subscribe({
      next: (c) => {
        this.company = c;
        if (c?.name) this.companyName = c.name;
        applyCompanyBrand(c);
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => { this.loading = false; this.error = true; },
    });
    this.api.getPublicTeam().subscribe({
      next: (list) => (this.team = (list || []).slice(0, 8)),
      error: () => { this.error = true; },
    });
  }
}

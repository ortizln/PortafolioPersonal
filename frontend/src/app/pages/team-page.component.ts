import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { TeamMember } from '../core/models';
import { environment } from '../../environments/environment';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--center">
        <div class="container-alantek">
          <span class="eyebrow">Quienes somos</span>
          <h1 class="page-title">Nuestro equipo</h1>
          <p class="page-subtitle">Profesionales comprometidos con la calidad y la innovación.</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>
      <div *ngIf="error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No pudimos cargar la información. Intenta de nuevo.</p>
        <button class="btn-retry" (click)="retry()" aria-label="Reintentar">Reintentar</button>
      </div>
      <div *ngIf="!loading && !members.length" class="page-empty">No hay miembros publicados aún.</div>

      <section class="page-section" *ngIf="!loading && members.length">
        <div class="container-alantek">
          <div class="grid-team">
            <a class="card-member" *ngFor="let m of members" [routerLink]="['/equipo', m.slug]" appScrollReveal>
              <div class="member-photo">
                <img [src]="getPhoto(m) || 'assets/avatar-placeholder.svg'" [alt]="m.fullName" loading="lazy" />
              </div>
              <h2>{{ m.fullName }}</h2>
              <span class="member-role">{{ m.professionalTitle }}</span>
              <span class="member-role" *ngIf="m.isFounder"><i class="bi bi-award" aria-hidden="true"></i> Fundador</span>
            </a>
          </div>
        </div>
      </section>

      <app-contact-cta
        eyebrow="Hablemos"
        title="¿Buscas un aliado tecnológico?"
        text="Cuéntanos tu proyecto y te ayudaremos a hacerlo realidad."
      ></app-contact-cta>
    </div>
  `,
  styles: [],
})
export class TeamPageComponent implements OnInit {
  private api = inject(ApiService);
  private seoService = inject(SeoService);
  members: TeamMember[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'Equipo | ALANTEK',
      description: 'Conoce al equipo de profesionales de ALANTEK.',
      canonical: this.seoService.canonicalUrl('/equipo'),
      robots: 'index,follow',
    });
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.error = false;
    this.api.getPublicTeam().subscribe({
      next: (list) => {
        this.members = list || [];
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => { this.loading = false; this.error = true; },
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
    this.loadMembers();
  }
}

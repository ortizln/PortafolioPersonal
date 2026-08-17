import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Company, TeamMember } from '../core/models';
import { applyCompanyBrand } from '../core/utils/brand.util';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-nosotros-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div class="page-wrapper">
      <header class="page-hero">
        <div class="container">
          <h1>Sobre {{ companyName }}</h1>
          <p>{{ company?.slogan || 'Tecnología que impulsa tu negocio' }}</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading">
        <section class="container section" data-aos="fade-up">
          <p class="intro">{{ company?.description || company?.shortDescription }}</p>
          <div class="story" *ngIf="company?.history">
            <h2>Nuestra historia</h2>
            <p>{{ company.history }}</p>
          </div>
          <div class="mv-grid" *ngIf="company?.mission || company?.vision">
            <div class="mv-card" *ngIf="company?.mission">
              <i class="bi bi-bullseye" aria-hidden="true"></i>
              <h2>Misión</h2>
              <p>{{ company?.mission }}</p>
            </div>
            <div class="mv-card" *ngIf="company?.vision">
              <i class="bi bi-eye" aria-hidden="true"></i>
              <h2>Visión</h2>
              <p>{{ company?.vision }}</p>
            </div>
          </div>
        </section>

        <section class="section section--alt" *ngIf="team.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Nuestro equipo</h2>
            <p class="section-subtitle">Los profesionales detrás de cada proyecto.</p>
            <div class="team-grid">
              <a class="team-card" *ngFor="let m of team" [routerLink]="['/equipo', m.slug]" data-aos="fade-up">
                <div class="team-photo">
                  <img [src]="getPhoto(m) || 'assets/avatar-placeholder.svg'" [alt]="m.fullName" loading="lazy" />
                </div>
                <h3 class="team-name">{{ m.fullName }}</h3>
                <span class="team-title">{{ m.professionalTitle }}</span>
              </a>
            </div>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .page-hero { background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary)); border-bottom: 1px solid var(--border); padding: 48px 0; text-align: center; }
    .page-hero h1 { font-size: 2.2rem; margin: 0 0 8px; }
    .page-hero p { color: var(--text-secondary); margin: 0; }
    .page-loading { display: flex; justify-content: center; padding: 100px 0; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .section { padding: 70px 0; }
    .section--alt { background: var(--bg-secondary); }
    .section-title { font-size: 1.8rem; font-weight: 700; margin: 0 0 8px; }
    .section-subtitle { color: var(--text-secondary); margin: 0 0 32px; }
    .intro { font-size: 1.05rem; color: var(--text-secondary); line-height: 1.9; white-space: pre-wrap; }
    .story h2 { font-size: 1.4rem; margin: 40px 0 12px; color: var(--white); }
    .story p { color: var(--text-secondary); line-height: 1.9; white-space: pre-wrap; }
    .mv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 40px; }
    .mv-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; }
    .mv-card i { font-size: 1.6rem; color: var(--accent); }
    .mv-card h2 { font-size: 1.2rem; margin: 14px 0 8px; color: var(--white); }
    .mv-card p { color: var(--text-secondary); line-height: 1.7; margin: 0; }
    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
    .team-card { text-align: center; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; text-decoration: none; transition: var(--transition); display: block; }
    .team-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .team-photo { width: 96px; height: 96px; margin: 0 auto 14px; border-radius: 50%; overflow: hidden; background: var(--bg-secondary); }
    .team-photo img { width: 100%; height: 100%; object-fit: cover; }
    .team-name { font-size: 1rem; color: var(--white); margin: 0 0 4px; }
    .team-title { font-size: 0.8rem; color: var(--accent); }
  `],
})
export class NosotrosPageComponent implements OnInit {
  private api = inject(ApiService);
  private seoService = inject(SeoService);

  company: Company | null = null;
  companyName = 'ALANTEK';
  team: TeamMember[] = [];
  loading = true;

  ngOnInit(): void {
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
      error: () => { this.loading = false; },
    });
    this.api.getPublicTeam().subscribe({
      next: (list) => (this.team = (list || []).slice(0, 8)),
      error: () => {},
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
}

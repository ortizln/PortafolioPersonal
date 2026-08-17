import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Service } from '../core/models';

@Component({
  selector: 'app-servicio-detail-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  styles: [`
    :host { display: block; min-height: 60vh; }
    .page-wrapper { padding-top: 80px; }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 24px; }
    .back-link { color: var(--accent); text-decoration: none; font-size: 0.9rem; display: inline-block; margin: 2rem 0 0; }
    .page-loading { display: flex; justify-content: center; padding: 6rem; }
    .spinner { width: 38px; height: 38px; border: 3px solid rgba(255,255,255,0.12); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-error { text-align: center; padding: 6rem; color: var(--text-secondary); }
    .page-error i { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; opacity: 0.4; }
    .page-error a { color: var(--accent); }

    .hero { background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary)); border-bottom: 1px solid var(--border); padding: 48px 0 40px; }
    .hero-top { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
    .hero-icon { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 16px; background: rgba(var(--accent-rgb), 0.1); color: var(--accent); font-size: 1.6rem; flex-shrink: 0; }
    .hero h1 { font-size: 2rem; margin: 0; }
    .hero-desc { color: var(--text-secondary); font-size: 1.05rem; line-height: 1.7; margin: 0; max-width: 720px; }
    .tech-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
    .tech-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; background: var(--bg-card); border: 1px solid var(--border); font-size: 0.78rem; color: var(--text-secondary); }
    .tech-dot { width: 8px; height: 8px; border-radius: 50%; }

    .section { padding: 50px 0; }
    .section-title { font-size: 1.3rem; margin: 0 0 28px; color: var(--text-primary); }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
    .feature-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 24px; transition: var(--transition); }
    .feature-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .feature-icon { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 10px; background: rgba(var(--accent-rgb), 0.1); color: var(--accent); font-size: 1.1rem; margin-bottom: 14px; }
    .feature-name { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 6px; }
    .feature-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }

    .projects-section { border-top: 1px solid var(--border); }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
    .project-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; text-decoration: none; transition: var(--transition); }
    .project-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .project-title { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin: 0 0 6px; }
    .project-summary { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

    .cta-banner { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); padding: 56px 0; text-align: center; }
    .cta-inner h2 { color: var(--bg-primary); margin: 0 0 8px; }
    .cta-inner p { color: var(--bg-primary); opacity: 0.85; margin: 0 0 24px; }
    .btn-hero { display: inline-flex; align-items: center; gap: 8px; padding: 13px 28px; border-radius: 12px; font-size: 0.92rem; font-weight: 600; text-decoration: none; background: var(--bg-primary); color: var(--accent); transition: var(--transition); }
    .btn-hero:hover { transform: translateY(-2px); }
  `],
  template: `
    <div class="page-wrapper">
      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-tools"></i>
        <p>{{ error }}</p>
        <a routerLink="/servicios">Ver servicios</a>
      </div>

      <ng-container *ngIf="!loading && service">
        <section class="hero">
          <div class="container">
            <a routerLink="/servicios" class="back-link">&larr; Todos los servicios</a>
            <div class="hero-top">
              <span class="hero-icon"><i [class]="service.icon || 'bi bi-code-slash'" aria-hidden="true"></i></span>
              <h1>{{ service.name }}</h1>
            </div>
            <p class="hero-desc">{{ service.description || service.shortDescription }}</p>
            <div class="tech-row" *ngIf="service.technologies?.length">
              <span class="tech-chip" *ngFor="let t of service.technologies">
                <span class="tech-dot" [style.background]="t.technology?.color || '#888'"></span>
                {{ t.technology?.name }}
              </span>
            </div>
          </div>
        </section>

        <section class="section" *ngIf="service.features?.length">
          <div class="container">
            <h2 class="section-title">Qué incluye</h2>
            <div class="features-grid">
              <div class="feature-card" *ngFor="let f of service.features" data-aos="fade-up">
                <span class="feature-icon"><i [class]="f.icon || 'bi bi-check-circle'" aria-hidden="true"></i></span>
                <h3 class="feature-name">{{ f.name }}</h3>
                <p class="feature-desc" *ngIf="f.description">{{ f.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section projects-section" *ngIf="projects.length">
          <div class="container">
            <h2 class="section-title">Proyectos relacionados</h2>
            <div class="projects-grid">
              <a class="project-card" *ngFor="let p of projects" [routerLink]="['/proyectos', p.slug]">
                <h3 class="project-title">{{ p.title }}</h3>
                <p class="project-summary" *ngIf="p.summary">{{ p.summary }}</p>
              </a>
            </div>
          </div>
        </section>

        <section class="cta-banner">
          <div class="container cta-inner">
            <h2>¿Te interesa este servicio?</h2>
            <p>Hablemos sobre tu proyecto y te preparamos una propuesta.</p>
            <a class="btn-hero" routerLink="/contacto">Solicitar cotización <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
          </div>
        </section>
      </ng-container>
    </div>
  `,
})
export class ServicioDetailPageComponent implements OnInit {
  private api = inject(ApiService);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  service: Service | null = null;
  projects: any[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.loadService(slug);
    });
  }

  private loadService(slug: string): void {
    this.loading = true;
    this.error = '';
    this.api.getPublicServiceBySlug(slug).subscribe({
      next: (res) => {
        this.service = res.service;
        this.projects = (res.service as any).projects || [];
        this.applySeo(res.service);
      },
      error: () => {
        this.loading = false;
        this.error = 'Servicio no encontrado.';
      },
      complete: () => (this.loading = false),
    });
  }

  private applySeo(s: Service): void {
    this.seo.setSeo({
      title: s.seoTitle || `${s.name} | Servicios | ALANTEK`,
      description: s.seoDescription || s.description || s.shortDescription || '',
      canonical: this.seo.canonicalUrl(`/servicios/${s.slug}`),
      robots: 'index,follow',
    });
  }
}

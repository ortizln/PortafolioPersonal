import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Service } from '../core/models';
import { environment } from '../../environments/environment';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-servicio-detail-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ContactCtaComponent, ScrollRevealDirective],
  styles: [`
    .back-link { color: var(--accent); text-decoration: none; font-size: 0.9rem; display: inline-block; margin: 2rem 0 0; }
    .feature-icon { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 10px; background: rgba(var(--accent-rgb), 0.1); color: var(--accent); font-size: 1.1rem; margin-bottom: 14px; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
    .project-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; text-decoration: none; transition: var(--transition); }
    .project-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .project-title { font-size: 0.95rem; font-weight: 600; color: var(--white); margin: 0 0 6px; }
    .project-summary { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
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
        <header class="page-hero">
          <div class="container-alantek">
            <a routerLink="/servicios" class="back-link">&larr; Todos los servicios</a>
            <div class="hero-top">
              <span class="hero-icon"><i [class]="service.icon || 'bi bi-code-slash'" aria-hidden="true"></i></span>
              <h1 class="page-title">{{ service.name }}</h1>
            </div>
            <p class="page-subtitle">{{ service.description || service.shortDescription }}</p>
            <div class="detail-meta" *ngIf="service.technologies?.length">
              <span class="chip" *ngFor="let t of service.technologies">{{ t.technology?.name }}</span>
            </div>
          </div>
        </header>

        <section class="page-section" *ngIf="service.features?.length">
          <div class="container-alantek">
            <h2>Qué incluye</h2>
            <div class="grid-auto">
              <div class="card-alantek" *ngFor="let f of service.features" appScrollReveal>
                <span class="feature-icon"><i [class]="f.icon || 'bi bi-check-circle'" aria-hidden="true"></i></span>
                <h3>{{ f.name }}</h3>
                <p *ngIf="f.description">{{ f.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="page-section page-section--alt" *ngIf="projects.length">
          <div class="container-alantek">
            <h2>Proyectos relacionados</h2>
            <div class="projects-grid">
              <a class="project-card" *ngFor="let p of projects" [routerLink]="['/proyectos', p.slug]">
                <h3 class="project-title">{{ p.title }}</h3>
                <p class="project-summary" *ngIf="p.summary">{{ p.summary }}</p>
              </a>
            </div>
          </div>
        </section>

        <app-contact-cta
          eyebrow="Te interesa"
          title="¿Te interesa este servicio?"
          text="Hablemos sobre tu proyecto y te preparamos una propuesta."
          ctaLabel="Solicitar cotización"
        ></app-contact-cta>
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
    const img = s.coverImage ? (s.coverImage.startsWith('http') ? s.coverImage : `${environment.uploadUrl}/${s.coverImage}`) : undefined;
    this.seo.setSeo({
      title: s.seoTitle || `${s.name} | Servicios | ALANTEK`,
      description: s.seoDescription || s.description || s.shortDescription || '',
      image: img,
      canonical: this.seo.canonicalUrl(`/servicios/${s.slug}`),
      robots: 'index,follow',
    });
  }
}

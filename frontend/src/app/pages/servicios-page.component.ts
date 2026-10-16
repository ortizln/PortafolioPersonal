import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Service } from '../core/models';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-servicios-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--center">
        <div class="container-alantek">
          <span class="eyebrow">Qué hacemos</span>
          <h1 class="page-title">Servicios</h1>
          <p class="page-subtitle">Soluciones tecnológicas integrales para tu empresa.</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>
      <div *ngIf="error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No pudimos cargar la información. Intenta de nuevo.</p>
        <button class="btn-retry" (click)="retry()" aria-label="Reintentar">Reintentar</button>
      </div>
      <div *ngIf="!loading && !error && !services.length" class="page-empty">No hay servicios publicados aún.</div>

      <section class="page-section" *ngIf="!loading && !error && services.length">
        <div class="container-alantek">
          <div class="grid-services">
            <a
              class="card-service"
              *ngFor="let s of services; trackBy: trackByService"
              [routerLink]="['/servicios', s.slug]"
              appScrollReveal
            >
              <span class="service-icon"><i [class]="s.icon || 'bi bi-code-slash'" aria-hidden="true"></i></span>
              <h3>{{ s.name }}</h3>
              <p>{{ s.description || s.shortDescription }}</p>
              <div class="service-features" *ngIf="s.features?.length">
                <span class="chip" *ngFor="let f of s.features.slice(0, 4)">{{ f.name }}</span>
              </div>
              <span class="service-link">Ver detalle <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
            </a>
          </div>
        </div>
      </section>

      <app-contact-cta
        eyebrow="A medida"
        title="¿Necesitas algo a medida?"
        text="Cuéntanos tu proyecto y te ayudaremos a hacerlo realidad."
      ></app-contact-cta>
    </div>
  `,
  styles: [`
    .service-features {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }
  `],
})
export class ServiciosPageComponent implements OnInit {
  private api = inject(ApiService);
  private seoService = inject(SeoService);
  services: Service[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'Servicios | ALANTEK',
      description: 'Soluciones de software y consultoría tecnológica de ALANTEK.',
      canonical: this.seoService.canonicalUrl('/servicios'),
      robots: 'index,follow',
    });
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.error = false;
    this.api.getPublicServices().subscribe({
      next: (list) => {
        this.services = (list || []).map((s) => ({
          ...s,
          features: (s as any).features || [],
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  retry(): void {
    this.loadServices();
  }

  trackByService = (i: number, s: any) => s.id || i;
}

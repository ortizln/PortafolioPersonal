import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Service } from '../core/models';

@Component({
  selector: 'app-servicios-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div class="page-wrapper">
      <header class="page-hero">
        <div class="container">
          <h1>Servicios</h1>
          <p>Soluciones tecnológicas integrales para tu empresa.</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>
      <div *ngIf="!loading && !services.length" class="page-empty">No hay servicios publicados aún.</div>

      <section class="container section" *ngIf="!loading && services.length">
        <div class="services-grid">
          <a class="service-card" *ngFor="let s of services" [routerLink]="['/servicios', s.slug]" data-aos="fade-up">
            <span class="service-icon"><i [class]="s.icon || 'bi bi-code-slash'" aria-hidden="true"></i></span>
            <h2 class="service-name">{{ s.name }}</h2>
            <p class="service-desc">{{ s.description || s.shortDescription }}</p>
            <div class="service-features" *ngIf="s.features?.length">
              <span class="feature-chip" *ngFor="let f of s.features.slice(0, 4)">{{ f.name }}</span>
            </div>
            <span class="service-link">Ver detalle <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
          </a>
        </div>
      </section>

      <section class="cta-banner" data-aos="fade-up">
        <div class="container cta-inner">
          <h2>¿Necesitas algo a medida?</h2>
          <p>Cuéntanos tu proyecto y te ayudaremos a hacerlo realidad.</p>
          <a class="btn-hero primary" routerLink="/contacto">Contáctanos <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .page-hero { background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary)); border-bottom: 1px solid var(--border); padding: 48px 0; text-align: center; }
    .page-hero h1 { font-size: 2.2rem; margin: 0 0 8px; }
    .page-hero p { color: var(--text-secondary); margin: 0; }
    .page-loading { display: flex; justify-content: center; padding: 100px 0; }
    .page-empty { text-align: center; padding: 100px 24px; color: var(--text-muted); }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .section { padding: 70px 0; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 22px; }
    .service-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; text-decoration: none; transition: var(--transition); }
    .service-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .service-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 14px; background: rgba(var(--accent-rgb), 0.1); color: var(--accent); font-size: 1.4rem; margin-bottom: 16px; }
    .service-name { font-size: 1.15rem; color: var(--white); margin: 0 0 10px; }
    .service-desc { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.7; margin: 0 0 14px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
    .service-features { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
    .feature-chip { background: rgba(var(--accent-rgb), 0.08); color: var(--text-secondary); padding: 3px 10px; border-radius: 20px; font-size: 0.74rem; }
    .service-link { font-size: 0.85rem; color: var(--accent); font-weight: 600; }
    .cta-banner { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); padding: 60px 0; text-align: center; }
    .cta-inner h2 { color: var(--bg-primary); margin: 0 0 8px; }
    .cta-inner p { color: var(--bg-primary); opacity: 0.85; margin: 0 0 24px; }
    .btn-hero { display: inline-flex; align-items: center; gap: 8px; padding: 13px 28px; border-radius: 12px; font-size: 0.92rem; font-weight: 600; text-decoration: none; background: var(--bg-primary); color: var(--accent); transition: var(--transition); }
    .btn-hero:hover { transform: translateY(-2px); }
  `],
})
export class ServiciosPageComponent implements OnInit {
  private api = inject(ApiService);
  services: Service[] = [];
  loading = true;

  ngOnInit(): void {
    this.api.getPublicServices().subscribe({
      next: (list) => {
        this.services = (list || []).map((s) => ({
          ...s,
          features: (s as any).features || [],
        }));
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => { this.loading = false; },
    });
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }
}

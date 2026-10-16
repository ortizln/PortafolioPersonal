import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Experience } from '../core/models';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-experience-page',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--compact">
        <div class="container-alantek">
          <span class="eyebrow">Portafolio</span>
          <h1 class="page-title">Experiencia Laboral</h1>
          <a routerLink="/portfolio" class="back-link">&larr; Volver al Portafolio</a>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No se pudieron cargar las experiencias. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()" aria-label="Reintentar">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !experiences.length" class="page-empty">
        <i class="bi bi-briefcase" aria-hidden="true"></i>
        <p>No hay experiencia laboral aún.</p>
      </div>

      <section class="page-section" *ngIf="!loading && experiences.length">
        <div class="container-alantek container-narrow">
          <div class="timeline">
            <div
              class="timeline-item"
              *ngFor="let exp of experiences; let i = index"
              [class.current]="exp.current"
              appScrollReveal
              [revealDelay]="i * 100"
            >
              <div class="timeline-marker">
                <div class="timeline-dot" [class.active]="exp.current"></div>
              </div>

              <div class="timeline-card card-alantek" [class.current-card]="exp.current">
                <div class="timeline-card-header">
                  <div class="timeline-company-icon">
                    <i class="bi bi-building" aria-hidden="true"></i>
                  </div>
                  <div class="timeline-company-info">
                    <h3 class="timeline-position">{{ exp.position }}</h3>
                    <span class="timeline-company">{{ exp.company }}</span>
                  </div>
                  <span class="chip chip--active" *ngIf="exp.current">Actual</span>
                </div>

                <div class="detail-meta">
                  <span class="timeline-date">
                    <i class="bi bi-calendar3" aria-hidden="true"></i>
                    {{ exp.startDate | date:'MMM yyyy' }} - {{ exp.current ? 'Actualidad' : (exp.endDate | date:'MMM yyyy') }}
                  </span>
                  <span class="timeline-location" *ngIf="exp.location">
                    <i class="bi bi-geo-alt" aria-hidden="true"></i> {{ exp.location }}
                  </span>
                </div>

                <p class="timeline-description">{{ exp.description }}</p>

                <div class="timeline-techs" *ngIf="exp.technologies?.length">
                  <span class="chip" *ngFor="let tech of exp.technologies">{{ tech }}</span>
                </div>
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
    .timeline { position: relative; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border);
    }
    .timeline-item { position: relative; padding-left: 56px; margin-bottom: var(--space-6); }
    .timeline-item:last-child { margin-bottom: 0; }
    .timeline-marker {
      position: absolute;
      left: 0;
      top: calc(var(--space-5) + 22px);
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .timeline-dot {
      width: 18px;
      height: 18px;
      border-radius: var(--radius-full);
      background: var(--bg-card);
      border: 2px solid var(--accent);
      transition: all var(--duration-base) var(--ease-out);
    }
    .timeline-dot.active { background: var(--accent); box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.4); }
    .timeline-card.current-card { border-color: var(--accent); box-shadow: var(--shadow-glow); }
    .timeline-card-header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      margin-bottom: var(--space-3);
    }
    .timeline-company-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--gradient-subtle);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .timeline-company-info { flex: 1; min-width: 0; }
    .timeline-position {
      font-family: var(--font-heading);
      font-size: var(--fs-lg);
      font-weight: var(--fw-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-1);
    }
    .timeline-company { font-size: var(--fs-sm); color: var(--accent); font-weight: var(--fw-semibold); }
    .timeline-description {
      font-size: var(--fs-base);
      color: var(--text-secondary);
      line-height: var(--lh-normal);
      margin: 0;
    }
    .timeline-techs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border);
    }
  `]
})
export class ExperiencePageComponent implements OnInit {
  private api = inject(ApiService);
  experiences: Experience[] = [];
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
        this.experiences = data.experiences || [];
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
}

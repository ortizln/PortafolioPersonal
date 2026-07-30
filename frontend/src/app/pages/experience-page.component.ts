import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Experience } from '../core/models';

@Component({
  selector: 'app-experience-page',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="container">
          <a routerLink="/portfolio" class="back-link">&larr; Volver al Portafolio</a>
          <h1>Experiencia Laboral</h1>
        </div>
      </div>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle"></i>
        <p>No se pudieron cargar las experiencias. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !experiences.length" class="page-empty">
        <i class="bi bi-briefcase"></i>
        <p>No hay experiencia laboral aún.</p>
      </div>

      <div *ngIf="!loading && experiences.length" class="page-content">
        <div class="container">
          <div class="timeline">
            <div
              class="timeline-item"
              *ngFor="let exp of experiences; let i = index"
              [class.current]="exp.current"
              data-aos="fade-up"
              [attr.data-aos-delay]="i * 100"
            >
              <div class="timeline-marker">
                <div class="timeline-dot" [class.active]="exp.current"></div>
              </div>

              <div class="timeline-card" [class.current-card]="exp.current">
                <div class="timeline-card-header">
                  <div class="timeline-company-icon">
                    <i class="bi bi-building"></i>
                  </div>
                  <div class="timeline-company-info">
                    <h3 class="timeline-position">{{ exp.position }}</h3>
                    <span class="timeline-company">{{ exp.company }}</span>
                  </div>
                  <span class="timeline-badge" *ngIf="exp.current">Actual</span>
                </div>

                <div class="timeline-meta">
                  <span class="timeline-date">
                    <i class="bi bi-calendar3"></i>
                    {{ exp.startDate | date:'MMM yyyy' }} - {{ exp.current ? 'Actualidad' : (exp.endDate | date:'MMM yyyy') }}
                  </span>
                  <span class="timeline-location" *ngIf="exp.location">
                    <i class="bi bi-geo-alt"></i> {{ exp.location }}
                  </span>
                </div>

                <p class="timeline-description">{{ exp.description }}</p>

                <div class="timeline-techs" *ngIf="exp.technologies?.length">
                  <span class="tech-tag" *ngFor="let tech of exp.technologies">{{ tech }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .page-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 24px 0; margin-bottom: 0; }
    .page-header h1 { font-size: 1.5rem; color: var(--white); margin: 8px 0 0; }
    .back-link { color: var(--accent); font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: var(--transition); }
    .back-link:hover { opacity: 0.8; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .page-loading { display: flex; justify-content: center; padding: 80px 0; }
    .page-error { text-align: center; padding: 80px 24px; color: var(--text-muted); }
    .page-error i { font-size: 3rem; color: var(--accent); margin-bottom: 16px; }
    .page-error p { margin-bottom: 20px; }
    .page-empty { text-align: center; padding: 100px 24px; color: var(--text-muted); }
    .page-empty i { font-size: 4rem; color: var(--accent); margin-bottom: 16px; opacity: 0.5; }
    .btn-retry { background: var(--accent); color: var(--bg-primary); border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-retry:hover { opacity: 0.9; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .page-content { padding: 60px 0; background: var(--bg-primary); }
    .timeline { position: relative; max-width: 800px; margin: 0 auto; }
    .timeline::before { content: ''; position: absolute; left: 24px; top: 0; bottom: 0; width: 2px; background: var(--border); }
    .timeline-item { position: relative; padding-left: 64px; margin-bottom: 40px; }
    .timeline-item:last-child { margin-bottom: 0; }
    .timeline-marker { position: absolute; left: 0; top: 4px; display: flex; align-items: center; justify-content: center; }
    .timeline-dot { width: 18px; height: 18px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--accent); transition: all 0.3s ease; margin-left: -8px; }
    .timeline-dot.active { background: var(--accent); box-shadow: 0 0 12px rgba(var(--accent-rgb, 100, 255, 218), 0.4); }
    .timeline-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: all 0.3s ease; }
    .timeline-card:hover { border-color: var(--accent); transform: translateX(4px); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .timeline-card.current-card { border-color: var(--accent); box-shadow: 0 0 20px rgba(var(--accent-rgb, 100, 255, 218), 0.08); }
    .timeline-card-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
    .timeline-company-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(var(--accent-rgb, 100, 255, 218), 0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .timeline-company-info { flex: 1; }
    .timeline-position { font-size: 1.05rem; font-weight: 600; color: var(--white); margin: 0; }
    .timeline-company { font-size: 0.85rem; color: var(--accent); }
    .timeline-badge { background: rgba(var(--accent-rgb, 100, 255, 218), 0.15); color: var(--accent); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
    .timeline-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 12px; font-size: 0.82rem; color: var(--text-muted); }
    .timeline-meta i { margin-right: 4px; }
    .timeline-description { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
    .timeline-techs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
    .tech-tag { background: rgba(var(--accent-rgb, 100, 255, 218), 0.08); color: var(--accent); padding: 4px 12px; border-radius: 6px; font-size: 0.78rem; }
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

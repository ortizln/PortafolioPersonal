import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Skill } from '../core/models';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-skills-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--compact">
        <div class="container-alantek">
          <span class="eyebrow">Portafolio</span>
          <h1 class="page-title">Habilidades</h1>
          <a routerLink="/portfolio" class="back-link">&larr; Volver al Portafolio</a>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No se pudieron cargar las habilidades. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()" aria-label="Reintentar">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !skills.length" class="page-empty">
        <i class="bi bi-gear" aria-hidden="true"></i>
        <p>No hay habilidades aún.</p>
      </div>

      <section class="page-section" *ngIf="!loading && skills.length">
        <div class="container-alantek container-narrow">
          <div class="grid-filters" appScrollReveal>
            <button
              type="button"
              class="chip chip--clickable"
              *ngFor="let cat of categories"
              [class.chip--active]="activeCategory === cat"
              [attr.aria-pressed]="activeCategory === cat"
              (click)="activeCategory = cat"
            >
              <i class="bi" [ngClass]="getIcon(cat)" aria-hidden="true"></i> {{ cat }}
            </button>
          </div>

          <div class="grid-auto" *ngIf="activeCategory">
            <div
              class="card-alantek"
              *ngFor="let skill of filteredSkills; let i = index"
              appScrollReveal
              [revealDelay]="i * 60"
            >
              <div class="skill-header">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-level" [ngClass]="getLevelClass(skill.percentage)">{{ getLevelLabel(skill.percentage) }}</span>
              </div>
              <div class="skill-bar-track">
                <div class="skill-bar-fill" [style.width.%]="skill.percentage" [style.--bar-color]="getBarColor(skill.percentage)"></div>
              </div>
              <span class="skill-percentage">{{ skill.percentage }}%</span>
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
    button.chip {
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: var(--fs-sm);
      padding: var(--space-2) var(--space-4);
    }
    .skill-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }
    .skill-name { font-weight: var(--fw-semibold); color: var(--text-primary); font-size: var(--fs-base); }
    .skill-level {
      font-size: var(--fs-xs);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-weight: var(--fw-medium);
      white-space: nowrap;
    }
    .level-expert { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .level-advanced { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .level-intermediate { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .level-beginner { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .skill-bar-track {
      width: 100%;
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--space-2);
    }
    .skill-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      background: var(--bar-color, var(--accent));
      transition: width 0.8s var(--ease-out);
    }
    .skill-percentage { font-size: var(--fs-xs); color: var(--text-muted); }
  `]
})
export class SkillsPageComponent implements OnInit {
  private api = inject(ApiService);
  skills: Skill[] = [];
  activeCategory = '';
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
        const grouped = data.skills || {};
        this.skills = Object.values(grouped).flat() as Skill[];
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

  get categories(): string[] {
    const cats = [...new Set(this.skills.map((s) => s.category))];
    if (!this.activeCategory && cats.length) this.activeCategory = cats[0];
    return cats;
  }

  get filteredSkills(): Skill[] {
    return this.skills.filter((s) => s.category === this.activeCategory);
  }

  getIcon(cat: string): string {
    const map: Record<string, string> = { FRONTEND: 'bi-code-square', BACKEND: 'bi-server', DATABASE: 'bi-database', DEVOPS: 'bi-gear-wide-connected', CLOUD: 'bi-cloud', MOBILE: 'bi-phone', DESIGN: 'bi-palette', OTHER: 'bi-star' };
    return map[cat] || 'bi-star';
  }

  getLevelLabel(p: number): string { return p >= 90 ? 'Experto' : p >= 75 ? 'Avanzado' : p >= 50 ? 'Intermedio' : 'Principiante'; }
  getLevelClass(p: number): string { return p >= 90 ? 'level-expert' : p >= 75 ? 'level-advanced' : p >= 50 ? 'level-intermediate' : 'level-beginner'; }
  getBarColor(p: number): string { return p >= 90 ? '#22c55e' : p >= 75 ? '#3b82f6' : p >= 50 ? '#f59e0b' : '#ef4444'; }
}

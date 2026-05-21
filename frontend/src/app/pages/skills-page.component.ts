import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Skill } from '../core/models';

@Component({
  selector: 'app-skills-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="container">
          <a routerLink="/portfolio" class="back-link">&larr; Back to Portfolio</a>
          <h1>Skills</h1>
        </div>
      </div>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle"></i>
        <p>Could not load skills. Please try again later.</p>
        <button class="btn-retry" (click)="loadData()">Retry</button>
      </div>

      <div *ngIf="!loading && !error && !skills.length" class="page-empty">
        <i class="bi bi-gear"></i>
        <p>No skills added yet.</p>
      </div>

      <div *ngIf="!loading && skills.length" class="page-content">
        <div class="container">
          <div class="skills-tabs" data-aos="fade-up">
            <button class="tab-btn" *ngFor="let cat of categories" [class.active]="activeCategory === cat" (click)="activeCategory = cat">
              <i class="bi" [ngClass]="getIcon(cat)"></i> {{ cat }}
            </button>
          </div>

          <div class="skills-grid" data-aos="fade-up" *ngIf="activeCategory">
            <div class="skill-card" *ngFor="let skill of filteredSkills; let i = index" data-aos="fade-up" [attr.data-aos-delay]="i * 60">
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
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .page-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 24px 0; }
    .page-header h1 { font-size: 1.5rem; color: var(--white); margin: 8px 0 0; }
    .back-link { color: var(--accent); font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: var(--transition); }
    .back-link:hover { opacity: 0.8; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .page-loading { display: flex; justify-content: center; padding: 120px 0; }
    .page-error { text-align: center; padding: 120px 24px; color: var(--text-muted); }
    .page-error i { font-size: 3rem; color: var(--accent); margin-bottom: 16px; }
    .page-empty { text-align: center; padding: 120px 24px; color: var(--text-muted); }
    .page-empty i { font-size: 4rem; color: var(--accent); opacity: 0.5; margin-bottom: 16px; }
    .btn-retry { background: var(--accent); color: var(--bg-primary); border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-retry:hover { opacity: 0.9; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-content { padding: 60px 0; }
    .skills-tabs { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 40px; }
    .tab-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; transition: var(--transition); display: flex; align-items: center; gap: 6px; }
    .tab-btn:hover { border-color: var(--accent); color: var(--accent); }
    .tab-btn.active { background: rgba(var(--accent-rgb, 100, 255, 218), 0.1); border-color: var(--accent); color: var(--accent); }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; max-width: 900px; margin: 0 auto; }
    .skill-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; transition: var(--transition); }
    .skill-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .skill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .skill-name { font-weight: 600; color: var(--white); font-size: 0.9rem; }
    .skill-level { font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; font-weight: 500; }
    .level-expert { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .level-advanced { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .level-intermediate { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .level-beginner { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .skill-bar-track { width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .skill-bar-fill { height: 100%; border-radius: 4px; background: var(--bar-color, var(--accent)); transition: width 0.8s ease; }
    .skill-percentage { font-size: 0.78rem; color: var(--text-muted); }
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

  getLevelLabel(p: number): string { return p >= 90 ? 'Expert' : p >= 75 ? 'Advanced' : p >= 50 ? 'Intermediate' : 'Beginner'; }
  getLevelClass(p: number): string { return p >= 90 ? 'level-expert' : p >= 75 ? 'level-advanced' : p >= 50 ? 'level-intermediate' : 'level-beginner'; }
  getBarColor(p: number): string { return p >= 90 ? '#22c55e' : p >= 75 ? '#3b82f6' : p >= 50 ? '#f59e0b' : '#ef4444'; }
}

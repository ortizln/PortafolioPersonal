import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Project } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="container">
          <a routerLink="/portfolio" class="back-link">&larr; Back to Portfolio</a>
          <h1>Projects</h1>
        </div>
      </div>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle"></i>
        <p>Could not load projects. Please try again later.</p>
        <button class="btn-retry" (click)="loadData()">Retry</button>
      </div>

      <div *ngIf="!loading && !error && !projects.length" class="page-empty">
        <i class="bi bi-folder"></i>
        <p>No projects added yet.</p>
      </div>

      <div *ngIf="!loading && projects.length" class="page-content" data-aos="fade-up">
        <div class="container">
          <div class="projects-grid">
            <div
              class="project-card"
              *ngFor="let project of projects; let i = index"
              data-aos="fade-up"
              [attr.data-aos-delay]="i * 80"
              [class.featured]="project.isFeatured"
              (click)="selectedProject = project"
            >
              <div class="project-banner">
                <img
                  class="project-image"
                  [src]="getPrimaryImage(project) || 'assets/project-placeholder.svg'"
                  [alt]="project.title"
                />
                <span class="project-featured-badge" *ngIf="project.isFeatured">
                  <i class="bi bi-star-fill"></i> Featured
                </span>
              </div>
              <div class="project-body">
                <div class="project-techs">
                  <span class="project-tech" *ngFor="let tech of project.technologies" [style.--tech-color]="tech.color || '#64ffda'">{{ tech.name }}</span>
                </div>
                <h3 class="project-title">{{ project.title }}</h3>
                <p class="project-description">{{ project.description }}</p>
                <div class="project-links">
                  <a *ngIf="project.demoUrl" [href]="project.demoUrl" target="_blank" class="project-link" (click)="$event.stopPropagation()"><i class="bi bi-box-arrow-up-right"></i> Demo</a>
                  <a *ngIf="project.githubUrl" [href]="project.githubUrl" target="_blank" class="project-link" (click)="$event.stopPropagation()"><i class="bi bi-github"></i> Code</a>
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
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .project-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; cursor: pointer; transition: var(--transition); }
    .project-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
    .project-card.featured { border-color: var(--accent); }
    .project-banner { position: relative; width: 100%; height: 200px; overflow: hidden; background: var(--bg-secondary); }
    .project-image { width: 100%; height: 100%; object-fit: cover; }
    .project-featured-badge { position: absolute; top: 12px; right: 12px; background: rgba(var(--accent-rgb, 100, 255, 218), 0.9); color: var(--bg-primary); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .project-body { padding: 20px; }
    .project-techs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .project-tech { background: rgba(var(--accent-rgb, 100, 255, 218), 0.08); color: var(--accent); padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; }
    .project-title { font-size: 1.1rem; font-weight: 600; color: var(--white); margin: 0 0 8px; }
    .project-description { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .project-links { display: flex; gap: 12px; }
    .project-link { font-size: 0.82rem; color: var(--accent); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
    .project-link:hover { opacity: 0.8; }
  `]
})
export class ProjectsPageComponent implements OnInit {
  private api = inject(ApiService);
  projects: Project[] = [];
  selectedProject: Project | null = null;
  loading = true;
  error = false;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = false;
    this.api.getPublicProjects().subscribe({
      next: (projects) => {
        this.projects = projects || [];
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((img: any) => img.isPrimary);
    const url = primary?.url || project.images?.[0]?.url || project.bannerImage || null;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }
}

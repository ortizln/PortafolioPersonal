import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Project, ProjectMember } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [DatePipe, NgIf, NgFor, NgClass, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-loading" *ngIf="loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle"></i>
        <p>No se encontró el proyecto.</p>
        <a routerLink="/projects" class="btn-retry">Volver a proyectos</a>
      </div>

      <ng-container *ngIf="!loading && !error && project">
        <div class="project-hero">
          <img class="hero-image" [src]="getPrimaryImage(project) || 'assets/project-placeholder.svg'" [alt]="'Portada de ' + project.title" />
          <div class="hero-overlay"></div>
          <div class="container">
            <a routerLink="/projects" class="back-link">&larr; Volver a Proyectos</a>
            <span class="hero-badge" *ngIf="project.isCaseStudy"><i class="bi bi-graph-up-arrow"></i> Caso de éxito</span>
            <h1 class="hero-title">{{ project.title }}</h1>
            <p class="hero-subtitle" *ngIf="project.summary">{{ project.summary }}</p>
            <div class="hero-meta">
              <span *ngIf="project.clientRel?.name || project.client"><i class="bi bi-building"></i> {{ project.clientRel?.name || project.client }}</span>
              <span *ngIf="project.service?.name"><i class="bi bi-briefcase"></i> {{ project.service.name }}</span>
              <span *ngIf="project.projectType"><i class="bi bi-tag"></i> {{ project.projectType }}</span>
              <span *ngIf="project.startDate"><i class="bi bi-calendar"></i> {{ project.startDate | date: 'MMM yyyy' }}</span>
            </div>
            <div class="hero-actions" *ngIf="project.demoUrl || project.githubUrl || project.gitlabUrl || project.videoUrl">
              <a *ngIf="project.demoUrl" class="btn-hero primary" [href]="project.demoUrl" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Demo</a>
              <a *ngIf="project.githubUrl" class="btn-hero" [href]="project.githubUrl" target="_blank" rel="noopener"><i class="bi bi-github"></i> GitHub</a>
              <a *ngIf="project.gitlabUrl" class="btn-hero" [href]="project.gitlabUrl" target="_blank" rel="noopener"><i class="bi bi-gitlab"></i> GitLab</a>
              <a *ngIf="project.videoUrl" class="btn-hero" [href]="project.videoUrl" target="_blank" rel="noopener"><i class="bi bi-play-circle"></i> Video</a>
            </div>
          </div>
        </div>

        <div class="container content">
          <div class="techs" *ngIf="project.technologies?.length">
            <span class="tech" *ngFor="let tech of project.technologies" [style.--tech-color]="tech.color || 'var(--accent)'">{{ tech.name }}</span>
          </div>

          <section class="section" *ngIf="project.description">
            <h2>Resumen</h2>
            <p class="section-text">{{ project.description }}</p>
          </section>

          <section class="section" *ngIf="project.challenge">
            <h2>El problema</h2>
            <p class="section-text">{{ project.challenge }}</p>
          </section>

          <section class="section" *ngIf="project.solution">
            <h2>La solución</h2>
            <p class="section-text">{{ project.solution }}</p>
          </section>

          <section class="section" *ngIf="project.architecture">
            <h2>Arquitectura</h2>
            <p class="section-text">{{ project.architecture }}</p>
          </section>

          <section class="section" *ngIf="project.features?.length">
            <h2>Características</h2>
            <ul class="feature-list">
              <li *ngFor="let f of project.features"><i class="bi bi-check2-circle"></i> {{ f }}</li>
            </ul>
          </section>

          <section class="section" *ngIf="project.images?.length">
            <h2>Galería</h2>
            <div class="gallery">
              <img class="gallery-item" *ngFor="let img of project.images" [src]="getImageUrl(img)" [alt]="img.alt || 'Imagen del proyecto'" />
            </div>
          </section>

          <section class="section" *ngIf="project.results || project.metrics?.length">
            <h2>Resultados</h2>
            <p class="section-text" *ngIf="project.results">{{ project.results }}</p>
            <div class="metrics" *ngIf="project.metrics?.length">
              <div class="metric" *ngFor="let m of project.metrics">
                <span class="metric-value">{{ m.value }}</span>
                <span class="metric-label">{{ m.label }}</span>
              </div>
            </div>
          </section>

          <section class="section" *ngIf="project.members?.length">
            <h2>Equipo que participó</h2>
            <div class="team-grid">
              <a class="team-card" *ngFor="let member of project.members" [routerLink]="'/equipo/' + member.teamMember?.slug">
                <img class="team-avatar" [src]="getMemberAvatar(member)" [alt]="member.teamMember?.name" />
                <div class="team-info">
                  <span class="team-name">{{ member.teamMember?.fullName }}</span>
                  <span class="team-role">{{ member.isLead ? 'Líder · ' : '' }}{{ member.role || member.teamMember?.professionalTitle || 'Miembro del equipo' }}</span>
                </div>
              </a>
            </div>
          </section>
        </div>

        <section class="related" *ngIf="related.length">
          <div class="container">
            <h2>Proyectos relacionados</h2>
            <div class="related-grid">
              <a class="related-card" *ngFor="let p of related" [routerLink]="'/proyectos/' + p.slug">
                <img class="related-image" [src]="getPrimaryImage(p) || 'assets/project-placeholder.svg'" [alt]="p.title" />
                <div class="related-body">
                  <h3>{{ p.title }}</h3>
                  <p>{{ p.summary || p.description }}</p>
                </div>
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
    .page-loading { display: flex; justify-content: center; padding: 120px 0; }
    .page-error { text-align: center; padding: 120px 24px; color: var(--text-muted); }
    .page-error i { font-size: 3rem; color: var(--accent); margin-bottom: 16px; display: block; }
    .btn-retry { background: var(--accent); color: var(--bg-primary); border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; margin-top: 12px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .project-hero { position: relative; min-height: 320px; display: flex; align-items: flex-end; background: var(--bg-secondary); overflow: hidden; }
    .hero-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.35; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-primary) 0%, rgba(13,17,23,0.4) 60%); }
    .project-hero .container { position: relative; z-index: 2; padding-top: 40px; padding-bottom: 40px; }
    .back-link { color: var(--accent); font-size: 0.85rem; text-decoration: none; display: inline-block; margin-bottom: 16px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(100,255,218,0.12); color: var(--accent); border: 1px solid rgba(100,255,218,0.3); padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; margin-bottom: 12px; }
    .hero-title { font-size: 2.2rem; font-weight: 700; color: var(--white); margin: 0 0 8px; }
    .hero-subtitle { font-size: 1rem; color: var(--text-secondary); margin: 0 0 16px; max-width: 720px; line-height: 1.6; }
    .hero-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; }
    .hero-meta span { display: inline-flex; align-items: center; gap: 6px; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .btn-hero { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; text-decoration: none; border: 1px solid var(--border); color: var(--text-primary); transition: var(--transition); }
    .btn-hero:hover { border-color: var(--accent); }
    .btn-hero.primary { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--bg-primary); border: none; }
    .content { padding: 48px 24px; display: flex; flex-direction: column; gap: 40px; }
    .techs { display: flex; flex-wrap: wrap; gap: 8px; }
    .tech { background: rgba(100,255,218,0.08); color: var(--accent); padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; }
    .section h2 { font-size: 1.3rem; font-weight: 700; color: var(--white); margin: 0 0 14px; padding-left: 14px; border-left: 3px solid var(--accent); }
    .section-text { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.8; margin: 0; white-space: pre-wrap; }
    .feature-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
    .feature-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 0.9rem; color: var(--text-secondary); }
    .feature-list i { color: var(--accent); margin-top: 3px; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .gallery-item { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; border: 1px solid var(--border); }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 16px; }
    .metric { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: center; }
    .metric-value { display: block; font-size: 1.6rem; font-weight: 700; color: var(--accent); }
    .metric-label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .team-card { display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 12px; text-decoration: none; transition: var(--transition); }
    .team-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .team-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: var(--bg-secondary); }
    .team-info { display: flex; flex-direction: column; min-width: 0; }
    .team-name { font-size: 0.9rem; font-weight: 600; color: var(--white); }
    .team-role { font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .related { padding: 48px 0 80px; border-top: 1px solid var(--border); }
    .related h2 { font-size: 1.3rem; font-weight: 700; color: var(--white); margin: 0 0 24px; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .related-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; text-decoration: none; transition: var(--transition); display: block; }
    .related-card:hover { border-color: var(--accent); transform: translateY(-3px); }
    .related-image { width: 100%; height: 150px; object-fit: cover; }
    .related-body { padding: 14px; }
    .related-body h3 { font-size: 0.95rem; color: var(--white); margin: 0 0 6px; }
    .related-body p { font-size: 0.8rem; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    @media (max-width: 768px) { .hero-title { font-size: 1.6rem; } }
  `]
})
export class ProjectDetailPageComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seoService = inject(SeoService);

  project: Project | null = null;
  related: Project[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) {
        this.error = true;
        this.loading = false;
        return;
      }
      this.loading = true;
      this.error = false;
      this.api.getPublicProjectBySlug(slug).subscribe({
        next: (res) => {
          this.project = res.project;
          this.related = (res.related || []).map((p) => ({
            ...p,
            technologies: (p.technologies as any[] | undefined)?.map((t: any) =>
              t.technology ? { ...t.technology, id: t.technology.id } : t
            ) || [],
          }));
          this.loading = false;
          this.seoService.setSeo({
            title: `${res.project.title} | Proyectos ALANTEK`,
            description: res.project.summary || res.project.description || `Proyecto ${res.project.title} de ALANTEK.`,
            canonical: this.seoService.canonicalUrl(`/proyectos/${slug}`),
            robots: 'index,follow',
          });
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
    });
  }

  getImageUrl(image: any): string {
    if (!image?.url) return '';
    if (image.url.startsWith('http://') || image.url.startsWith('https://') || image.url.startsWith('data:')) return image.url;
    return `${environment.uploadUrl}/${image.url}`;
  }

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((img: any) => img.isPrimary);
    const url = primary?.url || project.images?.[0]?.url || project.bannerImage || null;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  getMemberAvatar(member: ProjectMember): string {
    const avatar = member.teamMember?.photoUrl;
    if (!avatar) return 'assets/avatar-placeholder.svg';
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) return avatar;
    return `${environment.uploadUrl}/${avatar}`;
  }
}

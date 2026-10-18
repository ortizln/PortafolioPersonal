import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Project, ProjectMember } from '../core/models';
import { environment } from '../../environments/environment';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ProjectCarouselComponent } from '../shared/components/project-carousel.component';
import { AvatarComponent } from '../shared/components/avatar.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [DatePipe, NgIf, NgFor, RouterLink, ContactCtaComponent, ProjectCarouselComponent, AvatarComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <div class="page-loading" *ngIf="loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No se encontró el proyecto.</p>
        <a routerLink="/projects" class="btn-retry">Volver a proyectos</a>
      </div>

      <ng-container *ngIf="!loading && !error && project">
        <header class="page-hero page-hero--split">
          <div class="container-alantek">
            <div class="page-hero-inner">
              <div>
                <span class="eyebrow" *ngIf="project.isCaseStudy">
                  <i class="bi bi-graph-up-arrow" aria-hidden="true"></i> Caso de éxito
                </span>
                <h1 class="page-title">{{ project.title }}</h1>
                <p class="page-subtitle" *ngIf="project.summary">{{ project.summary }}</p>
              </div>
              <div class="hero-actions" *ngIf="project.demoUrl || project.githubUrl || project.gitlabUrl || project.videoUrl">
                <a *ngIf="project.demoUrl" class="btn-alantek-accent" [href]="project.demoUrl" target="_blank" rel="noopener">
                  <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> Demo
                </a>
                <a *ngIf="project.githubUrl" class="btn-alantek-outline" [href]="project.githubUrl" target="_blank" rel="noopener">
                  <i class="bi bi-github" aria-hidden="true"></i> GitHub
                </a>
                <a *ngIf="project.gitlabUrl" class="btn-alantek-outline" [href]="project.gitlabUrl" target="_blank" rel="noopener">
                  <i class="bi bi-gitlab" aria-hidden="true"></i> GitLab
                </a>
                <a *ngIf="project.videoUrl" class="btn-alantek-ghost" [href]="project.videoUrl" target="_blank" rel="noopener">
                  <i class="bi bi-play-circle" aria-hidden="true"></i> Video
                </a>
              </div>
            </div>
          </div>
        </header>

        <section class="page-section">
          <div class="container-alantek container-narrow content">
            <img
              class="detail-banner"
              *ngIf="getPrimaryImage(project)"
              [src]="getPrimaryImage(project)"
              [alt]="'Portada de ' + project.title"
              (error)="onImgError($event)"
            />

            <div class="detail-meta">
              <span *ngIf="project.clientRel?.name || project.client"><i class="bi bi-building" aria-hidden="true"></i> {{ project.clientRel?.name || project.client }}</span>
              <span *ngIf="project.service?.name"><i class="bi bi-briefcase" aria-hidden="true"></i> {{ project.service.name }}</span>
              <span *ngIf="project.projectType"><i class="bi bi-tag" aria-hidden="true"></i> {{ project.projectType }}</span>
              <span *ngIf="project.startDate"><i class="bi bi-calendar" aria-hidden="true"></i> {{ project.startDate | date: 'MMM yyyy' }}</span>
            </div>

            <div class="techs" *ngIf="project.technologies?.length">
              <span class="chip" *ngFor="let tech of project.technologies">{{ tech.name }}</span>
            </div>

            <div class="prose" appScrollReveal>
              <section *ngIf="project.description">
                <h2>Resumen</h2>
                <p>{{ project.description }}</p>
              </section>

              <section *ngIf="project.challenge">
                <h2>El problema</h2>
                <p>{{ project.challenge }}</p>
              </section>

              <section *ngIf="project.solution">
                <h2>La solución</h2>
                <p>{{ project.solution }}</p>
              </section>

              <section *ngIf="project.architecture">
                <h2>Arquitectura</h2>
                <p>{{ project.architecture }}</p>
              </section>

              <section *ngIf="project.features?.length">
                <h2>Características</h2>
                <ul class="feature-list">
                  <li *ngFor="let f of project.features"><i class="bi bi-check2-circle" aria-hidden="true"></i> {{ f }}</li>
                </ul>
              </section>

              <section *ngIf="project.results || project.metrics?.length">
                <h2>Resultados</h2>
                <p *ngIf="project.results">{{ project.results }}</p>
                <div class="metrics" *ngIf="project.metrics?.length">
                  <div class="metric" *ngFor="let m of project.metrics">
                    <span class="metric-value">{{ m.value }}</span>
                    <span class="metric-label">{{ m.label }}</span>
                  </div>
                </div>
              </section>
            </div>

            <section *ngIf="project.images?.length" class="gallery-section">
              <h2 class="gallery-title">Galería</h2>
              <div class="gallery">
                <img class="gallery-item" *ngFor="let img of project.images" [src]="getImageUrl(img)" [alt]="img.alt || 'Imagen del proyecto'" loading="lazy" decoding="async" />
              </div>
            </section>

            <section *ngIf="project.members?.length" class="team-section">
              <h2 class="gallery-title">Equipo que participó</h2>
              <div class="grid-team">
                <a class="card-member" *ngFor="let member of project.members" [routerLink]="'/equipo/' + member.teamMember?.slug" appScrollReveal>
                  <app-avatar class="member-photo" [src]="getMemberAvatar(member)" [name]="member.teamMember?.fullName" [size]="96"></app-avatar>
                  <h3>{{ member.teamMember?.fullName }}</h3>
                  <span class="member-role">{{ member.isLead ? 'Líder · ' : '' }}{{ member.role || member.teamMember?.professionalTitle || 'Miembro del equipo' }}</span>
                </a>
              </div>
            </section>
          </div>
        </section>

        <section class="page-section page-section--alt" *ngIf="related.length">
          <div class="container-alantek">
            <h2 class="section-heading" appScrollReveal>Proyectos relacionados</h2>
            <app-project-carousel [projects]="related"></app-project-carousel>
          </div>
        </section>
      </ng-container>

      <app-contact-cta
        eyebrow="Tu proyecto"
        title="¿Quieres algo similar?"
        text="Cuéntanos tu idea y te ayudaremos a llevarla al siguiente nivel."
      ></app-contact-cta>
    </div>
  `,
  styles: [`
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }
    .techs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
    .detail-banner + .detail-meta {
      margin-top: 0;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-2);
    }
    .feature-list li {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      color: var(--text-secondary);
    }
    .feature-list i {
      color: var(--accent);
      margin-top: 3px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--space-3);
      margin-top: var(--space-4);
      list-style: none;
      padding: 0;
    }
    .metric {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      text-align: center;
    }
    .metric-value {
      display: block;
      font-size: var(--fs-2xl);
      font-weight: var(--fw-bold);
      color: var(--accent);
    }
    .metric-label {
      display: block;
      font-size: var(--fs-sm);
      color: var(--text-muted);
      margin-top: var(--space-1);
    }
    .gallery-title,
    .section-heading {
      font-family: var(--font-heading);
      font-size: var(--fs-2xl);
      font-weight: var(--fw-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-5);
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--space-3);
    }
    .gallery-item {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
    }
  `],
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
          this.project = {
            ...res.project,
            technologies: (res.project.technologies as any[] | undefined)?.map((t: any) =>
              t.technology ? { ...t.technology, id: t.technology.id } : t
            ) || [],
            categories: (res.project.categories as any[] | undefined)?.map((c: any) =>
              c.category ? { ...c.category, id: c.category.id } : c
            ) || [],
          };
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
            image: this.getPrimaryImage(res.project) || undefined,
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

  onImgError(event: Event): void {
    const el = event.target as HTMLImageElement;
    const fallback = 'assets/project-placeholder.svg';
    if (el && !el.src.endsWith(fallback)) el.src = fallback;
  }

  getMemberAvatar(member: ProjectMember): string | null {
    const avatar = member.teamMember?.photoUrl;
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) return avatar;
    return `${environment.uploadUrl}/${avatar}`;
  }
}

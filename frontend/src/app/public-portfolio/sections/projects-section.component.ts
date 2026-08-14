import { Component, Input, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { Project } from '../../core/models';
import { UploadUrlPipe } from '../../shared/upload-url.pipe';

@Component({
  selector: 'app-projects-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, UploadUrlPipe],
  template: `
    <section id="projects" class="projects-section" aria-label="Proyectos destacados">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Portafolio</span>
          <h2 class="section-title">Proyectos Destacados</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>

        <div class="projects-filters" data-aos="fade-up" role="tablist" aria-label="Filtros de proyectos">
          <button
            class="filter-btn"
            [class.active]="activeFilter === 'all'"
            (click)="setFilter('all')"
            role="tab"
            [attr.aria-selected]="activeFilter === 'all'"
          >Todos</button>
          <button
            class="filter-btn"
            *ngFor="let tech of availableTechs"
            [class.active]="activeFilter === tech"
            (click)="setFilter(tech)"
            role="tab"
            [attr.aria-selected]="activeFilter === tech"
          >{{ tech }}</button>
        </div>

        <div class="projects-grid">
          <div
            class="project-card"
            *ngFor="let project of filteredProjects; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 100"
            [class.featured]="project.isFeatured"
            (click)="openProject(project)"
            role="button"
            [attr.aria-label]="'Ver detalle de ' + project.title"
            tabindex="0"
            (keydown)="onCardKeydown($event, project)"
          >
            <div class="project-banner">
              <img
                class="project-image"
                [src]="getPrimaryImage(project) || 'assets/project-placeholder.svg'"
                [alt]="'Captura del proyecto ' + project.title"
              />
              <div class="project-overlay" aria-hidden="true">
                <div class="overlay-links">
                  <a
                    *ngIf="project.demoUrl"
                    [href]="project.demoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="overlay-link"
                    (click)="stopEvent($event)"
                  >
                    <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                    <span>Demo</span>
                  </a>
                  <a
                    *ngIf="project.githubUrl"
                    [href]="project.githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="overlay-link"
                    (click)="stopEvent($event)"
                  >
                    <i class="bi bi-github" aria-hidden="true"></i>
                    <span>Código</span>
                  </a>
                </div>
              </div>
              <span class="project-featured-badge" *ngIf="project.isFeatured">
                <i class="bi bi-star-fill" aria-hidden="true"></i> Destacado
              </span>
            </div>

            <div class="project-body">
              <div class="project-techs">
                <span
                  class="project-tech"
                  *ngFor="let tech of project.technologies"
                  [style.--tech-color]="tech.color || '#64ffda'"
                >
                  {{ tech.name }}
                </span>
              </div>
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-description">{{ project.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="selectedProject" (click)="closeProject()" (keydown.escape)="closeProject()" role="dialog" aria-modal="true" [attr.aria-label]="'Detalle del proyecto: ' + selectedProject.title">
        <div class="modal-content" (click)="stopEvent($event)" role="document" tabindex="-1" (keydown.arrowleft)="prevSlide()" (keydown.arrowright)="nextSlide()">
          <button class="modal-close" (click)="closeProject()" aria-label="Cerrar">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
          <div class="modal-body">
            <div class="modal-media" [class.portrait]="imageOrientation === 'portrait'">
              <div class="carousel-container" *ngIf="carouselSlides.length > 0">
                <div class="carousel-slide">
                  <iframe
                    *ngIf="carouselSlides[currentSlide]?.type === 'video'"
                    class="modal-video"
                    [src]="carouselSlides[currentSlide].url"
                    frameborder="0"
                    allowfullscreen
                    title="Video del proyecto"
                  ></iframe>
                  <img
                    *ngIf="carouselSlides[currentSlide]?.type === 'image'"
                    class="modal-image"
                    [src]="carouselSlides[currentSlide].url"
                    [alt]="'Imagen del proyecto ' + selectedProject.title"
                    (load)="onImageLoad($event)"
                  />
                </div>
                <button class="carousel-btn carousel-prev" (click)="prevSlide()" *ngIf="carouselSlides.length > 1" aria-label="Anterior">
                  <i class="bi bi-chevron-left" aria-hidden="true"></i>
                </button>
                <button class="carousel-btn carousel-next" (click)="nextSlide()" *ngIf="carouselSlides.length > 1" aria-label="Siguiente">
                  <i class="bi bi-chevron-right" aria-hidden="true"></i>
                </button>
                <div class="carousel-counter" *ngIf="carouselSlides.length > 1">
                  {{ currentSlide + 1 }} / {{ carouselSlides.length }}
                </div>
                <div class="carousel-dots" *ngIf="carouselSlides.length > 1">
                  <span
                    class="carousel-dot"
                    *ngFor="let _ of carouselSlides; let i = index"
                    [class.active]="i === currentSlide"
                    (click)="currentSlide = i"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="'Ir a slide ' + (i+1)"
                    (keydown.enter)="currentSlide = i"
                  ></span>
                </div>
              </div>
              <div class="modal-video-link" *ngIf="selectedProject.videoUrl">
                <i class="bi bi-play-circle" aria-hidden="true"></i>
                <a [href]="selectedProject.videoUrl" target="_blank" rel="noopener noreferrer">
                  {{ selectedProject.videoUrl }}
                </a>
              </div>
            </div>
            <div class="modal-details">
              <h2 class="modal-title">{{ selectedProject.title }}</h2>
              <div class="modal-techs">
                <span class="modal-tech" *ngFor="let tech of selectedProject.technologies">
                  {{ tech.name }}
                </span>
              </div>
              <p class="modal-description">{{ selectedProject.description }}</p>
              <div class="modal-links" *ngIf="selectedProject.demoUrl || selectedProject.githubUrl || selectedProject.videoUrl">
                <div class="modal-link-item" *ngIf="selectedProject.githubUrl">
                  <i class="bi bi-github" aria-hidden="true"></i>
                  <a [href]="selectedProject.githubUrl" target="_blank" rel="noopener noreferrer">Repositorio</a>
                </div>
                <div class="modal-link-item" *ngIf="selectedProject.videoUrl">
                  <i class="bi bi-play-circle" aria-hidden="true"></i>
                  <a [href]="selectedProject.videoUrl" target="_blank" rel="noopener noreferrer">Video demostrativo</a>
                </div>
              </div>
              <div class="modal-actions">
                <a *ngIf="selectedProject.demoUrl" [href]="selectedProject.demoUrl" target="_blank" class="modal-btn primary" [attr.aria-label]="'Ver demo de ' + selectedProject.title">
                  <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> Demo
                </a>
                <a *ngIf="selectedProject.githubUrl" [href]="selectedProject.githubUrl" target="_blank" class="modal-btn secondary" [attr.aria-label]="'Ver código de ' + selectedProject.title">
                  <i class="bi bi-github" aria-hidden="true"></i> Código
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./projects-section.component.scss'],
})
export class ProjectsSectionComponent {
  @Input() projects: Project[] = [];
  selectedProject: Project | null = null;
  currentSlide = 0;
  carouselSlides: { type: 'video' | 'image'; url: any }[] = [];
  activeFilter = 'all';
  imageOrientation: 'portrait' | 'landscape' | 'square' = 'landscape';

  get availableTechs(): string[] {
    const set = new Set<string>();
    this.projects.forEach(p => p.technologies?.forEach(t => set.add(t.name)));
    return [...set];
  }

  get filteredProjects(): Project[] {
    if (this.activeFilter === 'all') return this.projects;
    return this.projects.filter(p => p.technologies?.some(t => t.name === this.activeFilter));
  }

  setFilter(tech: string): void {
    this.activeFilter = tech;
  }

  private sanitizer = inject(DomSanitizer);

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((img) => img.isPrimary);
    const url = primary?.url || project.images?.[0]?.url || project.bannerImage || null;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  getImageUrl(image: any): string {
    if (!image?.url) return '';
    if (image.url.startsWith('http://') || image.url.startsWith('https://') || image.url.startsWith('data:')) return image.url;
    return `${environment.uploadUrl}/${image.url}`;
  }

  getVideoUrl(url: string | null | undefined): SafeResourceUrl | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`);
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}`);
    }
    return null;
  }

  openProject(project: Project): void {
    this.selectedProject = project;
    this.imageOrientation = 'landscape';
    this.buildCarousel(project);
  }

  closeProject(): void {
    this.selectedProject = null;
    this.carouselSlides = [];
    this.currentSlide = 0;
    this.imageOrientation = 'landscape';
  }

  private buildCarousel(project: Project): void {
    this.carouselSlides = [];
    this.currentSlide = 0;
    const videoUrl = this.getVideoUrl(project.videoUrl);
    if (videoUrl) {
      this.carouselSlides.push({ type: 'video', url: videoUrl });
    }
    (project.images || []).forEach((img: any) => {
      const url = this.getImageUrl(img);
      if (url) this.carouselSlides.push({ type: 'image', url });
    });
  }

  nextSlide(): void {
    if (this.carouselSlides.length > 1) {
      this.currentSlide = (this.currentSlide + 1) % this.carouselSlides.length;
      this.imageOrientation = 'landscape';
    }
  }

  prevSlide(): void {
    if (this.carouselSlides.length > 1) {
      this.currentSlide = (this.currentSlide - 1 + this.carouselSlides.length) % this.carouselSlides.length;
      this.imageOrientation = 'landscape';
    }
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio < 0.9) this.imageOrientation = 'portrait';
      else if (ratio > 1.1) this.imageOrientation = 'landscape';
      else this.imageOrientation = 'square';
    }
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
  }

  onCardKeydown(event: KeyboardEvent, project: Project): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openProject(project);
    }
  }
}

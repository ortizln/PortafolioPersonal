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
        <div class="modal-content" (click)="stopEvent($event)" role="document" tabindex="-1">
          <button class="modal-close" (click)="closeProject()" aria-label="Cerrar">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
          <div class="modal-body">
            <div class="modal-media">
              <iframe
                *ngIf="getVideoUrl(selectedProject.videoUrl)"
                class="modal-video"
                [src]="getVideoUrl(selectedProject.videoUrl)"
                frameborder="0"
                allowfullscreen
                title="Video del proyecto"
              ></iframe>
              <img
                *ngIf="!getVideoUrl(selectedProject.videoUrl) && !selectedImage"
                class="modal-image"
                [src]="getPrimaryImage(selectedProject) || 'assets/project-placeholder.svg'"
                [alt]="'Imagen principal de ' + selectedProject.title"
              />
              <img
                *ngIf="selectedImage"
                class="modal-image"
                [src]="selectedImage"
                [alt]="'Imagen del proyecto ' + selectedProject.title"
              />
            </div>
            <div class="modal-details">
              <h2 class="modal-title">{{ selectedProject.title }}</h2>
              <div class="modal-techs">
                <span class="modal-tech" *ngFor="let tech of selectedProject.technologies">
                  {{ tech.name }}
                </span>
              </div>
              <p class="modal-description">{{ selectedProject.description }}</p>
              <div class="modal-gallery" *ngIf="selectedProject.images?.length">
                <span class="gallery-label">Galería</span>
                <div class="gallery-thumbs">
                  <img
                    *ngFor="let img of selectedProject.images"
                    [src]="getImageUrl(img)"
                    [class.active]="getImageUrl(img) === selectedImage"
                    (click)="viewImage(img)"
                    class="gallery-thumb"
                    [attr.aria-label]="'Ver imagen'"
                    role="button"
                    tabindex="0"
                    (keydown.enter)="viewImage(img)"
                  />
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
  selectedImage: string | null = null;
  activeFilter = 'all';

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
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
    );
    if (match) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${match[1]}`
      );
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://player.vimeo.com/video/${vimeoMatch[1]}`
      );
    }
    return null;
  }

  openProject(project: Project): void {
    this.selectedProject = project;
    this.selectedImage = null;
  }

  closeProject(): void {
    this.selectedProject = null;
    this.selectedImage = null;
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
  }

  viewImage(img: any): void {
    this.selectedImage = this.getImageUrl(img);
  }

  onCardKeydown(event: KeyboardEvent, project: Project): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openProject(project);
    }
  }
}

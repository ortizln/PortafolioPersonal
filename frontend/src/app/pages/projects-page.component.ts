import { Component, OnInit, inject, HostListener } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
          <a routerLink="/portfolio" class="back-link">&larr; Volver al Portafolio</a>
          <h1>Proyectos</h1>
        </div>
      </div>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle"></i>
        <p>No se pudieron cargar los proyectos. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !projects.length" class="page-empty">
        <i class="bi bi-folder"></i>
        <p>No hay proyectos aún.</p>
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
              (click)="openProject(project)"
              role="button"
              [attr.aria-label]="'Ver detalle de ' + project.title"
              tabindex="0"
              (keydown.enter)="openProject(project)"
            >
              <div class="project-banner">
                <img
                  class="project-image"
                  [src]="getPrimaryImage(project) || 'assets/project-placeholder.svg'"
                  [alt]="'Captura del proyecto ' + project.title"
                />
                <span class="project-featured-badge" *ngIf="project.isFeatured">
                  <i class="bi bi-star-fill"></i> Destacado
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
                  <a *ngIf="project.githubUrl" [href]="project.githubUrl" target="_blank" class="project-link" (click)="$event.stopPropagation()"><i class="bi bi-github"></i> Código</a>
                </div>
              </div>
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
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal-content { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; }
    .modal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 1rem; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
    .modal-close:hover { border-color: var(--accent); color: var(--accent); }
    .modal-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    @media (max-width: 768px) { .modal-body { grid-template-columns: 1fr; } }
    .modal-media { position: relative; background: #000; border-radius: 20px 0 0 20px; overflow: hidden; min-height: 200px; display: flex; flex-direction: column; }
    @media (max-width: 768px) { .modal-media { border-radius: 20px 20px 0 0; min-height: 200px; } }
    .carousel-container { position: relative; flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #000; min-height: 200px; max-height: 70vh; }
    .carousel-slide { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .modal-video { width: 100%; height: 100%; min-height: 350px; border: none; }
    .modal-image { max-width: 100%; max-height: 70vh; width: 100%; height: 100%; object-fit: contain; }
    .modal-media.portrait .modal-image { width: auto; height: 100%; }
    .carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.5); color: #fff; font-size: 1.1rem; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
    .carousel-btn:hover { background: rgba(0,0,0,0.8); border-color: var(--accent); color: var(--accent); }
    .carousel-prev { left: 10px; }
    .carousel-next { right: 10px; }
    .carousel-counter { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; z-index: 5; }
    .carousel-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 5; }
    .carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: var(--transition); }
    .carousel-dot.active { background: var(--accent); width: 20px; border-radius: 4px; }
    .modal-video-link { padding: 8px 12px; background: rgba(0,0,0,0.6); display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--text-muted); flex-shrink: 0; }
    .modal-video-link a { color: var(--accent); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .modal-video-link a:hover { text-decoration: underline; }
    .modal-details { padding: 32px; display: flex; flex-direction: column; gap: 16px; }
    .modal-title { font-size: 1.4rem; font-weight: 700; color: var(--white); margin: 0; }
    .modal-techs { display: flex; flex-wrap: wrap; gap: 6px; }
    .modal-tech { background: rgba(var(--accent-rgb, 100, 255, 218), 0.1); color: var(--accent); padding: 4px 12px; border-radius: 6px; font-size: 0.78rem; }
    .modal-description { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
    .modal-links { display: flex; flex-direction: column; gap: 6px; }
    .modal-link-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; }
    .modal-link-item a { color: var(--accent); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .modal-link-item a:hover { text-decoration: underline; }
    .modal-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: auto; }
    .modal-btn { padding: 10px 20px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: var(--transition); }
    .modal-btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--bg-primary); }
    .modal-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(100,255,218,0.3); }
    .modal-btn.secondary { background: transparent; border: 1px solid var(--border); color: var(--text-primary); }
    .modal-btn.secondary:hover { border-color: var(--accent); }
  `]
})
export class ProjectsPageComponent implements OnInit {
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  projects: Project[] = [];
  selectedProject: Project | null = null;
  currentSlide = 0;
  carouselSlides: { type: 'video' | 'image'; url: any }[] = [];
  imageOrientation: 'portrait' | 'landscape' | 'square' = 'landscape';
  loading = true;
  error = false;

  ngOnInit(): void {
    this.loadData();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.selectedProject) return;
    if (event.key === 'ArrowLeft') this.prevSlide();
    if (event.key === 'ArrowRight') this.nextSlide();
  }

  private loadData(): void {
    this.loading = true;
    this.error = false;
    this.api.getPublicProjects().subscribe({
      next: (projects) => {
        this.projects = (projects || []).map((p) => ({
          ...p,
          technologies: (p.technologies as any[] | undefined)?.map((t: any) =>
            t.technology ? { ...t.technology, id: t.technology.id } : t
          ) || [],
        }));
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

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio < 0.9) this.imageOrientation = 'portrait';
      else if (ratio > 1.1) this.imageOrientation = 'landscape';
      else this.imageOrientation = 'square';
    }
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

  stopEvent(event: Event): void {
    event.stopPropagation();
  }
}

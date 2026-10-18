import { Component, OnInit, inject, HostListener } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { Project } from '../core/models';
import { environment } from '../../environments/environment';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { TechnologyMarqueeComponent } from '../shared/components/technology-marquee.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, ContactCtaComponent, TechnologyMarqueeComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--center">
        <div class="container-alantek">
          <span class="eyebrow">Nuestro trabajo</span>
          <h1 class="page-title">Portafolio</h1>
          <p class="page-subtitle">Explora los proyectos y casos de éxito que hemos construido.</p>

          <div class="filters">
            <div class="search-box">
              <i class="bi bi-search" aria-hidden="true"></i>
              <input
                type="search"
                placeholder="Buscar proyecto..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchInput()"
                aria-label="Buscar proyecto"
              />
              <button *ngIf="searchTerm" type="button" class="clear-btn" (click)="clearSearch()" aria-label="Limpiar búsqueda">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
            <div class="grid-filters" *ngIf="filterCategories.length">
              <button
                type="button"
                class="chip chip--clickable"
                [class.chip--active]="activeCategory === ''"
                (click)="selectCategory('')"
              >Todos</button>
              <button
                type="button"
                class="chip chip--clickable"
                *ngFor="let c of filterCategories"
                [class.chip--active]="activeCategory === c.slug"
                (click)="selectCategory(c.slug)"
              >{{ c.name }}</button>
            </div>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No se pudieron cargar los proyectos. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()" aria-label="Reintentar">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !projects.length" class="page-empty">No hay proyectos aún.</div>

      <section class="page-section" *ngIf="!loading && !error && projects.length">
        <div class="container-alantek">
          <div class="grid-projects">
            <article
              class="card-project"
              *ngFor="let project of projects; let i = index"
              [class.featured]="project.isFeatured"
              (click)="openProject(project)"
              role="button"
              [attr.aria-label]="'Ver detalle de ' + project.title"
              tabindex="0"
              (keydown.enter)="openProject(project)"
              appScrollReveal
              [revealDelay]="i * 60"
            >
              <div class="project-media">
                <img
                  class="project-image"
                  [src]="getPrimaryImage(project) || 'assets/project-placeholder.svg'"
                  [alt]="'Captura del proyecto ' + project.title"
                  (error)="onImgError($event)"
                  loading="lazy" decoding="async"
                />
                <span class="project-featured-badge" *ngIf="project.isFeatured">
                  <i class="bi bi-star-fill" aria-hidden="true"></i> Destacado
                </span>
              </div>
              <div class="project-body">
                <span class="project-category" *ngIf="getCategory(project)">{{ getCategory(project) }}</span>
                <h3>{{ project.title }}</h3>
                <p class="project-description">{{ project.description }}</p>
                <div class="project-techs" *ngIf="project.technologies?.length">
                  <span class="chip" *ngFor="let tech of project.technologies">{{ tech.name }}</span>
                </div>
                <div class="project-links" *ngIf="project.demoUrl || project.githubUrl">
                  <a *ngIf="project.demoUrl" [href]="project.demoUrl" target="_blank" rel="noopener noreferrer" class="btn-alantek-outline btn-sm" (click)="$event.stopPropagation()">
                    <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> Demo
                  </a>
                  <a *ngIf="project.githubUrl" [href]="project.githubUrl" target="_blank" rel="noopener noreferrer" class="btn-alantek-ghost btn-sm" (click)="$event.stopPropagation()">
                    <i class="bi bi-github" aria-hidden="true"></i> Código
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="page-section page-section--tight page-section--alt" *ngIf="!loading && !error && techMarquee.length">
        <div class="container-alantek">
          <app-technology-marquee [technologies]="techMarquee"></app-technology-marquee>
        </div>
      </section>

      <app-contact-cta
        eyebrow="Trabajemos juntos"
        title="¿Tienes un proyecto en mente?"
        text="Cuéntanos tu idea y te ayudaremos a hacerla realidad."
      ></app-contact-cta>

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
                <span class="chip" *ngFor="let tech of selectedProject.technologies">{{ tech.name }}</span>
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
                <a *ngIf="selectedProject.demoUrl" [href]="selectedProject.demoUrl" target="_blank" rel="noopener noreferrer" class="btn-alantek-accent" [attr.aria-label]="'Ver demo de ' + selectedProject.title">
                  <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> Demo
                </a>
                <a *ngIf="selectedProject.githubUrl" [href]="selectedProject.githubUrl" target="_blank" rel="noopener noreferrer" class="btn-alantek-outline" [attr.aria-label]="'Ver código de ' + selectedProject.title">
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
    .filters {
      position: relative;
      margin-top: var(--space-6);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }
    .search-box {
      position: relative;
      width: 100%;
      max-width: 420px;
    }
    .search-box i {
      position: absolute;
      left: var(--space-4);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .search-box input {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-primary);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-9) var(--space-3) var(--space-9);
      font-size: var(--fs-base);
      outline: none;
      transition: border-color var(--duration-base) var(--ease-out);
    }
    .search-box input:focus {
      border-color: var(--accent);
    }
    .clear-btn {
      position: absolute;
      right: var(--space-2);
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: var(--fs-md);
    }
    .clear-btn:hover {
      color: var(--accent);
    }
    .filters .grid-filters {
      justify-content: center;
      margin-bottom: 0;
    }
    .card-project {
      cursor: pointer;
    }
    .card-project.featured {
      border-color: var(--accent);
    }
    .project-media {
      position: relative;
      overflow: hidden;
    }
    .project-featured-badge {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      background: rgba(var(--accent-rgb), 0.92);
      color: #fff;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: var(--fs-xs);
      font-weight: var(--fw-semibold);
    }
    .project-description {
      font-size: var(--fs-sm);
      color: var(--text-secondary);
      line-height: var(--lh-normal);
      margin: 0 0 var(--space-3);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .project-techs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      margin-bottom: var(--space-3);
    }
    .project-links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-5);
    }
    .modal-content {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: var(--space-4);
      right: var(--space-4);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: var(--fs-md);
      cursor: pointer;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
    }
    .modal-close:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .modal-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    @media (max-width: 768px) {
      .modal-body { grid-template-columns: 1fr; }
    }
    .modal-media {
      position: relative;
      background: #000;
      border-radius: var(--radius-xl) 0 0 var(--radius-xl);
      overflow: hidden;
      min-height: 200px;
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 768px) {
      .modal-media { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
    }
    .carousel-container {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #000;
      min-height: 200px;
      max-height: 70vh;
    }
    .carousel-slide {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-video {
      width: 100%;
      height: 100%;
      min-height: 350px;
      border: none;
    }
    .modal-image {
      max-width: 100%;
      max-height: 70vh;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .modal-media.portrait .modal-image {
      width: auto;
      height: 100%;
    }
    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      font-size: var(--fs-lg);
      cursor: pointer;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
    }
    .carousel-btn:hover {
      background: rgba(0, 0, 0, 0.8);
      border-color: var(--accent);
      color: var(--accent);
    }
    .carousel-prev { left: 10px; }
    .carousel-next { right: 10px; }
    .carousel-counter {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-full);
      font-size: var(--fs-xs);
      z-index: 5;
    }
    .carousel-dots {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: var(--space-1);
      z-index: 5;
    }
    .carousel-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: var(--transition);
    }
    .carousel-dot.active {
      background: var(--accent);
      width: 20px;
      border-radius: var(--radius-sm);
    }
    .modal-video-link {
      padding: var(--space-2) var(--space-3);
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--fs-xs);
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .modal-video-link a {
      color: var(--accent);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .modal-video-link a:hover {
      text-decoration: underline;
    }
    .modal-details {
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .modal-title {
      font-family: var(--font-heading);
      font-size: var(--fs-2xl);
      font-weight: var(--fw-bold);
      color: var(--text-primary);
      margin: 0;
    }
    .modal-techs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }
    .modal-description {
      font-size: var(--fs-base);
      color: var(--text-secondary);
      line-height: var(--lh-normal);
      margin: 0;
    }
    .modal-links {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .modal-link-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--fs-sm);
    }
    .modal-link-item a {
      color: var(--accent);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .modal-link-item a:hover {
      text-decoration: underline;
    }
    .modal-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-top: auto;
    }
  `],
})
export class ProjectsPageComponent implements OnInit {
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  projects: Project[] = [];
  selectedProject: Project | null = null;
  currentSlide = 0;
  carouselSlides: { type: 'video' | 'image'; url: any }[] = [];
  imageOrientation: 'portrait' | 'landscape' | 'square' = 'landscape';
  loading = true;
  error = false;

  searchTerm = '';
  filterCategories: { name: string; slug: string }[] = [];
  activeCategory = '';
  techMarquee: any[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.selectedProject) return;
    if (event.key === 'ArrowLeft') this.prevSlide();
    if (event.key === 'ArrowRight') this.nextSlide();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(() => this.loadData(), 350);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadData();
  }

  selectCategory(slug: string): void {
    this.activeCategory = this.activeCategory === slug ? '' : slug;
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = false;
    const filters: any = {};
    if (this.searchTerm.trim()) filters.search = this.searchTerm.trim();
    if (this.activeCategory) filters.category = this.activeCategory;
    this.api.getPublicProjects(filters).subscribe({
      next: (projects) => {
        this.projects = (projects || []).map((p) => ({
          ...p,
          technologies: (p.technologies as any[] | undefined)?.map((t: any) =>
            t.technology ? { ...t.technology, id: t.technology.id } : t
          ) || [],
        }));
        this.techMarquee = this.buildTechMarquee(this.projects);
        this.buildCategoryFilters(projects || []);
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  private buildTechMarquee(projects: Project[]): any[] {
    const map = new Map<string, any>();
    projects.forEach((p) => {
      (p.technologies || []).forEach((t: any) => {
        if (t?.name && !map.has(t.name)) map.set(t.name, t);
      });
    });
    return Array.from(map.values());
  }

  private buildCategoryFilters(projects: any[]): void {
    const map = new Map<string, { name: string; slug: string }>();
    projects.forEach((p) => {
      (p.categories || []).forEach((c: any) => {
        const cat = c.category || c;
        if (cat?.slug && cat?.name && !map.has(cat.slug)) {
          map.set(cat.slug, { name: cat.name, slug: cat.slug });
        }
      });
    });
    this.filterCategories = Array.from(map.values());
  }

  private searchTimer: number | undefined;

  getCategory(project: any): string {
    const cat = project.categories?.[0];
    if (!cat) return '';
    return (cat.category || cat).name || '';
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
    if (project.slug) {
      this.router.navigate(['/proyectos', project.slug]);
      return;
    }
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

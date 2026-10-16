import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Post, PostCategory } from '../core/models';
import { environment } from '../../environments/environment';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink, FormsModule, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--center">
        <div class="container-alantek">
          <a routerLink="/" class="hero-back">&larr; Volver al Inicio</a>
          <span class="eyebrow">Publicaciones</span>
          <h1 class="page-title">Blog</h1>
          <p class="page-subtitle">Noticias, artículos y novedades de {{ siteName }}</p>

          <div class="filters">
            <div class="search-box">
              <i class="bi bi-search" aria-hidden="true"></i>
              <input
                type="search"
                placeholder="Buscar artículo..."
                aria-label="Buscar artículo"
                [(ngModel)]="search"
                (keyup.enter)="applySearch()"
              />
            </div>
            <div class="grid-filters" *ngIf="categories.length" role="group" aria-label="Filtrar por categoría">
              <button type="button" class="chip chip--clickable" [class.chip--active]="activeCategory === ''" (click)="selectCategory('')">Todos</button>
              <button type="button" class="chip chip--clickable" *ngFor="let c of categories" [class.chip--active]="activeCategory === c.slug" (click)="selectCategory(c.slug)">{{ c.name }}</button>
            </div>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No pudimos cargar la información. Intenta de nuevo.</p>
        <button class="btn-retry" (click)="retry()" aria-label="Reintentar">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !posts.length" class="page-empty">
        <i class="bi bi-journal-text" aria-hidden="true"></i>
        <p>No hay publicaciones aún{{ search ? ' que coincidan' : '' }}.</p>
      </div>

      <section class="page-section" *ngIf="!loading && !error && posts.length">
        <div class="container-alantek">
          <div class="grid-blog">
            <a class="card-blog" *ngFor="let p of posts; let i = index" [routerLink]="['/blog', p.slug]" appScrollReveal [revealDelay]="i * 60">
              <img *ngIf="coverUrl(p)" class="blog-image" [src]="coverUrl(p)" [alt]="p.title" loading="lazy" />
              <span *ngIf="!coverUrl(p)" class="blog-image blog-placeholder" aria-hidden="true"><i class="bi bi-journal-text"></i></span>
              <div class="blog-body">
                <div class="blog-meta">
                  <span class="chip" *ngFor="let c of p.categories">{{ c.name }}</span>
                </div>
                <h3>{{ p.title }}</h3>
                <p>{{ p.excerpt }}</p>
                <span class="blog-date"><i class="bi bi-calendar3" aria-hidden="true"></i> {{ p.publishedAt | date: "dd 'de' MMMM, yyyy" }}</span>
              </div>
            </a>
          </div>

          <div class="pagination" *ngIf="totalPages > 1">
            <button type="button" [disabled]="page === 1" (click)="goPage(page - 1)" aria-label="Página anterior"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
            <span>Página {{ page }} de {{ totalPages }}</span>
            <button type="button" [disabled]="page === totalPages" (click)="goPage(page + 1)" aria-label="Página siguiente"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
          </div>
        </div>
      </section>

      <app-contact-cta
        eyebrow="Trabajemos juntos"
        title="¿Tienes un proyecto en mente?"
        text="Cuéntanos tu idea y te ayudaremos a hacerla realidad."
      ></app-contact-cta>
    </div>
  `,
  styles: [`
    .hero-back {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--accent);
      font-size: var(--fs-sm);
      text-decoration: none;
      margin-bottom: var(--space-4);
      transition: opacity var(--duration-base) var(--ease-out);
    }
    .hero-back:hover { opacity: 0.8; }
    .filters {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
    .search-box { position: relative; width: 100%; max-width: 420px; }
    .search-box i {
      position: absolute;
      left: var(--space-4);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-box input {
      width: 100%;
      padding: var(--space-3) var(--space-6) var(--space-3) var(--space-9);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: var(--fs-base);
      font-family: inherit;
      outline: none;
      transition: border-color var(--duration-base) var(--ease-out);
    }
    .search-box input:focus { border-color: var(--accent); }
    .filters .grid-filters { justify-content: center; margin-bottom: 0; }
    .filters .chip { font-family: inherit; cursor: pointer; }
    .page-empty i {
      display: block;
      font-size: 2.5rem;
      color: var(--accent);
      opacity: 0.4;
      margin-bottom: var(--space-3);
    }
    .card-blog { display: flex; flex-direction: column; }
    .card-blog .blog-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }
    .card-blog .blog-body { flex: 1; display: flex; flex-direction: column; }
    .card-blog .blog-body .blog-date { margin-top: auto; padding-top: var(--space-2); }
    .blog-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--text-muted);
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-top: var(--space-8);
    }
    .pagination button {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-card);
      color: var(--text-primary);
      cursor: pointer;
      transition: var(--transition);
    }
    .pagination button:hover:not(:disabled) {
      border-color: var(--accent);
      color: var(--accent);
    }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { font-size: var(--fs-sm); color: var(--text-secondary); }
  `],
})
export class BlogPageComponent implements OnInit {
  private apiService = inject(ApiService);
  private seoService = inject(SeoService);

  posts: Post[] = [];
  categories: PostCategory[] = [];
  siteName = 'ALANTEK';
  search = '';
  activeCategory = '';
  page = 1;
  limit = 9;
  total = 0;
  loading = true;
  error = false;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  ngOnInit(): void {
    this.applySeo();
    this.loadPosts();
  }

  private applySeo(): void {
    this.seoService.setSeo({
      title: 'Blog | ALANTEK',
      description: 'Artículos, noticias y novedades de ALANTEK.',
      canonical: this.seoService.canonicalUrl('/blog'),
      robots: 'index,follow',
    });
  }

  loadPosts(): void {
    this.loading = true;
    this.error = false;
    this.apiService.getPublicBlog({
      page: this.page,
      limit: this.limit,
      search: this.search || undefined,
      category: this.activeCategory || undefined,
    }).subscribe({
      next: (res) => {
        this.posts = res.posts;
        this.categories = res.categories;
        this.total = res.total;
        this.siteName = 'ALANTEK';
      },
      error: () => { this.loading = false; this.error = true; },
      complete: () => (this.loading = false),
    });
  }

  applySearch(): void {
    this.page = 1;
    this.loadPosts();
  }

  selectCategory(slug: string): void {
    this.activeCategory = slug;
    this.page = 1;
    this.loadPosts();
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadPosts();
  }

  coverUrl(p: Post): string | null {
    if (!p.coverImage) return null;
    if (p.coverImage.startsWith('http://') || p.coverImage.startsWith('https://') || p.coverImage.startsWith('data:')) return p.coverImage;
    return `${environment.uploadUrl}/${p.coverImage}`;
  }

  retry(): void {
    this.loadPosts();
  }
}

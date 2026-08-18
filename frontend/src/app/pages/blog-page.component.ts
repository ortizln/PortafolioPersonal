import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Post, PostCategory } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink, FormsModule],
  styles: [
    `
      :host { display: block; min-height: 60vh; }
      .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
      .page-header { padding: 4rem 0 2rem; text-align: center; }
      .page-header h1 { font-size: 2.4rem; margin: 0.5rem 0; color: var(--white); }
      .page-header p { color: var(--text-secondary); margin: 0 auto 1.5rem; max-width: 560px; }
      .back-link { color: var(--accent); text-decoration: none; font-size: 0.9rem; }
      .filters { display: flex; flex-direction: column; gap: 0.9rem; align-items: center; }
      .search-box { position: relative; max-width: 420px; width: 100%; }
      .search-box input {
        width: 100%; padding: 0.7rem 2.6rem 0.7rem 2.4rem; border-radius: 30px;
        border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary);
      }
      .search-box i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
      .category-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
      .category-chip {
        padding: 0.4rem 1rem; border-radius: 20px; border: 1px solid var(--border);
        background: var(--bg-card); color: var(--text-secondary); font-size: 0.8rem; cursor: pointer;
      }
      .category-chip.active, .category-chip:hover { color: var(--accent); border-color: var(--accent); }
      .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; padding: 2rem 0; }
      .skeleton-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
      .sk-img { height: 190px; background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
      .sk-body { padding: 1.2rem; display: flex; flex-direction: column; gap: 10px; }
      .sk-line { height: 14px; border-radius: 6px; background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
      .sk-line.w-40 { width: 40%; }
      .sk-line.w-60 { width: 60%; }
      .sk-line.w-80 { width: 80%; }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      .page-empty { text-align: center; padding: 4rem 1rem; color: var(--text-secondary); }
      .page-empty i { font-size: 2.5rem; opacity: 0.4; display: block; margin-bottom: 0.75rem; }
      .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; padding: 1rem 0 3rem; }
      .blog-card {
        background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden;
        display: flex; flex-direction: column; transition: all 0.25s ease;
      }
      .blog-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 12px 32px rgba(0,0,0,0.25); }
      .blog-cover { height: 190px; background: var(--bg-secondary); overflow: hidden; display: flex; align-items: center; justify-content: center; }
      .blog-cover img { width: 100%; height: 100%; object-fit: cover; }
      .blog-cover .ph { font-size: 2rem; color: var(--text-secondary); }
      .blog-body { padding: 1.1rem 1.2rem 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
      .blog-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .chip { font-size: 0.68rem; padding: 2px 10px; border-radius: 20px; background: rgba(var(--accent-rgb), 0.12); color: var(--accent); }
      .blog-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); text-decoration: none; line-height: 1.35; }
      .blog-title:hover { color: var(--accent); }
      .blog-excerpt { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.55; flex: 1; }
      .blog-date { font-size: 0.75rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; }
      .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding-bottom: 3rem; }
      .pagination button { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; }
      .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
      .pagination span { font-size: 0.85rem; color: var(--text-secondary); }
    `,
  ],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="container">
          <a routerLink="/" class="back-link">&larr; Volver al Inicio</a>
          <h1>Blog</h1>
          <p>Noticias, artículos y novedades de {{ siteName }}</p>
          <div class="filters">
            <div class="search-box">
              <i class="bi bi-search" aria-hidden="true"></i>
              <input type="search" placeholder="Buscar artículo..." [(ngModel)]="search" (keyup.enter)="applySearch()" />
            </div>
            <div class="category-filters" *ngIf="categories.length">
              <button type="button" class="category-chip" [class.active]="activeCategory === ''" (click)="selectCategory('')">Todos</button>
              <button type="button" class="category-chip" *ngFor="let c of categories" [class.active]="activeCategory === c.slug" (click)="selectCategory(c.slug)">{{ c.name }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="container" *ngIf="loading">
        <div class="skeleton-grid">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]">
            <div class="sk-img"></div>
            <div class="sk-body">
              <div class="sk-line w-40"></div>
              <div class="sk-line w-80"></div>
              <div class="sk-line w-60"></div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && !posts.length" class="page-empty">
        <i class="bi bi-journal-text"></i>
        <p>No hay publicaciones aún{{ search ? ' que coincidan' : '' }}.</p>
      </div>

      <div class="container" *ngIf="!loading && posts.length">
        <div class="blog-grid">
          <article class="blog-card" *ngFor="let p of posts">
            <a class="blog-cover" [routerLink]="['/blog', p.slug]">
              <img *ngIf="coverUrl(p)" [src]="coverUrl(p)" [alt]="p.title" loading="lazy" />
              <i *ngIf="!coverUrl(p)" class="bi bi-journal-text ph"></i>
            </a>
            <div class="blog-body">
              <div class="blog-meta">
                <span class="chip" *ngFor="let c of p.categories">{{ c.name }}</span>
              </div>
              <a class="blog-title" [routerLink]="['/blog', p.slug]">{{ p.title }}</a>
              <p class="blog-excerpt">{{ p.excerpt }}</p>
              <span class="blog-date"><i class="bi bi-calendar3"></i> {{ p.publishedAt | date: "dd 'de' MMMM, yyyy" }}</span>
            </div>
          </article>
        </div>

        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="page === 1" (click)="goPage(page - 1)"><i class="bi bi-chevron-left"></i></button>
          <span>Página {{ page }} de {{ totalPages }}</span>
          <button [disabled]="page === totalPages" (click)="goPage(page + 1)"><i class="bi bi-chevron-right"></i></button>
        </div>
      </div>
    </div>
  `,
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
      error: () => (this.loading = false),
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
}

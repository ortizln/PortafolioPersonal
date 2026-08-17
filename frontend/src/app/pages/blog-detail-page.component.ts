import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Post } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [DatePipe, NgIf, NgFor, RouterLink],
  styles: [
    `
      :host { display: block; min-height: 60vh; }
      .back-link { color: var(--accent); text-decoration: none; font-size: 0.9rem; display: inline-block; margin: 2rem 0 0; }
      .page-loading { display: flex; justify-content: center; padding: 4rem; }
      .spinner { width: 38px; height: 38px; border: 3px solid rgba(255,255,255,0.12); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .page-error { text-align: center; padding: 4rem; color: var(--text-secondary); }
      .page-error i { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; opacity: 0.4; }
      .page-error a { color: var(--accent); }
      .post-wrap { max-width: 820px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
      .post-header { text-align: center; margin-bottom: 1.5rem; }
      .post-meta { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
      .chip { font-size: 0.72rem; padding: 3px 12px; border-radius: 20px; background: rgba(var(--accent-rgb), 0.12); color: var(--accent); }
      .chip-neutral { background: rgba(255,255,255,0.06); color: var(--text-secondary); }
      .post-title { font-size: 2.2rem; line-height: 1.25; color: var(--text-primary); margin: 0.25rem 0 0.75rem; }
      .post-sub { color: var(--text-secondary); font-size: 0.85rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
      .post-sub span { display: inline-flex; align-items: center; gap: 0.35rem; }
      .post-cover { width: 100%; max-height: 460px; object-fit: cover; border-radius: 16px; margin-bottom: 1.5rem; background: var(--bg-secondary); }
      .post-content { color: var(--text-primary); font-size: 1rem; line-height: 1.8; }
      .post-content ::ng-deep img { max-width: 100%; border-radius: 12px; }
      .post-content ::ng-deep pre { background: var(--bg-secondary); padding: 1rem; border-radius: 10px; overflow-x: auto; border: 1px solid var(--border); }
      .post-content ::ng-deep blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; color: var(--text-secondary); margin: 1.5rem 0; }
      .post-content ::ng-deep h2, .post-content ::ng-deep h3 { color: var(--text-primary); }
      .post-content ::ng-deep a { color: var(--accent); }
      .post-tags { margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .related { margin-top: 2.5rem; border-top: 1px solid var(--border); padding-top: 1.5rem; }
      .related h3 { color: var(--text-primary); margin: 0 0 1rem; }
      .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
      .rel-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; text-decoration: none; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 0.4rem; }
      .rel-card:hover { border-color: var(--accent); transform: translateY(-2px); }
      .rel-title { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
      .rel-date { font-size: 0.72rem; color: var(--text-secondary); }
    `,
  ],
  template: `
    <div class="page-wrapper">
      <div class="container">
        <a routerLink="/blog" class="back-link">&larr; Volver al Blog</a>

        <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

        <div *ngIf="!loading && error" class="page-error">
          <i class="bi bi-journal-x"></i>
          <p>{{ error }}</p>
          <a routerLink="/blog">Ir al Blog</a>
        </div>

        <article class="post-wrap" *ngIf="!loading && post">
          <header class="post-header">
            <div class="post-meta">
              <span class="chip" *ngFor="let c of post.categories">{{ c.name }}</span>
            </div>
            <h1 class="post-title">{{ post.title }}</h1>
            <div class="post-sub">
              <span *ngIf="post.author"><i class="bi bi-person"></i> {{ post.author.name }}</span>
              <span *ngIf="post.publishedAt"><i class="bi bi-calendar3"></i> {{ post.publishedAt | date: "dd 'de' MMMM, yyyy" }}</span>
              <span><i class="bi bi-eye"></i> {{ post.views }}</span>
            </div>
          </header>

          <img *ngIf="coverUrl" class="post-cover" [src]="coverUrl" [alt]="post.title" />

          <div class="post-content" [innerHTML]="post.content || '<p>Sin contenido.</p>'"></div>

          <div class="post-tags" *ngIf="post.tags?.length">
            <span class="chip chip-neutral" *ngFor="let t of post.tags">#{{ t.name }}</span>
          </div>

          <section class="related" *ngIf="related.length">
            <h3>Artículos relacionados</h3>
            <div class="related-grid">
              <a class="rel-card" *ngFor="let r of related" [routerLink]="['/blog', r.slug]">
                <span class="rel-title">{{ r.title }}</span>
                <span class="rel-date">{{ r.publishedAt | date: 'dd/MM/yyyy' }}</span>
              </a>
            </div>
          </section>
        </article>
      </div>
    </div>
  `,
})
export class BlogDetailPageComponent implements OnInit {
  private apiService = inject(ApiService);
  private seoService = inject(SeoService);
  private route = inject(ActivatedRoute);

  post: Post | null = null;
  related: Post[] = [];
  coverUrl: string | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.loadPost(slug);
    });
  }

  loadPost(slug: string): void {
    this.loading = true;
    this.error = '';
    this.apiService.getPublicPostBySlug(slug).subscribe({
      next: (res) => {
        this.post = res.post;
        this.related = res.related || [];
        this.coverUrl = this.resolveCover(res.post);
        this.applySeo(res.post);
      },
      error: () => {
        this.loading = false;
        this.error = 'El artículo no existe o fue movido.';
      },
      complete: () => (this.loading = false),
    });
  }

  private resolveCover(p: Post): string | null {
    if (!p.coverImage) return null;
    if (p.coverImage.startsWith('http://') || p.coverImage.startsWith('https://') || p.coverImage.startsWith('data:')) return p.coverImage;
    return `${environment.uploadUrl}/${p.coverImage}`;
  }

  private applySeo(p: Post): void {
    const canonical = this.seoService.canonicalUrl(`/blog/${p.slug}`);
    const jsonLd: object[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: p.title,
        description: p.excerpt || p.seoDescription || '',
        image: this.coverUrl || undefined,
        datePublished: p.publishedAt || undefined,
        dateModified: p.updatedAt,
        author: p.author ? { '@type': 'Person', name: p.author.name } : { '@type': 'Organization', name: 'ALANTEK' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: this.seoService.canonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: this.seoService.canonicalUrl('/blog') },
          { '@type': 'ListItem', position: 3, name: p.title, item: canonical },
        ],
      },
    ];
    this.seoService.setSeo({
      title: p.seoTitle || `${p.title} | Blog | ALANTEK`,
      description: p.seoDescription || p.excerpt || '',
      image: this.coverUrl || undefined,
      canonical,
      robots: 'index,follow',
      jsonLd,
    });
  }
}

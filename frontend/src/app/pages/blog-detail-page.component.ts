import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { Post } from '../core/models';
import { environment } from '../../environments/environment';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [DatePipe, NgIf, NgFor, RouterLink, ContactCtaComponent, ScrollRevealDirective],
  template: `
    <div class="page-wrapper">
      <header class="page-hero" *ngIf="!loading && !error && post">
        <div class="container-alantek">
          <a routerLink="/blog" class="hero-back">&larr; Volver al Blog</a>
          <span class="eyebrow">Blog</span>
          <div class="post-meta" *ngIf="post.categories?.length">
            <span class="chip" *ngFor="let c of post.categories">{{ c.name }}</span>
          </div>
          <h1 class="page-title">{{ post.title }}</h1>
          <div class="detail-meta">
            <span *ngIf="post.author"><i class="bi bi-person" aria-hidden="true"></i> {{ post.author.name }}</span>
            <span *ngIf="post.publishedAt"><i class="bi bi-calendar3" aria-hidden="true"></i> {{ post.publishedAt | date: "dd 'de' MMMM, yyyy" }}</span>
            <span><i class="bi bi-eye" aria-hidden="true"></i> {{ post.views }}</span>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-journal-x" aria-hidden="true"></i>
        <p>{{ error }}</p>
        <a routerLink="/blog" class="btn-retry">Ir al Blog</a>
      </div>

      <article class="page-section" *ngIf="!loading && !error && post">
        <div class="container-alantek container-narrow content">
          <img class="detail-banner" *ngIf="coverUrl" [src]="coverUrl" [alt]="post.title" loading="lazy" decoding="async" />

          <div class="prose" [innerHTML]="post.content || '<p>Sin contenido.</p>'"></div>

          <div class="post-tags" *ngIf="post.tags?.length">
            <span class="chip" *ngFor="let t of post.tags">#{{ t.name }}</span>
          </div>
        </div>
      </article>

      <section class="page-section page-section--alt" *ngIf="!loading && !error && post && related.length">
        <div class="container-alantek">
          <h2 class="section-heading" appScrollReveal>Artículos relacionados</h2>
          <div class="grid-blog">
            <a class="card-alantek rel-card" *ngFor="let r of related" [routerLink]="['/blog', r.slug]" appScrollReveal>
              <span class="rel-title">{{ r.title }}</span>
              <span class="rel-date"><i class="bi bi-calendar3" aria-hidden="true"></i> {{ r.publishedAt | date: 'dd/MM/yyyy' }}</span>
            </a>
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
    .post-meta {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }
    .detail-meta { position: relative; }
    .page-error .btn-retry {
      display: inline-block;
      text-decoration: none;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }
    .detail-banner { display: block; }
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
    .section-heading {
      font-family: var(--font-heading);
      font-size: var(--fs-2xl);
      font-weight: var(--fw-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-5);
    }
    .rel-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .rel-title {
      display: block;
      font-family: var(--font-heading);
      font-size: var(--fs-md);
      font-weight: var(--fw-semibold);
      color: var(--text-primary);
      line-height: var(--lh-snug);
    }
    .rel-date {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--fs-xs);
      color: var(--text-muted);
    }
  `],
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

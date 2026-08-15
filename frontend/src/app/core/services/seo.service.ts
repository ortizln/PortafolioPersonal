import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface SeoConfig {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  jsonLd?: object[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private doc = inject(DOCUMENT);

  private setMeta(name: string, content: string): void {
    let el = this.doc.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
      el = this.doc.createElement('meta');
      el.setAttribute('name', name);
      this.doc.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  private setProperty(property: string, content: string): void {
    let el = this.doc.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
    if (!el) {
      el = this.doc.createElement('meta');
      el.setAttribute('property', property);
      this.doc.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  private setCanonical(url: string): void {
    let el = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
      el = this.doc.createElement('link');
      el.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(el);
    }
    el.setAttribute('href', url);
  }

  private setRobots(value: string): void {
    this.setMeta('robots', value);
  }

  private clearJsonLd(): void {
    const nodes = this.doc.head.querySelectorAll('script[data-seo-jsonld]');
    nodes.forEach((n) => n.remove());
  }

  private injectJsonLd(data: object[]): void {
    this.clearJsonLd();
    data.forEach((item) => {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', '');
      script.text = JSON.stringify(item);
      this.doc.head.appendChild(script);
    });
  }

  setSeo(cfg: SeoConfig): void {
    if (cfg.title) this.doc.title = cfg.title;
    if (cfg.description) this.setMeta('description', cfg.description);
    if (cfg.ogTitle || cfg.title) this.setProperty('og:title', cfg.ogTitle || cfg.title || '');
    if (cfg.ogDescription || cfg.description) this.setProperty('og:description', cfg.ogDescription || cfg.description || '');
    if (cfg.image) {
      this.setProperty('og:image', cfg.image);
      this.setProperty('twitter:image', cfg.image);
    }
    this.setProperty('twitter:card', 'summary_large_image');
    if (cfg.twitterTitle || cfg.title) this.setMeta('twitter:title', cfg.twitterTitle || cfg.title || '');
    if (cfg.twitterDescription || cfg.description) this.setMeta('twitter:description', cfg.twitterDescription || cfg.description || '');
    if (cfg.canonical) this.setCanonical(cfg.canonical);
    if (cfg.robots) this.setRobots(cfg.robots);
    if (cfg.jsonLd?.length) this.injectJsonLd(cfg.jsonLd);
  }

  /** Ruta actual del SPA a URL canónica absoluta usando uploadUrl como base del sitio. */
  canonicalUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/api$/, '');
    return `${base}${path}`;
  }
}

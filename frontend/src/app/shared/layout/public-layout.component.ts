import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SeoService } from '../../core/services/seo.service';
import { Company, Service } from '../../core/models';
import { applyCompanyBrand } from '../../core/utils/brand.util';
import { environment } from '../../../environments/environment';
import { NeonBackgroundComponent } from '../neon-bg.component';
import { routeAnimations } from '../../core/animations/route.animations';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NgIf, NgFor, RouterLink, RouterLinkActive, NeonBackgroundComponent],
  animations: [routeAnimations],
  template: `
    <app-neon-bg></app-neon-bg>
    <a class="skip-link" href="#main-content">Saltar al contenido</a>

    <header>
      <nav class="navbar" [class.scrolled]="isScrolled" aria-label="Navegación principal">
        <div class="container">
          <a class="navbar-brand" routerLink="/" aria-label="Ir al inicio">
            <img *ngIf="companyLogo" [src]="companyLogo" class="logo-img" [alt]="companyName + ' logo'" />
            <span *ngIf="!companyLogo" class="logo-text" aria-hidden="true">{{ companyName }}</span>
          </a>

          <button class="hamburger btn-press" (click)="isMobileMenuOpen = !isMobileMenuOpen" [class.active]="isMobileMenuOpen"
            [attr.aria-expanded]="isMobileMenuOpen" aria-controls="nav-menu" aria-label="Menú de navegación">
            <span></span><span></span><span></span>
          </button>

          <div class="nav-collapse" [class.open]="isMobileMenuOpen" id="nav-menu">
            <ul class="nav-links">
              <li *ngFor="let link of navLinks">
                <a [routerLink]="link.href" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: link.href === '/'}"
                  (click)="isMobileMenuOpen = false" class="nav-link-animated">{{ link.label }}</a>
              </li>
            </ul>
            <div class="nav-actions">
              <a class="navbar-cta" routerLink="/contacto" (click)="isMobileMenuOpen = false">Cotizar</a>
              <button class="theme-toggle btn-press" (click)="toggleTheme()"
                [attr.aria-label]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
                <i class="bi" [class.bi-sun]="isDark" [class.bi-moon]="!isDark" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <main id="main-content" role="main">
      <router-outlet #outlet="outlet" [@routeAnimations]="getRouteAnimationData(outlet)"></router-outlet>
    </main>

    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="footer-logo" routerLink="/" aria-label="Ir al inicio">
              <img *ngIf="companyLogo" [src]="companyLogo" class="footer-logo-img" [alt]="companyName + ' logo'" loading="lazy" decoding="async" />
              <span *ngIf="!companyLogo">{{ companyName }}</span>
            </a>
            <p class="footer-desc">{{ company?.shortDescription || company?.description || 'Soluciones digitales de software y tecnología para empresas.' }}</p>
            <div class="footer-social">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="bi bi-github" aria-hidden="true"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="bi bi-linkedin" aria-hidden="true"></i></a>
              <a [href]="'mailto:' + (company?.email || 'contacto@alantek.com')" aria-label="Enviar correo"><i class="bi bi-envelope-fill" aria-hidden="true"></i></a>
            </div>
          </div>
          <div class="footer-col">
            <h3 id="foot-nav">Navegación</h3>
            <ul aria-labelledby="foot-nav">
              <li><a routerLink="/">Inicio</a></li>
              <li><a routerLink="/nosotros">Nosotros</a></li>
              <li><a routerLink="/servicios">Servicios</a></li>
              <li><a routerLink="/equipo">Equipo</a></li>
              <li><a routerLink="/portafolio">Portafolio</a></li>
              <li><a routerLink="/blog">Blog</a></li>
              <li><a routerLink="/contacto">Contacto</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h3 id="foot-services">Servicios</h3>
            <ul aria-labelledby="foot-services">
              <li *ngFor="let s of footerServices">
                <i class="bi bi-arrow-right-short" aria-hidden="true"></i>
                <a [routerLink]="'/servicios'">{{ s.name }}</a>
              </li>
              <li *ngIf="footerServices.length === 0"><i class="bi bi-arrow-right-short" aria-hidden="true"></i> Desarrollo Web</li>
              <li *ngIf="footerServices.length === 0"><i class="bi bi-arrow-right-short" aria-hidden="true"></i> Apps Móviles</li>
            </ul>
          </div>
          <div class="footer-col">
            <h3 id="foot-contact">Contacto</h3>
            <ul aria-labelledby="foot-contact">
              <li *ngIf="company?.address || company?.city"><i class="bi bi-geo-alt" aria-hidden="true"></i> {{ company?.address }}{{ company?.address && company?.city ? ', ' : '' }}{{ company?.city }}</li>
              <li><i class="bi bi-envelope" aria-hidden="true"></i> {{ company?.email || 'contacto@alantek.com' }}</li>
              <li *ngIf="company?.phone"><i class="bi bi-telephone" aria-hidden="true"></i> {{ company?.phone }}</li>
              <li><i class="bi bi-file-text" aria-hidden="true"></i> Información de la empresa</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} {{ companyName }}. Todos los derechos reservados.</p>
          <span class="footer-version">ALANTEK</span>
        </div>
      </div>
    </footer>

    <button class="back-to-top" [class.visible]="showBackToTop" (click)="scrollToTop()" aria-label="Volver arriba">
      <i class="bi bi-arrow-up" aria-hidden="true"></i>
    </button>
  `,
  styleUrls: ['./public-layout.component.scss'],
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private seoService = inject(SeoService);
  private router = inject(Router);
  private routerSub!: Subscription;

  getRouteAnimationData(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  isScrolled = false;
  showBackToTop = false;
  isMobileMenuOpen = false;
  isDark = false;
  currentYear = new Date().getFullYear();

  company: Company | null = null;
  companyName = 'ALANTEK';
  companyLogo: string | null = null;
  footerServices: Service[] = [];

  navLinks = [
    { label: 'Inicio', href: '/' },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Servicios', href: '/servicios' },
    { label: 'Equipo', href: '/equipo' },
    { label: 'Clientes', href: '/clientes' },
    { label: 'Portafolio', href: '/portafolio' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contacto', href: '/contacto' },
  ];

  ngOnInit(): void {
    this.loadCompany();
    this.loadServices();
    this.routerSub = this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      this.isMobileMenuOpen = false;
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private loadCompany(): void {
    this.api.getPublicCompany().subscribe({
      next: (c) => {
        this.company = c;
        if (c?.name) this.companyName = c.name;
        this.companyLogo = this.resolveAsset(c?.logoUrl);
        applyCompanyBrand(c);
        this.applyDefaultSeo(c);
      },
      error: () => {
        applyCompanyBrand(null);
        this.applyDefaultSeo(null);
      },
    });
  }

  private applyDefaultSeo(c: Company | null): void {
    const name = c?.name || 'ALANTEK';
    const slogan = c?.slogan || '';
    const desc = c?.shortDescription || c?.description || '';
    const logo = this.resolveAsset(c?.logoUrl);
    const jsonLd: object[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url: this.seoService.canonicalUrl('/'),
        logo: logo ? { '@type': 'ImageObject', url: logo } : undefined,
        description: desc,
        email: c?.email || undefined,
        telephone: c?.phone || undefined,
        address: c?.address
          ? { '@type': 'PostalAddress', streetAddress: c.address, addressLocality: c.city || undefined, addressCountry: c.country || undefined }
          : undefined,
      },
    ];
    this.seoService.setSeo({
      title: slogan ? `${name} — ${slogan}` : name,
      description: desc,
      image: logo || undefined,
      canonical: this.seoService.canonicalUrl('/'),
      robots: 'index,follow',
      jsonLd,
    });
  }

  private loadServices(): void {
    this.api.getPublicServices().subscribe({
      next: (list) => (this.footerServices = (list || []).slice(0, 6)),
      error: () => {},
    });
  }

  private resolveAsset(url?: string): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
    this.showBackToTop = window.scrollY > 400;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }
}

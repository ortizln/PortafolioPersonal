import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NgIf, NgFor, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>

    <header>
      <nav class="navbar" [class.scrolled]="isScrolled" aria-label="Navegación principal">
        <div class="container">
          <a class="navbar-brand" routerLink="/" aria-label="Ir al inicio">
            <span class="logo-text" aria-hidden="true">&lt;Dev /&gt;</span>
          </a>

          <button class="hamburger" (click)="isMobileMenuOpen = !isMobileMenuOpen" [class.active]="isMobileMenuOpen"
            [attr.aria-expanded]="isMobileMenuOpen" aria-controls="nav-menu" aria-label="Menú de navegación">
            <span></span><span></span><span></span>
          </button>

          <div class="nav-collapse" [class.open]="isMobileMenuOpen" id="nav-menu" role="menubar">
            <ul class="nav-links">
              <li *ngFor="let link of navLinks" role="none">
                <a [routerLink]="link.href" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: link.href === '/'}"
                  (click)="isMobileMenuOpen = false" role="menuitem">{{ link.label }}</a>
              </li>
            </ul>
            <div class="nav-actions">
              <button class="theme-toggle" (click)="toggleTheme()"
                [attr.aria-label]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
                <i class="bi" [class.bi-sun]="isDark" [class.bi-moon]="!isDark" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <main id="main-content" role="main">
      <router-outlet></router-outlet>
    </main>

    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="footer-logo" routerLink="/" aria-label="Ir al inicio">&lt;Dev /&gt;</a>
            <p class="footer-desc">Full Stack Developer. Creando soluciones digitales modernas con tecnologías de vanguardia.</p>
            <div class="footer-social">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="bi bi-github" aria-hidden="true"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="bi bi-linkedin" aria-hidden="true"></i></a>
              <a href="mailto:hello@devblacksheep.com" aria-label="Enviar correo"><i class="bi bi-envelope-fill" aria-hidden="true"></i></a>
            </div>
          </div>
          <div class="footer-col">
            <h4 id="foot-nav">Navegación</h4>
            <ul aria-labelledby="foot-nav">
              <li><a routerLink="/">Inicio</a></li>
              <li><a routerLink="/about">Sobre Mí</a></li>
              <li><a routerLink="/projects">Proyectos</a></li>
              <li><a routerLink="/contact">Contacto</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4 id="foot-contact">Contacto</h4>
            <ul aria-labelledby="foot-contact">
              <li><i class="bi bi-geo-alt" aria-hidden="true"></i> Ciudad de México, MX</li>
              <li><i class="bi bi-envelope" aria-hidden="true"></i> hello&#64;devblacksheep.com</li>
              <li><i class="bi bi-file-text" aria-hidden="true"></i> <a href="#" aria-label="Descargar currículum">Descargar CV</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4 id="foot-tech">Tecnologías</h4>
            <div class="footer-techs" aria-labelledby="foot-tech">
              <span>Angular</span><span>Node.js</span><span>PostgreSQL</span>
              <span>TypeScript</span><span>Docker</span><span>Prisma</span>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} DevBlackSheep. Todos los derechos reservados.</p>
          <span class="footer-version" aria-label="Versión v2.0.0">v2.0.0</span>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./public-layout.component.scss'],
})
export class PublicLayoutComponent {
  isScrolled = false;
  isMobileMenuOpen = false;
  isDark = true;
  currentYear = new Date().getFullYear();

  navLinks = [
    { label: 'Inicio', href: '/' },
    { label: 'Sobre Mí', href: '/about' },
    { label: 'Experiencia', href: '/experience' },
    { label: 'Proyectos', href: '/projects' },
    { label: 'Skills', href: '/skills' },
    { label: 'Contacto', href: '/contact' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }

  scrollTo(href: string): void {
    this.isMobileMenuOpen = false;
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NgIf, NgFor, RouterLink],
  template: `
    <nav class="navbar" [class.scrolled]="isScrolled">
      <div class="container">
        <a class="navbar-brand" routerLink="/" (click)="scrollTo('#home')">
          <span class="logo-text">&lt;Dev /&gt;</span>
        </a>

        <button class="hamburger" (click)="isMobileMenuOpen = !isMobileMenuOpen" [class.active]="isMobileMenuOpen">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-collapse" [class.open]="isMobileMenuOpen">
          <ul class="nav-links">
            <li *ngFor="let link of navLinks">
              <a [href]="link.href" (click)="scrollTo(link.href)">{{ link.label }}</a>
            </li>
          </ul>
          <div class="nav-actions">
            <button class="theme-toggle" (click)="toggleTheme()" aria-label="Toggle theme">
              <i class="bi" [class.bi-sun]="isDark" [class.bi-moon]="!isDark"></i>
            </button>
            <a class="btn-admin" routerLink="/admin">
              <i class="bi bi-shield-lock"></i> Admin
            </a>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <router-outlet></router-outlet>
    </main>

    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <p>&copy; {{ currentYear }} &lt;Dev /&gt;. All rights reserved.</p>
          <div class="social-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <i class="bi bi-github"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i class="bi bi-linkedin"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <i class="bi bi-twitter-x"></i>
            </a>
            <a href="mailto:hello@dev.com" aria-label="Email">
              <i class="bi bi-envelope-fill"></i>
            </a>
          </div>
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
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Experience', href: '#experience' },
    { label: 'Projects', href: '#projects' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
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

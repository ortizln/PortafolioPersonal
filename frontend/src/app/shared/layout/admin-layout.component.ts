import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, NgFor, NgIf, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell" [class.sidebar-collapsed]="isSidebarCollapsed">
      <aside class="sidebar" [class.open]="isMobileSidebarOpen">
        <div class="sidebar-header">
          <a class="sidebar-brand" routerLink="/admin">
            <span class="brand-icon">&lt;/&gt;</span>
            <span class="brand-text" *ngIf="!isSidebarCollapsed">DevPanel</span>
          </a>
          <button class="sidebar-close" (click)="toggleMobileSidebar()" *ngIf="isMobileSidebarOpen">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <ul>
            <li *ngFor="let item of menuItems">
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.route === '/admin' }"
                (click)="onNavClick()"
              >
                <i class="bi {{ item.icon }}"></i>
                <span *ngIf="!isSidebarCollapsed">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>

        <div class="sidebar-footer" *ngIf="!isSidebarCollapsed">
          <div class="user-info">
            <div class="user-avatar">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="user-details">
              <span class="user-name">Admin User</span>
              <span class="user-role">Administrator</span>
            </div>
          </div>
          <button class="btn-logout" routerLink="/auth/login">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

      <div class="sidebar-overlay" [class.open]="isMobileSidebarOpen" (click)="toggleMobileSidebar()"></div>

      <div class="main-area">
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn-toggle-sidebar" (click)="toggleSidebar()" aria-label="Toggle sidebar">
              <i class="bi bi-list"></i>
            </button>
            <button class="btn-mobile-sidebar" (click)="toggleMobileSidebar()" aria-label="Open sidebar">
              <i class="bi bi-list"></i>
            </button>
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="topbar-right">
            <button class="theme-toggle" (click)="toggleTheme()" aria-label="Toggle theme">
              <i class="bi" [class.bi-sun]="isDark" [class.bi-moon]="!isDark"></i>
            </button>
            <div class="topbar-user">
              <i class="bi bi-person-circle user-avatar-icon"></i>
              <span class="user-name-top">Admin</span>
            </div>
          </div>
        </header>

        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  isDark = true;
  pageTitle = 'Dashboard';

  menuItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin', icon: 'bi-speedometer2' },
    { label: 'Profile', route: '/admin/profile', icon: 'bi-person' },
    { label: 'Experiences', route: '/admin/experiences', icon: 'bi-briefcase' },
    { label: 'Education', route: '/admin/education', icon: 'bi-book' },
    { label: 'Certificates', route: '/admin/certificates', icon: 'bi-patch-check' },
    { label: 'Projects', route: '/admin/projects', icon: 'bi-folder2' },
    { label: 'Skills', route: '/admin/skills', icon: 'bi-gear' },
    { label: 'Languages', route: '/admin/languages', icon: 'bi-translate' },
    { label: 'Repositories', route: '/admin/repositories', icon: 'bi-github' },
    { label: 'Social Links', route: '/admin/social-links', icon: 'bi-link-45deg' },
    { label: 'Categories', route: '/admin/categories', icon: 'bi-tags' },
    { label: 'Contact Messages', route: '/admin/contact-messages', icon: 'bi-envelope' },
    { label: 'Settings', route: '/admin/settings', icon: 'bi-sliders' },
  ];

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  onNavClick(): void {
    if (window.innerWidth <= 768) {
      this.isMobileSidebarOpen = false;
    }
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.isMobileSidebarOpen = false;
    }
  }
}

import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Notification } from '../../core/models';
import { routeAnimations } from '../../core/animations/route.animations';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  permission?: string;
  permissions?: string[];
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, NgFor, NgIf, DatePipe, RouterLink, RouterLinkActive],
  animations: [routeAnimations],
  template: `
    <div class="admin-shell" [class.sidebar-collapsed]="isSidebarCollapsed">
      <aside class="sidebar" [class.open]="isMobileSidebarOpen">
        <div class="sidebar-header">
          <a class="sidebar-brand" routerLink="/admin">
            <span class="brand-icon">&lt;/&gt;</span>
            <span class="brand-text" *ngIf="!isSidebarCollapsed">Alan Tek</span>
          </a>
          <button class="sidebar-close" (click)="toggleMobileSidebar()" *ngIf="isMobileSidebarOpen">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <ul>
            <li>
              <a
                routerLink="/admin"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="onNavClick()"
              >
                <i class="bi bi-speedometer2"></i>
                <span *ngIf="!isSidebarCollapsed">Dashboard</span>
              </a>
            </li>
            <ng-container *ngFor="let group of filteredGroups">
              <li class="nav-group-title" *ngIf="!isSidebarCollapsed">{{ group.title }}</li>
              <li *ngFor="let item of group.items">
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: false }"
                  (click)="onNavClick()"
                >
                  <i class="bi {{ item.icon }}"></i>
                  <span *ngIf="!isSidebarCollapsed">{{ item.label }}</span>
                </a>
              </li>
            </ng-container>
          </ul>
        </nav>

        <div class="sidebar-footer" *ngIf="!isSidebarCollapsed">
          <div class="user-info">
            <div class="user-avatar">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="user-details">
              <span class="user-name">{{ currentUser?.name || 'Admin User' }}</span>
              <span class="user-role">{{ currentUser?.roles?.[0] || 'Administrator' }}</span>
            </div>
          </div>
          <button class="btn-logout" (click)="logout()">
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
            <div class="notif-wrap" #notifWrap>
              <button class="notif-btn" (click)="toggleNotifications()" aria-label="Notifications">
                <i class="bi bi-bell"></i>
                <span class="notif-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
              </button>
              <div class="notif-dropdown" *ngIf="notificationsOpen" (mouseleave)="notificationsOpen = false">
                <div class="notif-header">
                  <span>Notificaciones</span>
                  <button class="notif-link" (click)="markAllRead()" *ngIf="unreadCount > 0">Marcar todas</button>
                </div>
                <div class="notif-list">
                  <a
                    class="notif-item"
                    *ngFor="let n of notifications"
                    [routerLink]="n.link || '/admin'"
                    (click)="markRead(n)"
                  >
                    <i class="bi" [ngClass]="notifIcon(n.type)"></i>
                    <div class="notif-body">
                      <span class="notif-title">{{ n.title }}</span>
                      <span class="notif-msg" *ngIf="n.message">{{ n.message }}</span>
                      <span class="notif-time">{{ n.createdAt | date:'short' }}</span>
                    </div>
                    <span class="notif-dot" *ngIf="!n.readAt"></span>
                  </a>
                  <div class="notif-empty" *ngIf="notifications.length === 0">Sin notificaciones</div>
                </div>
              </div>
            </div>
            <button class="theme-toggle" (click)="toggleTheme()" aria-label="Toggle theme">
              <i class="bi" [class.bi-sun]="isDark" [class.bi-moon]="!isDark"></i>
            </button>
            <div class="topbar-user">
              <i class="bi bi-person-circle user-avatar-icon"></i>
              <span class="user-name-top">{{ currentUser?.name || 'Admin' }}</span>
            </div>
          </div>
        </header>

        <main class="content">
          <router-outlet #outlet="outlet" [@routeAnimations]="getRouteAnimationData(outlet)"></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  getRouteAnimationData(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  isDark = true;
  pageTitle = 'Dashboard';
  notificationsOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private notifTimer: any;
  private userSub: any;
  currentUser = this.authService.getCurrentUser();

  menuGroups: NavGroup[] = [
    {
      title: 'MI CUENTA',
      items: [
        { label: 'Mi Perfil', route: '/dashboard', icon: 'bi-person-circle', permission: '__all__' },
      ],
    },
    {
      title: 'EMPRESA',
      items: [
        { label: 'Información corporativa', route: '/admin/company', icon: 'bi-building', permission: 'company.read', adminOnly: true },
        { label: 'Servicios', route: '/admin/services', icon: 'bi-grid', permission: 'services.manage', adminOnly: true },
        { label: 'Clientes', route: '/admin/clients', icon: 'bi-people', permission: 'clients.manage', adminOnly: true },
        { label: 'Testimonios', route: '/admin/testimonials', icon: 'bi-chat-quote', permission: 'testimonials.manage', adminOnly: true },
      ],
    },
    {
      title: 'PORTAFOLIO',
      items: [
        { label: 'Proyectos', route: '/admin/projects', icon: 'bi-folder2', permission: 'projects.read', adminOnly: true },
        { label: 'Categorías', route: '/admin/categories', icon: 'bi-tags', permission: 'categories.manage', adminOnly: true },
        { label: 'Tecnologías', route: '/admin/technologies', icon: 'bi-cpu', permission: 'technologies.manage', adminOnly: true },
        { label: 'Repositorios', route: '/admin/repositories', icon: 'bi-git', permission: 'projects.read', adminOnly: true },
      ],
    },
    {
      title: 'EQUIPO',
      items: [
        { label: 'Miembros', route: '/admin/team', icon: 'bi-person-badge', permission: 'team.read', adminOnly: true },
        { label: 'Experiencia', route: '/admin/experiences', icon: 'bi-briefcase', permissions: ['team.update', 'team.read'], adminOnly: true },
        { label: 'Educación', route: '/admin/education', icon: 'bi-book', permissions: ['team.update', 'team.read'], adminOnly: true },
        { label: 'Certificaciones', route: '/admin/certificates', icon: 'bi-patch-check', permissions: ['team.update', 'team.read'], adminOnly: true },
        { label: 'Habilidades', route: '/admin/skills', icon: 'bi-gear', permissions: ['team.update', 'team.read'], adminOnly: true },
        { label: 'Redes sociales', route: '/admin/social-links', icon: 'bi-link-45deg', permissions: ['team.update', 'team.read'], adminOnly: true },
      ],
    },
    {
      title: 'CONTENIDO',
      items: [
        { label: 'Blog', route: '/admin/posts', icon: 'bi-journal-text', permission: 'posts.manage', adminOnly: true },
        { label: 'Multimedia', route: '/admin/media', icon: 'bi-images', permissions: ['media.manage', 'media.upload'], adminOnly: true },
        { label: 'SEO', route: '/admin/settings', icon: 'bi-search', permission: 'settings.manage', adminOnly: true },
      ],
    },
    {
      title: 'COMERCIAL',
      items: [
        { label: 'Contactos / Leads', route: '/admin/leads', icon: 'bi-envelope-open', permission: 'messages.read', adminOnly: true },
        { label: 'Mensajes', route: '/admin/messages', icon: 'bi-envelope', permission: 'messages.read', adminOnly: true },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { label: 'Usuarios', route: '/admin/users', icon: 'bi-people-fill', permission: 'users.manage', adminOnly: true },
        { label: 'Roles y permisos', route: '/admin/roles', icon: 'bi-shield-lock', permission: 'roles.manage', adminOnly: true },
        { label: 'Configuración', route: '/admin/settings', icon: 'bi-sliders', permission: 'settings.manage', adminOnly: true },
        { label: 'Auditoría', route: '/admin/audit', icon: 'bi-clipboard-data', permission: 'audit.read', adminOnly: true },
      ],
    },
  ];

  get filteredGroups(): NavGroup[] {
    if (!this._filteredGroups) this._filteredGroups = this.buildNavGroups();
    return this._filteredGroups;
  }

  private _filteredGroups: NavGroup[] | null = null;
  private _isAdmin: boolean | null = null;

  get isAdmin(): boolean {
    if (this._isAdmin === null) {
      const user = this.authService.getCurrentUser();
      if (!user) { this._isAdmin = false; return false; }
      const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'PROJECT_MANAGER'];
      this._isAdmin = user.role === 'ADMIN' || user.roles?.some((r: string) => ADMIN_ROLES.includes(r)) || false;
    }
    return this._isAdmin;
  }

  private buildNavGroups(): NavGroup[] {
    return this.menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => this.canSee(item)),
      }))
      .filter((group) => group.items.length > 0);
  }

  canSee(item: NavItem): boolean {
    if (item.permission === '__all__') return true;
    if (item.adminOnly && !this.isAdmin) return false;
    if (item.permission) return this.authService.hasPermission(item.permission);
    if (item.permissions?.length) return this.authService.hasAnyPermission(item.permissions);
    return true;
  }

  ngOnInit(): void {
    this._filteredGroups = this.buildNavGroups();
    this.userSub = this.authService.currentUser$.subscribe(() => {
      this._filteredGroups = null;
    });
    this.loadNotifications();
    this.notifTimer = setInterval(() => this.loadNotifications(), 60000);
  }

  ngOnDestroy(): void {
    if (this.notifTimer) clearInterval(this.notifTimer);
    if (this.userSub) this.userSub.unsubscribe();
  }

  loadNotifications(): void {
    this.apiService.getNotifications({ limit: 15 }).subscribe({
      next: (res) => {
        this.notifications = res.notifications;
        this.unreadCount = res.unread;
      },
      error: () => {},
    });
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.loadNotifications();
  }

  markRead(n: Notification): void {
    if (!n.readAt) {
      this.apiService.markNotificationRead(n.id).subscribe({
        next: () => {
          n.readAt = new Date().toISOString();
          if (this.unreadCount > 0) this.unreadCount--;
        },
        error: () => {},
      });
    }
    this.notificationsOpen = false;
  }

  markAllRead(): void {
    this.apiService.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.readAt = n.readAt || new Date().toISOString()));
        this.unreadCount = 0;
      },
      error: () => {},
    });
  }

  notifIcon(type: string): string {
    switch (type) {
      case 'LEAD': return 'bi-person-plus';
      case 'MESSAGE': return 'bi-envelope';
      case 'SUCCESS': return 'bi-check-circle';
      case 'WARNING': return 'bi-exclamation-triangle';
      default: return 'bi-info-circle';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

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

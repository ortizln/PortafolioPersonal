import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Profile, SocialLink } from '../core/models';
import { UploadUrlPipe } from '../shared/upload-url.pipe';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, UploadUrlPipe],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="container">
          <a routerLink="/portfolio" class="back-link">&larr; Volver al Portafolio</a>
          <h1>Sobre Mí</h1>
        </div>
      </div>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle"></i>
        <p>No se pudo cargar el perfil. Intenta de nuevo más tarde.</p>
        <button class="btn-retry" (click)="loadData()">Reintentar</button>
      </div>

      <div *ngIf="!loading && !error && !profile" class="page-empty">
        <i class="bi bi-person"></i>
        <p>No hay información de perfil aún.</p>
      </div>

      <div *ngIf="!loading && profile" class="page-content">
        <div class="container">
          <div class="about-layout">
            <div class="about-image-section" data-aos="fade-right">
              <div class="about-image-card">
                <img
                  class="about-image"
                  [src]="(profile.profileImage | uploadUrl) || 'assets/default-avatar.svg'"
                  [alt]="profile.fullName"
                />
                <div class="about-image-glow"></div>
              </div>
            </div>

            <div class="about-info-section" data-aos="fade-left">
              <h2 class="about-name">{{ profile.fullName }}</h2>
              <p class="about-title">{{ profile.professionalTitle }}</p>
              <p class="about-bio">{{ profile.aboutMe || profile.description || 'No hay descripción disponible.' }}</p>

              <div class="about-details">
                <div class="detail-item" *ngIf="profile.email">
                  <i class="bi bi-envelope-fill"></i>
                  <span>{{ profile.email }}</span>
                </div>
                <div class="detail-item" *ngIf="profile.phone">
                  <i class="bi bi-whatsapp"></i>
                  <a [href]="whatsAppUrl(profile.phone)" target="_blank" rel="noopener noreferrer" class="phone-link">
                    {{ profile.phone }}
                  </a>
                </div>
                <div class="detail-item" *ngIf="profile.location">
                  <i class="bi bi-geo-alt-fill"></i>
                  <span>{{ profile.location }}</span>
                </div>
              </div>

              <div class="about-cv" *ngIf="profile.cvFile">
                <a [href]="profile.cvFile | uploadUrl" target="_blank" class="cv-download-btn">
                  <i class="bi bi-download"></i> Descargar CV
                </a>
              </div>

              <div class="about-socials" *ngIf="socialLinks.length">
                <a *ngFor="let link of socialLinks" [href]="link.url" target="_blank" rel="noopener noreferrer" class="social-icon">
                  <i class="bi" [ngClass]="getIcon(link.platform)"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .page-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 24px 0; }
    .page-header h1 { font-size: 1.5rem; color: var(--white); margin: 8px 0 0; }
    .back-link { color: var(--accent); font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: var(--transition); }
    .back-link:hover { opacity: 0.8; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .page-loading { display: flex; justify-content: center; padding: 120px 0; }
    .page-error { text-align: center; padding: 120px 24px; color: var(--text-muted); }
    .page-error i { font-size: 3rem; color: var(--accent); margin-bottom: 16px; }
    .page-empty { text-align: center; padding: 120px 24px; color: var(--text-muted); }
    .page-empty i { font-size: 4rem; color: var(--accent); opacity: 0.5; margin-bottom: 16px; }
    .btn-retry { background: var(--accent); color: var(--bg-primary); border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-retry:hover { opacity: 0.9; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-content { padding: 60px 0; }
    .about-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 60px; align-items: center; max-width: 1000px; margin: 0 auto; }
    @media (max-width: 768px) { .about-layout { grid-template-columns: 1fr; gap: 40px; } }
    .about-image-card { position: relative; width: 300px; height: 300px; margin: 0 auto; border-radius: 50%; overflow: hidden; border: 3px solid var(--accent); }
    .about-image { width: 100%; height: 100%; object-fit: cover; }
    .about-image-glow { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 40px rgba(var(--accent-rgb, 100, 255, 218), 0.3); }
    .about-name { font-size: 2rem; font-weight: 700; color: var(--white); margin: 0 0 8px; }
    .about-title { font-size: 1.1rem; color: var(--accent); margin: 0 0 20px; }
    .about-bio { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7; margin: 0 0 24px; }
    .about-details { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
    .detail-item { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 0.9rem; }
    .detail-item i { color: var(--accent); font-size: 1.1rem; width: 20px; }
    .phone-link { color: var(--text-muted); text-decoration: none; transition: var(--transition); }
    .phone-link:hover { color: #25D366; }
    .about-cv { margin-bottom: 24px; }
    .cv-download-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--bg-primary); border-radius: 12px; font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: var(--transition); }
    .cv-download-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(var(--accent-rgb), 0.3); color: var(--bg-primary); }
    .about-socials { display: flex; gap: 12px; }
    .social-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(var(--accent-rgb, 100, 255, 218), 0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: var(--transition); }
    .social-icon:hover { background: var(--accent); color: var(--bg-primary); transform: translateY(-3px); }
  `]
})
export class AboutPageComponent implements OnInit {
  private api = inject(ApiService);
  profile: Profile | null = null;
  socialLinks: SocialLink[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = false;
    this.api.getPortfolio().subscribe({
      next: (data) => {
        this.profile = data.profile;
        this.socialLinks = data.socialLinks || [];
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }

  whatsAppUrl(phone: string): string {
    return 'https://wa.me/' + phone.replace(/[^0-9]/g, '');
  }

  getIcon(platform: string): string {
    const map: Record<string, string> = {
      github: 'bi-github', linkedin: 'bi-linkedin', twitter: 'bi-twitter-x', 'x-twitter': 'bi-twitter-x',
      youtube: 'bi-youtube', instagram: 'bi-instagram', facebook: 'bi-facebook', email: 'bi-envelope-fill',
      website: 'bi-globe2', medium: 'bi-medium', dev: 'bi-code-slash', stackoverflow: 'bi-stack-overflow',
    };
    return map[platform.toLowerCase()] || 'bi-link-45deg';
  }
}

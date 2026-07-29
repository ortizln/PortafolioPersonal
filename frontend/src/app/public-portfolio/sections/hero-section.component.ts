import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UploadUrlPipe } from '../../shared/upload-url.pipe';
import { Profile, SocialLink } from '../../core/models';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, UploadUrlPipe],
  template: `
    <section id="home" class="hero-section" aria-label="Inicio">
      <div class="hero-bg" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <div class="hero-content">
        <div class="hero-photo-wrapper" data-aos="zoom-in" data-aos-duration="600">
          <div class="hero-photo-frame">
            <img
              class="hero-photo"
              [src]="(profile?.profileImage | uploadUrl) || 'assets/default-avatar.svg'"
              [alt]="'Foto de perfil de ' + (profile?.fullName || '')"
            />
          </div>
        </div>

        <h1 class="hero-name" data-aos="fade-up" data-aos-delay="100">
          {{ profile?.fullName || 'Cargando...' }}
        </h1>

        <p class="hero-title" data-aos="fade-up" data-aos-delay="200" role="text">
          {{ profile?.professionalTitle || 'Full Stack Developer' }}
          <span class="hero-cursor" aria-hidden="true">|</span>
        </p>

        <p class="hero-description" data-aos="fade-up" data-aos-delay="300">
          {{ profile?.description || '' }}
        </p>

        <div class="hero-actions" data-aos="fade-up" data-aos-delay="400">
          <a *ngIf="profile?.cvFile" [href]="profile!.cvFile | uploadUrl" target="_blank" class="btn-primary" aria-label="Descargar currículum vitae">
            <i class="bi bi-download" aria-hidden="true"></i> Descargar CV
          </a>
          <a routerLink="/contact" class="btn-secondary" aria-label="Ir al formulario de contacto">
            <i class="bi bi-chat-dots" aria-hidden="true"></i> Contáctame
          </a>
        </div>

        <div class="hero-socials" data-aos="fade-up" data-aos-delay="500" aria-label="Redes sociales">
          <a
            *ngFor="let link of socialLinks"
            [href]="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="social-btn"
            [attr.aria-label]="'Visitar perfil de ' + link.platform"
          >
            <i class="bi" [ngClass]="getSocialIcon(link.platform)" aria-hidden="true"></i>
          </a>
        </div>

        <div class="hero-stats" data-aos="fade-up" data-aos-delay="600" aria-label="Estadísticas">
          <div class="stat-item">
            <span class="stat-number" [attr.aria-label]="stats.projects + ' proyectos'">{{ stats.projects }}+</span>
            <span class="stat-label">Proyectos</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" [attr.aria-label]="stats.experience + ' años de experiencia'">{{ stats.experience }}+</span>
            <span class="stat-label">Años Exp.</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" [attr.aria-label]="stats.certifications + ' certificaciones'">{{ stats.certifications }}+</span>
            <span class="stat-label">Certificaciones</span>
          </div>
        </div>
      </div>

      <div class="scroll-indicator" aria-hidden="true">
        <div class="mouse">
          <div class="mouse-wheel"></div>
        </div>
        <span>Scroll</span>
      </div>
    </section>
  `,
  styleUrls: ['./hero-section.component.scss'],
})
export class HeroSectionComponent {
  @Input() profile: Profile | null = null;
  @Input() socialLinks: SocialLink[] = [];
  @Input() stats: { projects: number; experience: number; certifications: number } = { projects: 0, experience: 0, certifications: 0 };

  getSocialIcon(platform: string): string {
    const map: Record<string, string> = {
      github: 'bi-github',
      linkedin: 'bi-linkedin',
      twitter: 'bi-twitter-x',
      'x-twitter': 'bi-twitter-x',
      youtube: 'bi-youtube',
      instagram: 'bi-instagram',
      facebook: 'bi-facebook',
      twitch: 'bi-twitch',
      discord: 'bi-discord',
      email: 'bi-envelope-fill',
      website: 'bi-globe2',
      medium: 'bi-medium',
      dev: 'bi-code-slash',
      stackoverflow: 'bi-stack-overflow',
      telegram: 'bi-telegram',
      whatsapp: 'bi-whatsapp',
    };
    return map[platform.toLowerCase()] || 'bi-link-45deg';
  }
}

import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { NgFor, NgIf, NgClass, isPlatformBrowser } from '@angular/common';
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
        <canvas #particleCanvas class="particle-canvas" aria-hidden="true"></canvas>
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
export class HeroSectionComponent implements AfterViewInit, OnDestroy {
  @Input() profile: Profile | null = null;
  @Input() socialLinks: SocialLink[] = [];
  @Input() stats: { projects: number; experience: number; certifications: number } = { projects: 0, experience: 0, certifications: 0 };

  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private mouse = { x: -1000, y: -1000 };
  private animFrameId = 0;
  private readonly PARTICLE_COUNT = 90;
  private readonly CONNECT_DIST = 130;
  private readonly MOUSE_RADIUS = 150;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initCanvas();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    this.createParticles();
    this.bindMouse();
    this.animate();
  }

  private createParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      this.particles.push({
        x: Math.random() * (this.canvasRef.nativeElement.width || window.innerWidth),
        y: Math.random() * (this.canvasRef.nativeElement.height || window.innerHeight),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
  }

  private bindMouse(): void {
    const handler = (e: MouseEvent) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handler);
  }

  private animate(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#818cf8';
    const accentRgb = style.getPropertyValue('--accent-rgb').trim() || '129, 140, 248';

    for (const p of this.particles) {
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.MOUSE_RADIUS) {
        const force = (this.MOUSE_RADIUS - dist) / this.MOUSE_RADIUS;
        p.vx -= (dx / dist) * force * 0.5;
        p.vy -= (dy / dist) * force * 0.5;
      }

      p.vx += (Math.random() - 0.5) * 0.05;
      p.vy += (Math.random() - 0.5) * 0.05;
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accentRgb}, ${p.opacity})`;
      ctx.fill();
    }

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.CONNECT_DIST) {
          const alpha = (1 - dist / this.CONNECT_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.animate());
  }

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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

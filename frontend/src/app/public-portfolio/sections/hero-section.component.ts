import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Profile, SocialLink } from '../../core/models';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section id="home" class="hero-section">
      <div class="particles">
        <div class="particle" *ngFor="let p of particles" [style]="p.style"></div>
      </div>

      <div class="hero-content" data-aos="fade-up">
        <div class="hero-photo-wrapper">
          <div class="hero-photo-glow"></div>
          <img
            class="hero-photo"
            [src]="profile?.profileImage || 'assets/default-avatar.svg'"
            [alt]="profile?.fullName"
          />
        </div>

        <h1 class="hero-name">
          {{ profile?.fullName || 'Loading...' }}
        </h1>

        <div class="hero-title-wrapper">
          <span class="hero-title">{{ displayTitle }}</span>
          <span class="typing-cursor" [class.blink]="typingDone">|</span>
        </div>

        <p class="hero-description">
          {{ profile?.description || '' }}
        </p>

        <div class="hero-socials">
          <a
            *ngFor="let link of socialLinks"
            [href]="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="social-btn"
            [attr.aria-label]="link.platform"
          >
            <i class="bi" [ngClass]="getSocialIcon(link.platform)"></i>
          </a>
        </div>

        <div class="hero-actions">
          <a *ngIf="profile?.cvFile" [href]="profile!.cvFile" target="_blank" class="btn-primary">
            <i class="bi bi-download"></i> Download CV
          </a>
        </div>

        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">{{ stats.projects }}+</span>
            <span class="stat-label">Projects</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.experience }}+</span>
            <span class="stat-label">Years Exp.</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.certifications }}+</span>
            <span class="stat-label">Certifications</span>
          </div>
        </div>
      </div>

      <div class="scroll-indicator" data-aos="fade-up" data-aos-delay="1000">
        <div class="mouse">
          <div class="mouse-wheel"></div>
        </div>
        <span>Scroll Down</span>
      </div>
    </section>
  `,
  styleUrls: ['./hero-section.component.scss'],
})
export class HeroSectionComponent {
  @Input() profile: Profile | null = null;
  @Input() socialLinks: SocialLink[] = [];
  @Input() stats: { projects: number; experience: number; certifications: number } = { projects: 0, experience: 0, certifications: 0 };

  displayTitle = '';
  typingDone = false;
  private titleIndex = 0;
  private titleTimeout: any;

  particles = Array.from({ length: 20 }, (_, i) => ({
    style: {
      '--x': `${Math.random() * 100}%`,
      '--y': `${Math.random() * 100}%`,
      '--s': `${2 + Math.random() * 4}px`,
      '--d': `${Math.random() * 8 + 4}s`,
      '--delay': `${Math.random() * 5}s`,
      '--op': `${0.15 + Math.random() * 0.25}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    },
  }));

  ngOnInit(): void {
    this.startTyping();
  }

  ngOnDestroy(): void {
    if (this.titleTimeout) clearTimeout(this.titleTimeout);
  }

  private startTyping(): void {
    const title = this.profile?.professionalTitle || 'Full Stack Developer';
    const type = () => {
      if (this.titleIndex < title.length) {
        this.displayTitle += title[this.titleIndex];
        this.titleIndex++;
        this.titleTimeout = setTimeout(type, 50 + Math.random() * 50);
      } else {
        this.typingDone = true;
      }
    };
    type();
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

import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { UploadUrlPipe } from '../../shared/upload-url.pipe';
import { Profile } from '../../core/models';

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [NgFor, NgIf, UploadUrlPipe],
  template: `
    <section id="about" class="about-section">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">About Me</span>
          <h2 class="section-title">Get to Know Me</h2>
          <div class="section-divider"></div>
        </div>

        <div class="about-grid">
          <div class="about-image-wrapper" data-aos="fade-right">
            <div class="about-image-card">
              <img
                class="about-image"
                [src]="(profile?.profileImage | uploadUrl) || 'assets/default-avatar.svg'"
                [alt]="profile?.fullName"
              />
              <div class="glow-ring"></div>
            </div>
            <div class="exp-badge">
              <span class="exp-number">{{ yearsActive }}+</span>
              <span class="exp-label">Years Active</span>
            </div>
          </div>

          <div class="about-content" data-aos="fade-left">
            <h3 class="about-greeting">
              <span class="greeting-wave">👋</span>
              Hi, I'm <span class="greeting-name">{{ profile?.fullName }}</span>
            </h3>
            <p class="about-text">{{ profile?.aboutMe || profile?.biography || profile?.description || 'No description available.' }}</p>

            <div class="about-contact-row" *ngIf="profile?.email || profile?.phone || profile?.location">
              <div class="contact-chip" *ngIf="profile?.email">
                <i class="bi bi-envelope-fill"></i>
                {{ profile!.email }}
              </div>
              <div class="contact-chip" *ngIf="profile?.phone">
                <i class="bi bi-telephone-fill"></i>
                {{ profile!.phone }}
              </div>
              <div class="contact-chip" *ngIf="profile?.location">
                <i class="bi bi-geo-alt-fill"></i>
                {{ profile!.location }}
              </div>
            </div>

            <div class="about-specialties" *ngIf="specialtyList.length">
              <h4 class="specialties-title">Specialties</h4>
              <div class="specialties-tags">
                <span class="specialty-tag" *ngFor="let s of specialtyList">
                  <i class="bi bi-check-circle-fill"></i>
                  {{ s }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./about-section.component.scss'],
})
export class AboutSectionComponent {
  @Input() profile: Profile | null = null;

  get specialtyList(): string[] {
    if (!this.profile?.specialties) return [];
    return this.profile.specialties
      .split(/[,;\n.]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  get yearsActive(): number {
    return 4;
  }
}

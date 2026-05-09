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
              <div class="about-image-decoration"></div>
            </div>
          </div>

          <div class="about-content" data-aos="fade-left">
            <h3 class="about-greeting">{{ profile?.fullName }}</h3>
            <p class="about-text">{{ profile?.aboutMe || profile?.description || 'No description available.' }}</p>

            <div class="about-specialties" *ngIf="specialties.length">
              <h4 class="specialties-title">Specialties</h4>
              <div class="specialties-tags">
                <span class="specialty-tag" *ngFor="let s of specialties">
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

  specialties = [
    'Full Stack Development',
    'Cloud Architecture',
    'API Design',
    'Database Modeling',
    'DevOps & CI/CD',
    'UI/UX Design',
  ];
}

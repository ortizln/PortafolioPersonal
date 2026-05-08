import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Experience } from '../../core/models';

@Component({
  selector: 'app-experience-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  template: `
    <section id="experience" class="experience-section">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Career</span>
          <h2 class="section-title">Work Experience</h2>
          <div class="section-divider"></div>
        </div>

        <div class="timeline">
          <div
            class="timeline-item"
            *ngFor="let exp of experiences; let i = index"
            [class.current]="exp.isCurrent"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 100"
          >
            <div class="timeline-marker">
              <div class="timeline-dot" [class.active]="exp.isCurrent"></div>
            </div>

            <div class="timeline-card" [class.current-card]="exp.isCurrent">
              <div class="timeline-card-header">
                <div class="timeline-company-icon">
                  <i class="bi bi-building"></i>
                </div>
                <div class="timeline-company-info">
                  <h3 class="timeline-position">{{ exp.position }}</h3>
                  <span class="timeline-company">
                    <a *ngIf="exp.companyUrl" [href]="exp.companyUrl" target="_blank" rel="noopener noreferrer">
                      {{ exp.company }}
                    </a>
                    <span *ngIf="!exp.companyUrl">{{ exp.company }}</span>
                  </span>
                </div>
                <span class="timeline-badge" *ngIf="exp.isCurrent">Current</span>
              </div>

              <div class="timeline-meta">
                <span class="timeline-date">
                  <i class="bi bi-calendar3"></i>
                  {{ exp.startDate | date:'MMM yyyy' }} - {{ exp.isCurrent ? 'Present' : (exp.endDate | date:'MMM yyyy') }}
                </span>
                <span class="timeline-location" *ngIf="exp.location">
                  <i class="bi bi-geo-alt"></i> {{ exp.location }}
                </span>
              </div>

              <p class="timeline-description">{{ exp.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./experience-section.component.scss'],
})
export class ExperienceSectionComponent {
  @Input() experiences: Experience[] = [];
}

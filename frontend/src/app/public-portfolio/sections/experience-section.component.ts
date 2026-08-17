import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { Experience } from '../../core/models';

@Component({
  selector: 'app-experience-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe],
  template: `
    <section id="experience" class="experience-section" aria-label="Experiencia laboral">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Trayectoria</span>
          <h2 class="section-title">Experiencia Laboral</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>

        <div class="exp-list" role="list">
          <div
            class="exp-item"
            *ngFor="let exp of experiences; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 100"
            role="listitem"
          >
            <div class="exp-line" aria-hidden="true">
              <div class="exp-dot" [class.current]="exp.current"></div>
            </div>

            <div class="exp-card" [class.current]="exp.current">
              <div class="exp-card-top">
                <div class="exp-avatar" aria-hidden="true">
                  {{ exp.company.charAt(0) }}
                </div>
                <div class="exp-info">
                  <h3 class="exp-position">{{ exp.position }}</h3>
                  <div class="exp-company-row">
                    <span class="exp-company">{{ exp.company }}</span>
                    <span class="exp-badge" *ngIf="exp.current">Actual</span>
                  </div>
                  <div class="exp-meta">
                    <span>
                      <i class="bi bi-calendar3" aria-hidden="true"></i>
                      {{ exp.startDate | date:'MMM yyyy' }} — {{ exp.current ? 'Actualidad' : (exp.endDate | date:'MMM yyyy') }}
                    </span>
                    <span *ngIf="exp.location">
                      <i class="bi bi-geo-alt" aria-hidden="true"></i> {{ exp.location }}
                    </span>
                  </div>
                </div>
              </div>

              <p class="exp-description">{{ exp.description }}</p>

              <div class="exp-achievements" *ngIf="getAchievements(exp).length">
                <h4 class="exp-achievements-title">Logros</h4>
                <ul>
                  <li *ngFor="let ach of getAchievements(exp)">{{ ach }}</li>
                </ul>
              </div>

              <div class="exp-techs" *ngIf="exp.technologies?.length" aria-label="Tecnologías utilizadas">
                <span class="exp-tech" *ngFor="let tech of exp.technologies">{{ tech }}</span>
              </div>
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

  getAchievements(exp: any): string[] {
    if (!exp.achievements) return [];
    if (Array.isArray(exp.achievements)) return exp.achievements;
    if (typeof exp.achievements === 'string') {
      try { return JSON.parse(exp.achievements); } catch { return []; }
    }
    return [];
  }
}

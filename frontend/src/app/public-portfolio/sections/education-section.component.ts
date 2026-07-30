import { Component, Input } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { Education } from '../../core/models';

@Component({
  selector: 'app-education-section',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  template: `
    <section id="education" class="education-section" aria-label="Formación académica">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Educación</span>
          <h2 class="section-title">Formación Académica</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>

        <div class="education-grid">
          <div
            class="education-card"
            *ngFor="let edu of education; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 100"
          >
            <div class="edu-icon" aria-hidden="true">
              <i class="bi bi-mortarboard-fill" aria-hidden="true"></i>
            </div>
            <div class="edu-content">
              <h3 class="edu-degree">{{ edu.degree }} en {{ edu.field }}</h3>
              <h4 class="edu-institution">{{ edu.institution }}</h4>
              <div class="edu-meta">
                <span class="edu-date">
                  <i class="bi bi-calendar3" aria-hidden="true"></i>
                  {{ edu.startDate | date:'yyyy' }} - {{ edu.current ? 'Presente' : (edu.endDate | date:'yyyy') }}
                </span>
                <span class="edu-grade" *ngIf="edu.grade">
                  <i class="bi bi-trophy" aria-hidden="true"></i> {{ edu.grade }}
                </span>
              </div>
              <p class="edu-description" *ngIf="edu.description">{{ edu.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./education-section.component.scss'],
})
export class EducationSectionComponent {
  @Input() education: Education[] = [];
}

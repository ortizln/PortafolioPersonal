import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Language } from '../../core/models';

@Component({
  selector: 'app-languages-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  template: `
    <section id="languages" class="languages-section">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Languages</span>
          <h2 class="section-title">Language Proficiency</h2>
          <div class="section-divider"></div>
        </div>

        <div class="languages-grid">
          <div
            class="language-card"
            *ngFor="let lang of languages; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 100"
          >
            <div class="language-icon">
              {{ lang.name.charAt(0) }}
            </div>
            <div class="language-info">
              <div class="language-header">
                <h3 class="language-name">{{ lang.name }}</h3>
                <span class="language-level-badge" [ngClass]="getBadgeClass(lang.level)">
                  {{ lang.level }}
                </span>
              </div>
              <div class="language-bar-track">
                <div
                  class="language-bar-fill"
                  [style.width.%]="lang.percentage"
                  [style.--bar-color]="getLevelColor(lang.level)"
                ></div>
              </div>
              <span class="language-percentage">{{ lang.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./languages-section.component.scss'],
})
export class LanguagesSectionComponent {
  @Input() languages: Language[] = [];

  getBadgeClass(level: string): string {
    const map: Record<string, string> = {
      'Native': 'badge-native',
      'Advanced': 'badge-advanced',
      'Intermediate': 'badge-intermediate',
      'Basic': 'badge-basic',
      'C2': 'badge-c2',
      'C1': 'badge-c1',
      'B2': 'badge-b2',
      'B1': 'badge-b1',
      'A2': 'badge-a2',
      'A1': 'badge-a1',
    };
    return map[level] || 'badge-intermediate';
  }

  getLevelColor(level: string): string {
    const map: Record<string, string> = {
      'Native': '#22c55e',
      'Advanced': '#3b82f6',
      'Intermediate': '#f59e0b',
      'Basic': '#ef4444',
      'C2': '#22c55e',
      'C1': '#3b82f6',
      'B2': '#3b82f6',
      'B1': '#f59e0b',
      'A2': '#f59e0b',
      'A1': '#ef4444',
    };
    return map[level] || '#f59e0b';
  }
}

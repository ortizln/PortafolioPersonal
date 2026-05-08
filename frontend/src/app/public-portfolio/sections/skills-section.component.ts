import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Skill } from '../../core/models';

@Component({
  selector: 'app-skills-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  template: `
    <section id="skills" class="skills-section">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Skills</span>
          <h2 class="section-title">Technical Expertise</h2>
          <div class="section-divider"></div>
        </div>

        <div class="skills-tabs" data-aos="fade-up">
          <button
            class="tab-btn"
            *ngFor="let cat of categories"
            [class.active]="activeCategory === cat"
            (click)="activeCategory = cat"
          >
            <i class="bi" [ngClass]="getCategoryIcon(cat)"></i>
            {{ cat }}
          </button>
        </div>

        <div class="skills-grid">
          <div
            class="skill-card"
            *ngFor="let skill of filteredSkills; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 60"
          >
            <div class="skill-header">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-level" [ngClass]="getLevelClass(skill.percentage)">
                {{ getLevelLabel(skill.percentage) }}
              </span>
            </div>
            <div class="skill-bar-track">
              <div
                class="skill-bar-fill"
                [style.width.%]="skill.percentage"
                [style.--bar-color]="getBarColor(skill.percentage)"
              ></div>
            </div>
            <span class="skill-percentage">{{ skill.percentage }}%</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./skills-section.component.scss'],
})
export class SkillsSectionComponent {
  @Input() skills: Skill[] = [];
  activeCategory = '';

  get categories(): string[] {
    const cats = [...new Set(this.skills.map((s) => s.category))];
    if (!this.activeCategory && cats.length) this.activeCategory = cats[0];
    return cats;
  }

  get filteredSkills(): Skill[] {
    return this.skills.filter((s) => s.category === this.activeCategory);
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      Frontend: 'bi-code-square',
      Backend: 'bi-server',
      Database: 'bi-database',
      DevOps: 'bi-gear-wide-connected',
      'Cloud': 'bi-cloud',
      'Mobile': 'bi-phone',
      'Tools': 'bi-tools',
      'Languages': 'bi-filetype-js',
      'Frameworks': 'bi-layers',
      'Other': 'bi-star',
    };
    return map[category] || 'bi-star';
  }

  getLevelLabel(percentage: number): string {
    if (percentage >= 90) return 'Expert';
    if (percentage >= 75) return 'Advanced';
    if (percentage >= 50) return 'Intermediate';
    return 'Beginner';
  }

  getLevelClass(percentage: number): string {
    if (percentage >= 90) return 'level-expert';
    if (percentage >= 75) return 'level-advanced';
    if (percentage >= 50) return 'level-intermediate';
    return 'level-beginner';
  }

  getBarColor(percentage: number): string {
    if (percentage >= 90) return '#22c55e';
    if (percentage >= 75) return '#3b82f6';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  }
}

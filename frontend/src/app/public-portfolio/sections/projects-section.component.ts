import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Project } from '../../core/models';

@Component({
  selector: 'app-projects-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  template: `
    <section id="projects" class="projects-section">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Portfolio</span>
          <h2 class="section-title">Featured Projects</h2>
          <div class="section-divider"></div>
        </div>

        <div class="projects-grid">
          <div
            class="project-card"
            *ngFor="let project of projects; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 100"
            [class.featured]="project.isFeatured"
            (click)="openProject(project)"
          >
            <div class="project-banner">
              <img
                class="project-image"
                [src]="getPrimaryImage(project) || 'assets/project-placeholder.svg'"
                [alt]="project.title"
              />
              <div class="project-overlay">
                <div class="overlay-links">
                  <a
                    *ngIf="project.demoUrl"
                    [href]="project.demoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="overlay-link"
                    (click)="stopEvent($event)"
                  >
                    <i class="bi bi-box-arrow-up-right"></i>
                    <span>Live Demo</span>
                  </a>
                  <a
                    *ngIf="project.githubUrl"
                    [href]="project.githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="overlay-link"
                    (click)="stopEvent($event)"
                  >
                    <i class="bi bi-github"></i>
                    <span>Source Code</span>
                  </a>
                </div>
              </div>
              <span class="project-featured-badge" *ngIf="project.isFeatured">
                <i class="bi bi-star-fill"></i> Featured
              </span>
            </div>

            <div class="project-body">
              <div class="project-techs">
                <span
                  class="project-tech"
                  *ngFor="let tech of project.technologies"
                  [style.--tech-color]="tech.color || '#64ffda'"
                >
                  {{ tech.name }}
                </span>
              </div>
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-description">{{ project.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="selectedProject" (click)="closeProject()">
        <div class="modal-content" (click)="stopEvent($event)">
          <button class="modal-close" (click)="closeProject()">
            <i class="bi bi-x-lg"></i>
          </button>
          <div class="modal-body">
            <img
              class="modal-image"
              [src]="getPrimaryImage(selectedProject) || 'assets/project-placeholder.svg'"
              [alt]="selectedProject.title"
            />
            <div class="modal-details">
              <h2 class="modal-title">{{ selectedProject.title }}</h2>
              <div class="modal-techs">
                <span class="modal-tech" *ngFor="let tech of selectedProject.technologies">
                  {{ tech.name }}
                </span>
              </div>
              <p class="modal-description">{{ selectedProject.description }}</p>
              <div class="modal-actions">
                <a *ngIf="selectedProject.demoUrl" [href]="selectedProject.demoUrl" target="_blank" class="modal-btn primary">
                  <i class="bi bi-box-arrow-up-right"></i> Live Demo
                </a>
                <a *ngIf="selectedProject.githubUrl" [href]="selectedProject.githubUrl" target="_blank" class="modal-btn secondary">
                  <i class="bi bi-github"></i> Source Code
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./projects-section.component.scss'],
})
export class ProjectsSectionComponent {
  @Input() projects: Project[] = [];
  selectedProject: Project | null = null;

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((img) => img.isPrimary);
    const url = primary?.url || project.images?.[0]?.url || project.bannerImage || null;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  openProject(project: Project): void {
    this.selectedProject = project;
  }

  closeProject(): void {
    this.selectedProject = null;
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
  }
}

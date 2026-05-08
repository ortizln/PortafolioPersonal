import { Component, OnInit, HostListener, inject } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Profile, Experience, Education, Certification, Project, Skill, Language, SocialLink } from '../core/models';
import { HeroSectionComponent } from './sections/hero-section.component';
import { AboutSectionComponent } from './sections/about-section.component';
import { ExperienceSectionComponent } from './sections/experience-section.component';
import { EducationSectionComponent } from './sections/education-section.component';
import { CertificationsSectionComponent } from './sections/certifications-section.component';
import { ProjectsSectionComponent } from './sections/projects-section.component';
import { SkillsSectionComponent } from './sections/skills-section.component';
import { LanguagesSectionComponent } from './sections/languages-section.component';
import { ContactSectionComponent } from './sections/contact-section.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    NgIf, NgClass,
    HeroSectionComponent,
    AboutSectionComponent,
    ExperienceSectionComponent,
    EducationSectionComponent,
    CertificationsSectionComponent,
    ProjectsSectionComponent,
    SkillsSectionComponent,
    LanguagesSectionComponent,
    ContactSectionComponent,
  ],
  template: `
    <div class="portfolio-wrapper">
      <app-hero-section
        [profile]="profile"
        [socialLinks]="socialLinks"
        [stats]="stats"
      ></app-hero-section>

      <app-about-section
        *ngIf="profile"
        [profile]="profile"
      ></app-about-section>

      <app-experience-section
        *ngIf="experiences.length"
        [experiences]="experiences"
      ></app-experience-section>

      <app-education-section
        *ngIf="education.length"
        [education]="education"
      ></app-education-section>

      <app-certifications-section
        *ngIf="certifications.length"
        [certifications]="certifications"
      ></app-certifications-section>

      <app-projects-section
        *ngIf="projects.length"
        [projects]="projects"
      ></app-projects-section>

      <app-skills-section
        *ngIf="skills.length"
        [skills]="skills"
      ></app-skills-section>

      <app-languages-section
        *ngIf="languages.length"
        [languages]="languages"
      ></app-languages-section>

      <app-contact-section
        [profile]="profile"
        [socialLinks]="socialLinks"
      ></app-contact-section>

      <button
        class="back-to-top"
        [class.visible]="showBackToTop"
        (click)="scrollToTop()"
        aria-label="Back to top"
      >
        <i class="bi bi-arrow-up"></i>
      </button>
    </div>
  `,
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent implements OnInit {
  private api = inject(ApiService);

  profile: Profile | null = null;
  experiences: Experience[] = [];
  education: Education[] = [];
  certifications: Certification[] = [];
  projects: Project[] = [];
  skills: Skill[] = [];
  languages: Language[] = [];
  socialLinks: SocialLink[] = [];
  stats = { projects: 0, experience: 0, certifications: 0 };
  showBackToTop = false;
  loading = true;

  ngOnInit(): void {
    this.loadPortfolio();
  }

  private loadPortfolio(): void {
    this.api.getPortfolio().subscribe({
      next: (data) => {
        this.profile = data.profile;
        this.experiences = data.experiences || [];
        this.education = data.education || [];
        this.certifications = data.certifications || [];
        this.skills = data.skills || [];
        this.socialLinks = data.socialLinks || [];
        this.calcStats();
      },
      error: () => {
        this.loadFallbackData();
      },
      complete: () => {
        this.loading = false;
        this.initAOS();
      },
    });

    this.api.getPublicProjects().subscribe({
      next: (projects) => {
        this.projects = projects || [];
        this.stats.projects = this.projects.length;
      },
    });
  }

  private loadFallbackData(): void {
    this.api.getPublicExperiences().subscribe((e) => (this.experiences = e || []));
    this.api.getPublicEducation().subscribe((e) => (this.education = e || []));
    this.api.getPublicCertifications().subscribe((c) => (this.certifications = c || []));
    this.api.getPublicSkills().subscribe((s) => (this.skills = s || []));
    this.api.getProfile().subscribe((p) => {
      this.profile = p;
      this.calcStats();
    });
    this.loading = false;
    setTimeout(() => this.initAOS(), 100);
  }

  private calcStats(): void {
    this.stats.experience = this.experiences.filter((e) => e.current).length > 0
      ? new Date().getFullYear() - new Date(this.experiences[0]?.startDate).getFullYear()
      : this.experiences.length;
    this.stats.certifications = this.certifications.length;
    this.stats.projects = Math.max(this.stats.projects, this.projects.length);
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) {
      aos.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 80,
      });
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.showBackToTop = window.scrollY > 600;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

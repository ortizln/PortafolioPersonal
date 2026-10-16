import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Company, Service, Client, Testimonial, Project, TeamMember, Technology, Post } from '../core/models';
import { applyCompanyBrand } from '../core/utils/brand.util';
import { environment } from '../../environments/environment';
import { ServiceCardComponent } from '../shared/components/service-card.component';
import { ProjectCarouselComponent } from '../shared/components/project-carousel.component';
import { TechnologyMarqueeComponent } from '../shared/components/technology-marquee.component';
import { TestimonialCarouselComponent } from '../shared/components/testimonial-carousel.component';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    RouterLink,
    ServiceCardComponent,
    ProjectCarouselComponent,
    TechnologyMarqueeComponent,
    TestimonialCarouselComponent,
    ContactCtaComponent,
    ScrollRevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  company: Company | null = null;
  companyName = 'ALANTEK';
  heroImage: string | null = null;
  services: Service[] = [];
  clients: Client[] = [];
  testimonials: Testimonial[] = [];
  projects: Project[] = [];
  featuredProjects: Project[] = [];
  teamMembers: TeamMember[] = [];
  technologies: Technology[] = [];
  recentPosts: Post[] = [];
  stats = { projects: 0, clients: 0, team: 0 };
  loading = true;
  error = false;
  failedSections: string[] = [];
  partialError = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = false;
    this.failedSections = [];

    const totalCalls = 8;
    let completed = 0;
    const onDone = () => {
      completed++;
      if (completed >= totalCalls) {
        this.loading = false;
        if (this.failedSections.length === totalCalls) {
          this.error = true;
        } else if (this.failedSections.length > 0) {
          this.partialError = `Algunas secciones no pudieron cargar (${this.failedSections.join(', ')}).`;
        }
        this.cdr.markForCheck();
      }
    };

    this.api.getPublicCompany().subscribe({
      next: (c) => {
        this.company = c;
        if (c?.name) this.companyName = c.name;
        this.heroImage = this.resolveAsset(c?.heroImageUrl);
        applyCompanyBrand(c);
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Empresa'); },
      complete: onDone,
    });
    this.api.getPublicServices().subscribe({
      next: (list) => {
        this.services = (list || []).slice(0, 6);
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Servicios'); },
      complete: onDone,
    });
    this.api.getPublicClients().subscribe({
      next: (list) => {
        this.clients = list || [];
        this.stats.clients = this.clients.length;
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Clientes'); },
      complete: onDone,
    });
    this.api.getPublicTestimonials().subscribe({
      next: (list) => {
        this.testimonials = (list || []).slice(0, 6);
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Testimonios'); },
      complete: onDone,
    });
    this.api.getPublicProjects().subscribe({
      next: (list) => {
        this.projects = (list || []).map((p) => ({
          ...p,
          technologies: (p.technologies as any[] | undefined)?.map((t: any) =>
            t.technology ? { ...t.technology, id: t.technology.id } : t
          ) || [],
        }));
        this.stats.projects = this.projects.length;
        const featured = this.projects.filter((p) => p.isFeatured);
        this.featuredProjects = featured.length ? featured : this.projects;
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Proyectos'); },
      complete: onDone,
    });
    this.api.getPublicTeam().subscribe({
      next: (list) => {
        this.teamMembers = (list || []).slice(0, 4);
        this.stats.team = (list || []).length;
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Equipo'); },
      complete: onDone,
    });
    this.api.getPublicTechnologies().subscribe({
      next: (list) => {
        this.technologies = list || [];
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Tecnologías'); },
      complete: onDone,
    });
    this.api.getPublicBlog({ limit: 3 }).subscribe({
      next: (res) => {
        this.recentPosts = (res?.posts || []).slice(0, 3);
        this.cdr.markForCheck();
      },
      error: () => { this.failedSections.push('Blog'); },
      complete: onDone,
    });
  }

  get yearsActive(): number {
    if (!this.company?.foundedYear) return 0;
    return new Date().getFullYear() - this.company.foundedYear;
  }

  get hasStats(): boolean {
    return this.stats.projects > 0 || this.stats.clients > 0 || this.stats.team > 0 || !!this.company?.foundedYear;
  }

  private resolveAsset(url?: string): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  getClientLogo(client: Client): string | null {
    if (!client.logoUrl) return null;
    if (client.logoUrl.startsWith('http://') || client.logoUrl.startsWith('https://') || client.logoUrl.startsWith('data:')) return client.logoUrl;
    return `${environment.uploadUrl}/${client.logoUrl}`;
  }

  trackByClient = (i: number, c: any) => c.id || i;
  trackByTeam = (i: number, m: any) => m.id || m.slug || i;
  trackByPost = (i: number, p: any) => p.id || p.slug || i;
}

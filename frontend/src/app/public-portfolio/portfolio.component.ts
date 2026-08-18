import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Company, Service, Client, Testimonial, Project, TeamMember, Technology, Post } from '../core/models';
import { applyCompanyBrand } from '../core/utils/brand.util';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="corp-wrapper">
      <div *ngIf="loading" class="skeleton-wrapper" aria-label="Cargando sitio" aria-busy="true">
        <div class="skeleton-hero"><div class="sk-line w-60"></div><div class="sk-line w-40"></div><div class="sk-line w-80"></div></div>
        <div class="skeleton-section"><div class="sk-line w-30"></div><div class="sk-line w-90"></div></div>
      </div>

      <div *ngIf="!loading && error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No pudimos cargar el sitio. Intenta de nuevo.</p>
        <button class="btn-retry" (click)="loadAll()" aria-label="Reintentar cargar">Reintentar</button>
      </div>

      <ng-container *ngIf="!loading && !error">
        <!-- HERO -->
        <section class="hero" [class.hero--with-img]="heroImage">
          <div class="hero-bg" *ngIf="heroImage"><img [src]="heroImage" alt="" /></div>
          <div class="hero-overlay"></div>
          <div class="container hero-content" data-aos="fade-up">
            <span class="hero-eyebrow">{{ company?.slogan || 'Tecnología que impulsa tu negocio' }}</span>
            <h1 class="hero-title">{{ companyName }}</h1>
            <p class="hero-subtitle">{{ company?.shortDescription || company?.description || 'Desarrollamos software a medida y soluciones digitales para empresas.' }}</p>
            <div class="hero-actions">
              <a class="btn-hero primary" routerLink="/servicios">Ver servicios</a>
              <a class="btn-hero" routerLink="/contacto">Contáctanos</a>
            </div>
            <div class="hero-stats" *ngIf="hasStats">
              <div class="hero-stat" *ngIf="stats.projects"><span class="stat-value">{{ stats.projects }}+</span><span class="stat-label">Proyectos</span></div>
              <div class="hero-stat" *ngIf="stats.clients"><span class="stat-value">{{ stats.clients }}+</span><span class="stat-label">Clientes</span></div>
              <div class="hero-stat" *ngIf="stats.team"><span class="stat-value">{{ stats.team }}</span><span class="stat-label">Especialistas</span></div>
              <div class="hero-stat" *ngIf="company?.foundedYear"><span class="stat-value">{{ yearsActive }}+</span><span class="stat-label">Años</span></div>
            </div>
          </div>
        </section>

        <!-- SERVICIOS DESTACADOS -->
        <section class="section" id="servicios" *ngIf="services.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Nuestros servicios</h2>
            <p class="section-subtitle">Soluciones integrales para cada etapa de tu proyecto digital.</p>
            <div class="services-grid">
              <a class="service-card" *ngFor="let s of services.slice(0, 6); trackBy: trackByService" [routerLink]="['/servicios', s.slug]" data-aos="fade-up">
                <span class="service-icon"><i [class]="s.icon || 'bi bi-code-slash'" aria-hidden="true"></i></span>
                <h3 class="service-name">{{ s.name }}</h3>
                <p class="service-desc">{{ s.shortDescription || s.description }}</p>
                <span class="service-link">Ver más <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
              </a>
            </div>
            <div class="section-cta">
              <a class="btn-outline-accent" routerLink="/servicios">Ver todos los servicios</a>
            </div>
          </div>
        </section>

        <!-- NOSOTROS PREVIEW -->
        <section class="section section--alt" id="nosotros" data-aos="fade-up" *ngIf="company">
          <div class="container about-grid">
            <div class="about-text">
              <h2 class="section-title">Sobre {{ companyName }}</h2>
              <p class="about-desc">{{ company.description || company.shortDescription }}</p>
              <div class="about-cards" *ngIf="company.mission || company.vision">
                <div class="about-card" *ngIf="company.mission">
                  <i class="bi bi-bullseye" aria-hidden="true"></i>
                  <div><h4>Misión</h4><p>{{ company.mission }}</p></div>
                </div>
                <div class="about-card" *ngIf="company.vision">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                  <div><h4>Visión</h4><p>{{ company.vision }}</p></div>
                </div>
              </div>
              <a class="btn-gradient" routerLink="/nosotros">Conócenos mejor</a>
            </div>
            <div class="about-highlights" *ngIf="company.foundedYear || company.phone || company.email">
              <div class="highlight-card"><i class="bi bi-flag" aria-hidden="true"></i><span class="h-value">{{ company.foundedYear || '—' }}</span><span class="h-label">Fundación</span></div>
              <div class="highlight-card"><i class="bi bi-briefcase" aria-hidden="true"></i><span class="h-value">{{ stats.projects || '—' }}+</span><span class="h-label">Proyectos entregados</span></div>
              <div class="highlight-card"><i class="bi bi-people" aria-hidden="true"></i><span class="h-value">{{ stats.team || '—' }}</span><span class="h-label">Profesionales</span></div>
            </div>
          </div>
        </section>

        <!-- PROYECTOS DESTACADOS -->
        <section class="section" id="portafolio" *ngIf="featuredProjects.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Proyectos destacados</h2>
            <p class="section-subtitle">Algunos de los trabajos que hemos entregado a nuestros clientes.</p>
            <div class="projects-grid">
              <a class="project-card" *ngFor="let p of featuredProjects; trackBy: trackByProject" [routerLink]="['/proyectos', p.slug]" data-aos="fade-up">
                <div class="project-banner">
                  <img [src]="getPrimaryImage(p) || 'assets/project-placeholder.svg'" [alt]="'Portada de ' + p.title" loading="lazy" />
                  <span class="project-badge" *ngIf="p.isCaseStudy"><i class="bi bi-graph-up-arrow" aria-hidden="true"></i> Caso de éxito</span>
                </div>
                <div class="project-body">
                  <h3 class="project-name">{{ p.title }}</h3>
                  <p class="project-desc">{{ p.summary || p.description }}</p>
                  <div class="project-techs">
                    <span class="project-tech" *ngFor="let t of p.technologies?.slice(0, 3); trackBy: trackByTech">{{ t.name }}</span>
                  </div>
                </div>
              </a>
            </div>
            <div class="section-cta">
              <a class="btn-outline-accent" routerLink="/portafolio">Ver portafolio completo</a>
            </div>
          </div>
        </section>

        <!-- CLIENTES -->
        <section class="section section--alt" id="clientes" *ngIf="clients.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Nuestros clientes</h2>
            <p class="section-subtitle">Empresas que confían en nuestro trabajo.</p>
            <div class="clients-grid">
              <a class="client-card" *ngFor="let c of clients; trackBy: trackByClient" [href]="c.website || null" [attr.target]="c.website ? '_blank' : null" [attr.tabindex]="c.website ? null : -1" [attr.aria-hidden]="!c.website" rel="noopener">
                <img *ngIf="getClientLogo(c)" [src]="getClientLogo(c)" [alt]="c.name" loading="lazy" />
                <span *ngIf="!getClientLogo(c)" class="client-fallback">{{ c.name }}</span>
              </a>
            </div>
          </div>
        </section>

        <!-- TESTIMONIOS -->
        <section class="section" id="testimonios" *ngIf="testimonials.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Testimonios</h2>
            <p class="section-subtitle">Lo que dicen nuestros clientes.</p>
            <div class="testimonials-grid">
              <div class="testimonial-card" *ngFor="let t of testimonials; trackBy: trackByTestimonial" data-aos="fade-up">
                <span class="stars" *ngIf="t.rating" role="img" [attr.aria-label]="t.rating + ' de 5 estrellas'">
                  <i class="bi bi-star-fill" *ngFor="let _ of [].constructor(t.rating); trackBy: trackByStar" aria-hidden="true"></i>
                </span>
                <blockquote class="testimonial-text">"{{ t.content }}"</blockquote>
                <div class="testimonial-author">
                  <span class="author-name">{{ t.authorName }}</span>
                  <span class="author-role">{{ t.authorPosition || t.company || (t.client?.name || '') }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- EQUIPO -->
        <section class="section section--alt" id="equipo" *ngIf="teamMembers.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Nuestro equipo</h2>
            <p class="section-subtitle">Profesionales comprometidos con la excelencia.</p>
            <div class="team-grid">
              <a class="team-card" *ngFor="let m of teamMembers; trackBy: trackByTeam" [routerLink]="['/equipo', m.slug]" data-aos="fade-up">
                <div class="team-avatar">
                  <img *ngIf="m.photoUrl" [src]="resolveAsset(m.photoUrl)" [alt]="m.fullName" loading="lazy" />
                  <i *ngIf="!m.photoUrl" class="bi bi-person-circle" aria-hidden="true"></i>
                </div>
                <h3 class="team-name">{{ m.fullName }}</h3>
                <span class="team-role">{{ m.professionalTitle }}</span>
                <span class="team-location" *ngIf="m.location"><i class="bi bi-geo-alt" aria-hidden="true"></i> {{ m.location }}</span>
              </a>
            </div>
            <div class="section-cta">
              <a class="btn-outline-accent" routerLink="/equipo">Conoce al equipo</a>
            </div>
          </div>
        </section>

        <!-- TECNOLOGÍAS -->
        <section class="section" id="tecnologias" *ngIf="technologies.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Tecnologías</h2>
            <p class="section-subtitle">Stack tecnológico que dominamos.</p>
            <div class="tech-grid">
              <div class="tech-card" *ngFor="let t of technologies; trackBy: trackByTech" data-aos="fade-up">
                <span class="tech-dot" [style.background]="t.color || '#888'"></span>
                <span class="tech-name">{{ t.name }}</span>
                <span class="tech-category">{{ t.category }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- BLOG RECIENTE -->
        <section class="section section--alt" id="blog" *ngIf="recentPosts.length" data-aos="fade-up">
          <div class="container">
            <h2 class="section-title">Últimas publicaciones</h2>
            <p class="section-subtitle">Artículos y novedades de nuestro blog.</p>
            <div class="blog-grid">
              <a class="blog-card" *ngFor="let p of recentPosts; trackBy: trackByPost" [routerLink]="['/blog', p.slug]" data-aos="fade-up">
                <div class="blog-body">
                  <span class="blog-date"><i class="bi bi-calendar3" aria-hidden="true"></i> {{ p.publishedAt | date: "dd 'de' MMM, yyyy" }}</span>
                  <h3 class="blog-title">{{ p.title }}</h3>
                  <p class="blog-excerpt">{{ p.excerpt }}</p>
                </div>
              </a>
            </div>
            <div class="section-cta">
              <a class="btn-outline-accent" routerLink="/blog">Ver el blog</a>
            </div>
          </div>
        </section>

        <!-- CTA CONTACTO -->
        <section class="section cta-banner" data-aos="fade-up">
          <div class="container cta-inner">
            <h2 class="cta-title">¿Listo para impulsar tu proyecto?</h2>
            <p class="cta-text">Hablemos sobre cómo podemos ayudarte a alcanzar tus objetivos.</p>
            <a class="btn-hero primary" routerLink="/contacto">Contáctanos <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .corp-wrapper { min-height: 100vh; background: var(--bg-primary); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .skeleton-wrapper { padding: 120px 24px; }
    .skeleton-hero { max-width: 700px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; gap: 16px; }
    .sk-line { height: 18px; border-radius: 8px; background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    .w-60 { width: 60%; } .w-40 { width: 40%; } .w-80 { width: 80%; } .w-30 { width: 30%; } .w-90 { width: 90%; }
    .skeleton-section { max-width: 1200px; margin: 60px auto; display: flex; flex-direction: column; gap: 14px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .page-error { text-align: center; padding: 120px 24px; color: var(--text-muted); }
    .page-error i { font-size: 3rem; color: var(--accent); margin-bottom: 16px; display: block; }
    .btn-retry { background: var(--accent); color: var(--bg-primary); border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }

    /* HERO */
    .hero { position: relative; min-height: 78vh; display: flex; align-items: center; background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary)); overflow: hidden; padding: 120px 0 80px; }
    .hero-bg { position: absolute; inset: 0; }
    .hero-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.22; }
    .hero-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 40%, transparent 0%, var(--bg-primary) 90%); }
    .hero-content { position: relative; z-index: 2; }
    .hero-eyebrow { display: inline-block; color: var(--accent); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.82rem; margin-bottom: 16px; }
    .hero-title { font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 800; margin: 0 0 16px; line-height: 1.1; }
    .hero-subtitle { font-size: 1.1rem; color: var(--text-secondary); max-width: 640px; line-height: 1.7; margin: 0 0 28px; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 40px; }
    .btn-hero { display: inline-flex; align-items: center; gap: 8px; padding: 13px 28px; border-radius: 12px; font-size: 0.92rem; font-weight: 600; text-decoration: none; border: 1px solid var(--border); color: var(--text-primary); transition: var(--transition); }
    .btn-hero:hover { border-color: var(--accent); transform: translateY(-2px); }
    .btn-hero.primary { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--bg-primary); border: none; }
    .btn-hero.primary:hover { box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.35); }
    .hero-stats { display: flex; flex-wrap: wrap; gap: 40px; }
    .hero-stat { display: flex; flex-direction: column; }
    .stat-value { font-size: 2rem; font-weight: 800; color: var(--accent); }
    .stat-label { font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

    /* SECTIONS */
    .section { padding: 88px 0; }
    .section--alt { background: var(--bg-secondary); }
    .section-title { font-size: 2rem; font-weight: 700; margin: 0 0 8px; }
    .section-subtitle { color: var(--text-secondary); font-size: 0.98rem; margin: 0 0 36px; }
    .section-cta { text-align: center; margin-top: 40px; }

    /* SERVICES */
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .service-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; text-decoration: none; transition: var(--transition); }
    .service-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .service-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 14px; background: rgba(var(--accent-rgb), 0.1); color: var(--accent); font-size: 1.4rem; margin-bottom: 16px; }
    .service-name { font-size: 1.1rem; color: var(--white); margin: 0 0 8px; }
    .service-desc { font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .service-link { font-size: 0.84rem; color: var(--accent); font-weight: 600; }

    /* ABOUT PREVIEW */
    .about-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 48px; align-items: start; }
    .about-desc { color: var(--text-secondary); line-height: 1.8; margin: 0 0 24px; white-space: pre-wrap; }
    .about-cards { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
    .about-card { display: flex; gap: 14px; align-items: flex-start; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
    .about-card i { font-size: 1.3rem; color: var(--accent); margin-top: 2px; }
    .about-card h4 { font-size: 0.95rem; color: var(--white); margin: 0 0 4px; }
    .about-card p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.6; }
    .about-highlights { display: flex; flex-direction: column; gap: 16px; }
    .highlight-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; text-align: center; }
    .highlight-card i { font-size: 1.3rem; color: var(--accent); display: block; margin-bottom: 6px; }
    .h-value { display: block; font-size: 1.6rem; font-weight: 800; color: var(--white); }
    .h-label { font-size: 0.8rem; color: var(--text-muted); }

    /* PROJECTS */
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 22px; }
    .project-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; text-decoration: none; transition: var(--transition); }
    .project-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .project-banner { position: relative; height: 200px; overflow: hidden; background: var(--bg-secondary); }
    .project-banner img { width: 100%; height: 100%; object-fit: cover; }
    .project-badge { position: absolute; top: 12px; right: 12px; background: rgba(var(--accent-rgb), 0.92); color: var(--bg-primary); padding: 4px 12px; border-radius: 20px; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
    .project-body { padding: 20px; }
    .project-name { font-size: 1.05rem; color: var(--white); margin: 0 0 8px; }
    .project-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .project-techs { display: flex; flex-wrap: wrap; gap: 6px; }
    .project-tech { background: rgba(var(--accent-rgb), 0.08); color: var(--accent); padding: 3px 10px; border-radius: 6px; font-size: 0.74rem; }

    /* CLIENTS */
    .clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .client-card { display: flex; align-items: center; justify-content: center; min-height: 100px; padding: 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; text-decoration: none; transition: var(--transition); }
    .client-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .client-card img { max-width: 130px; max-height: 56px; object-fit: contain; filter: grayscale(0.4); opacity: 0.85; transition: var(--transition); }
    .client-card:hover img { filter: grayscale(0); opacity: 1; }
    .client-fallback { font-weight: 700; color: var(--text-secondary); }

    /* TESTIMONIALS */
    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .testimonial-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
    .stars { color: #f59e0b; margin-bottom: 10px; }
    .testimonial-text { font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7; font-style: italic; margin: 0 0 18px; }
    .testimonial-author { display: flex; flex-direction: column; }
    .author-name { font-size: 0.95rem; font-weight: 700; color: var(--white); }
    .author-role { font-size: 0.8rem; color: var(--text-muted); }

    /* TEAM */
    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
    .team-card { display: flex; flex-direction: column; align-items: center; text-align: center; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 28px 20px; text-decoration: none; transition: var(--transition); }
    .team-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .team-avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
    .team-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .team-avatar i { font-size: 2.4rem; color: var(--text-muted); }
    .team-name { font-size: 1rem; font-weight: 700; color: var(--white); margin: 0 0 4px; }
    .team-role { font-size: 0.82rem; color: var(--accent); margin-bottom: 6px; }
    .team-location { font-size: 0.78rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; }

    /* TECHNOLOGIES */
    .tech-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .tech-card { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; transition: var(--transition); }
    .tech-card:hover { border-color: var(--accent); }
    .tech-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .tech-name { font-size: 0.88rem; font-weight: 600; color: var(--white); }
    .tech-category { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

    /* BLOG PREVIEW */
    .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .blog-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; text-decoration: none; transition: var(--transition); overflow: hidden; }
    .blog-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .blog-body { padding: 22px; }
    .blog-date { font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
    .blog-title { font-size: 1.05rem; font-weight: 700; color: var(--white); margin: 0 0 8px; line-height: 1.35; }
    .blog-excerpt { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

    /* CTA */
    .cta-banner { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); }
    .cta-inner { text-align: center; }
    .cta-title { color: var(--bg-primary); font-size: 1.8rem; margin: 0 0 8px; }
    .cta-text { color: var(--bg-primary); opacity: 0.85; margin: 0 0 24px; }
    .cta-inner .btn-hero { background: var(--bg-primary); color: var(--accent); border: none; }

    @media (max-width: 900px) {
      .about-grid { grid-template-columns: 1fr; }
      .hero { min-height: 92vh; padding-top: 100px; }
    }
    @media (max-width: 768px) {
      .section { padding: 60px 0; }
      .hero-stats { gap: 24px; }
    }
  `],
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

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = false;

    const totalCalls = 8;
    let completed = 0;
    const onDone = () => {
      completed++;
      if (completed >= totalCalls) {
        this.loading = false;
        this.initAOS();
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
      error: () => {},
      complete: onDone,
    });
    this.api.getPublicServices().subscribe({
      next: (list) => {
        this.services = (list || []).slice(0, 6);
        this.cdr.markForCheck();
      },
      error: () => {},
      complete: onDone,
    });
    this.api.getPublicClients().subscribe({
      next: (list) => {
        this.clients = list || [];
        this.stats.clients = this.clients.length;
        this.cdr.markForCheck();
      },
      error: () => {},
      complete: onDone,
    });
    this.api.getPublicTestimonials().subscribe({
      next: (list) => {
        this.testimonials = (list || []).slice(0, 3);
        this.cdr.markForCheck();
      },
      error: () => {},
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
        this.featuredProjects = (featured.length ? featured : this.projects).slice(0, 3);
        this.cdr.markForCheck();
      },
      error: () => {},
      complete: onDone,
    });
    this.api.getPublicTeam().subscribe({
      next: (list) => {
        this.teamMembers = (list || []).slice(0, 4);
        this.stats.team = (list || []).length;
        this.cdr.markForCheck();
      },
      error: () => {},
      complete: onDone,
    });
    this.api.getPublicTechnologies().subscribe({
      next: (list) => {
        this.technologies = list || [];
        this.cdr.markForCheck();
      },
      error: () => {},
      complete: onDone,
    });
    this.api.getPublicBlog({ limit: 3 }).subscribe({
      next: (res) => {
        this.recentPosts = (res?.posts || []).slice(0, 3);
        this.cdr.markForCheck();
      },
      error: () => {},
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

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((img: any) => img.isPrimary);
    const url = primary?.url || project.images?.[0]?.url || project.bannerImage || null;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }

  trackByService = (i: number, s: any) => s.id || i;
  trackByProject = (i: number, p: any) => p.id || i;
  trackByClient = (i: number, c: any) => c.id || i;
  trackByTestimonial = (i: number, t: any) => t.id || i;
  trackByTeam = (i: number, m: any) => m.id || m.slug || i;
  trackByTech = (i: number, t: any) => t.id || i;
  trackByPost = (i: number, p: any) => p.id || p.slug || i;
  trackByStar = (i: number) => i;
  trackByServiceFooter = (i: number, s: any) => s.id || i;
}

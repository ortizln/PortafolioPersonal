import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { TeamMember } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div class="page-wrapper">
      <header class="page-hero">
        <div class="container">
          <h1>Nuestro equipo</h1>
          <p>Profesionales comprometidos con la calidad y la innovación.</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>
      <div *ngIf="!loading && !members.length" class="page-empty">No hay miembros publicados aún.</div>

      <section class="container section" *ngIf="!loading && members.length">
        <div class="team-grid">
          <a class="team-card" *ngFor="let m of members" [routerLink]="['/equipo', m.slug]" data-aos="fade-up">
            <div class="team-photo">
              <img [src]="getPhoto(m) || 'assets/avatar-placeholder.svg'" [alt]="m.fullName" loading="lazy" />
            </div>
            <h2 class="team-name">{{ m.fullName }}</h2>
            <span class="team-title">{{ m.professionalTitle }}</span>
            <span class="team-founder" *ngIf="m.isFounder"><i class="bi bi-award" aria-hidden="true"></i> Fundador</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .page-hero { background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary)); border-bottom: 1px solid var(--border); padding: 48px 0; text-align: center; }
    .page-hero h1 { font-size: 2.2rem; margin: 0 0 8px; }
    .page-hero p { color: var(--text-secondary); margin: 0; }
    .page-loading { display: flex; justify-content: center; padding: 100px 0; }
    .page-empty { text-align: center; padding: 100px 24px; color: var(--text-muted); }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .section { padding: 70px 0; }
    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 22px; }
    .team-card { text-align: center; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 26px 20px; text-decoration: none; transition: var(--transition); display: block; }
    .team-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .team-photo { width: 110px; height: 110px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; background: var(--bg-secondary); }
    .team-photo img { width: 100%; height: 100%; object-fit: cover; }
    .team-name { font-size: 1.05rem; color: var(--white); margin: 0 0 4px; }
    .team-title { font-size: 0.82rem; color: var(--text-secondary); }
    .team-founder { display: block; margin-top: 10px; font-size: 0.74rem; color: var(--accent); }
  `],
})
export class TeamPageComponent implements OnInit {
  private api = inject(ApiService);
  private seoService = inject(SeoService);
  members: TeamMember[] = [];
  loading = true;

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'Equipo | ALANTEK',
      description: 'Conoce al equipo de profesionales de ALANTEK.',
      canonical: this.seoService.canonicalUrl('/equipo'),
      robots: 'index,follow',
    });
    this.api.getPublicTeam().subscribe({
      next: (list) => {
        this.members = list || [];
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => { this.loading = false; },
    });
  }

  getPhoto(m: TeamMember): string | null {
    if (!m.photoUrl) return null;
    if (m.photoUrl.startsWith('http://') || m.photoUrl.startsWith('https://') || m.photoUrl.startsWith('data:')) return m.photoUrl;
    return `${environment.uploadUrl}/${m.photoUrl}`;
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }
}

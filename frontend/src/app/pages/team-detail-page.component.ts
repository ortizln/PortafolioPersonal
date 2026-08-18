import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { SeoService } from '../core/services/seo.service';
import { TeamMember } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-team-detail-page',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  template: `
    <div class="page-wrapper">
      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && error" class="page-error">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No se encontró al integrante del equipo.</p>
        <a routerLink="/equipo" class="btn-retry">Volver al equipo</a>
      </div>

      <ng-container *ngIf="!loading && !error && member">
        <header class="profile-hero">
          <div class="container hero-inner">
            <div class="avatar-wrap">
              <img [src]="getPhoto() || 'assets/avatar-placeholder.svg'" [alt]="member.fullName" loading="lazy" decoding="async" />
            </div>
            <div class="hero-info">
              <a routerLink="/equipo" class="back-link">&larr; Volver al equipo</a>
              <h1>{{ member.fullName }}</h1>
              <p class="member-title">{{ member.professionalTitle }}</p>
              <div class="member-meta" *ngIf="member.location || member.email || member.phone">
                <span *ngIf="member.location"><i class="bi bi-geo-alt" aria-hidden="true"></i> {{ member.location }}</span>
                <span *ngIf="member.email"><i class="bi bi-envelope" aria-hidden="true"></i> {{ member.email }}</span>
                <span *ngIf="member.phone"><i class="bi bi-telephone" aria-hidden="true"></i> {{ member.phone }}</span>
              </div>
              <div class="member-social" *ngIf="member.linkedinUrl || member.githubUrl || member.twitterUrl">
                <a *ngIf="member.linkedinUrl" [href]="member.linkedinUrl" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="bi bi-linkedin" aria-hidden="true"></i></a>
                <a *ngIf="member.githubUrl" [href]="member.githubUrl" target="_blank" rel="noopener" aria-label="GitHub"><i class="bi bi-github" aria-hidden="true"></i></a>
                <a *ngIf="member.twitterUrl" [href]="member.twitterUrl" target="_blank" rel="noopener" aria-label="Twitter"><i class="bi bi-twitter-x" aria-hidden="true"></i></a>
              </div>
            </div>
          </div>
        </header>

        <div class="container content">
          <section class="section-block" *ngIf="member.about || member.bio">
            <h2>Sobre mí</h2>
            <p class="text">{{ member.about || member.bio }}</p>
          </section>

          <section class="section-block" *ngIf="member.experiences?.length">
            <h2>Experiencia</h2>
            <div class="list-block" *ngFor="let e of member.experiences">
              <h3>{{ e.position }}</h3>
              <span class="org">{{ e.company }}</span>
              <span class="date">{{ e.startDate | date:'MMM yyyy' }} - {{ e.current ? 'Actualidad' : (e.endDate | date:'MMM yyyy') }}</span>
              <p *ngIf="e.description">{{ e.description }}</p>
            </div>
          </section>

          <section class="section-block" *ngIf="member.educations?.length">
            <h2>Educación</h2>
            <div class="list-block" *ngFor="let ed of member.educations">
              <h3>{{ ed.degree }}</h3>
              <span class="org">{{ ed.institution }}</span>
              <span class="date">{{ ed.startDate | date:'yyyy' }} - {{ ed.endDate ? (ed.endDate | date:'yyyy') : 'Actualidad' }}</span>
            </div>
          </section>

          <section class="section-block" *ngIf="member.certifications?.length">
            <h2>Certificaciones</h2>
            <div class="cert-grid">
              <div class="cert-card" *ngFor="let c of member.certifications">
                <i class="bi bi-patch-check-fill" aria-hidden="true"></i>
                <span class="cert-name">{{ c.name }}</span>
                <span class="cert-org">{{ c.issuer }}</span>
              </div>
            </div>
          </section>

          <section class="section-block" *ngIf="member.skills?.length">
            <h2>Habilidades</h2>
            <div class="chips">
              <span class="chip" *ngFor="let s of member.skills">{{ s.name }}</span>
            </div>
          </section>

          <section class="section-block" *ngIf="member.languages?.length">
            <h2>Idiomas</h2>
            <div class="languages">
              <div class="language" *ngFor="let l of member.languages">
                <span class="lang-name">{{ l.name }}</span>
                <div class="lang-bar"><div class="lang-fill" [style.width.%]="l.percentage"></div></div>
                <span class="lang-level">{{ l.level }}</span>
              </div>
            </div>
          </section>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; padding-top: 80px; background: var(--bg-primary); }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
    .page-loading { display: flex; justify-content: center; padding: 100px 0; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-error { text-align: center; padding: 100px 24px; color: var(--text-muted); }
    .page-error i { font-size: 3rem; color: var(--accent); margin-bottom: 16px; display: block; }
    .btn-retry { background: var(--accent); color: var(--bg-primary); border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; margin-top: 12px; }
    .profile-hero { background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary)); border-bottom: 1px solid var(--border); padding: 48px 0; }
    .hero-inner { display: flex; gap: 32px; align-items: center; }
    .avatar-wrap { width: 160px; height: 160px; border-radius: 50%; overflow: hidden; background: var(--bg-card); border: 3px solid var(--accent); flex-shrink: 0; }
    .avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .back-link { color: var(--accent); font-size: 0.82rem; text-decoration: none; display: inline-block; margin-bottom: 12px; }
    .hero-info h1 { font-size: 2rem; margin: 0 0 6px; }
    .member-title { color: var(--accent); font-size: 1.05rem; margin: 0 0 14px; }
    .member-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px; }
    .member-meta span { display: inline-flex; align-items: center; gap: 6px; }
    .member-social { display: flex; gap: 8px; }
    .member-social a { width: 38px; height: 38px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; text-decoration: none; transition: var(--transition); }
    .member-social a:hover { color: var(--accent); border-color: var(--accent); }
    .content { padding: 48px 24px; display: flex; flex-direction: column; gap: 40px; }
    .section-block h2 { font-size: 1.3rem; color: var(--white); margin: 0 0 18px; padding-left: 14px; border-left: 3px solid var(--accent); }
    .text { color: var(--text-secondary); line-height: 1.8; white-space: pre-wrap; margin: 0; }
    .list-block { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin-bottom: 12px; }
    .list-block h3 { font-size: 1rem; color: var(--white); margin: 0 0 4px; }
    .list-block .org { display: block; color: var(--accent); font-size: 0.88rem; }
    .list-block .date { display: block; color: var(--text-muted); font-size: 0.78rem; margin: 4px 0 8px; }
    .list-block p { color: var(--text-secondary); font-size: 0.88rem; margin: 0; line-height: 1.7; }
    .cert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .cert-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
    .cert-card i { color: var(--accent); font-size: 1.2rem; margin-bottom: 8px; }
    .cert-name { display: block; color: var(--white); font-size: 0.9rem; font-weight: 600; }
    .cert-org { display: block; color: var(--text-muted); font-size: 0.78rem; margin-top: 2px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { background: rgba(var(--accent-rgb), 0.08); color: var(--accent); padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; }
    .languages { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .language { display: flex; flex-direction: column; gap: 6px; }
    .lang-name { color: var(--white); font-size: 0.9rem; font-weight: 600; }
    .lang-bar { height: 6px; border-radius: 4px; background: var(--bg-card); overflow: hidden; }
    .lang-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-secondary)); border-radius: 4px; }
    .lang-level { color: var(--text-muted); font-size: 0.78rem; }
    @media (max-width: 640px) { .hero-inner { flex-direction: column; text-align: center; } .member-meta, .member-social { justify-content: center; } }
  `],
})
export class TeamDetailPageComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private seoService = inject(SeoService);

  member: TeamMember | null = null;
  loading = true;
  error = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) {
        this.error = true;
        this.loading = false;
        return;
      }
      this.loading = true;
      this.error = false;
      this.api.getPublicTeamMember(slug).subscribe({
        next: (m) => {
          this.member = m;
          this.loading = false;
          this.seoService.setSeo({
            title: `${m.fullName} | Equipo ALANTEK`,
            description: m.professionalTitle || `Conoce a ${m.fullName}, miembro del equipo de ALANTEK.`,
            canonical: this.seoService.canonicalUrl(`/equipo/${slug}`),
            robots: 'index,follow',
          });
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
    });
  }

  getPhoto(): string | null {
    const url = this.member?.photoUrl;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }
}

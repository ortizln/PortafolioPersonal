import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Client } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div class="page-wrapper">
      <header class="page-hero">
        <div class="container">
          <h1>Clientes</h1>
          <p>Empresas que confían en nuestro trabajo.</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>
      <div *ngIf="!loading && !clients.length" class="page-empty">Aún no hay clientes publicados.</div>

      <section class="container section" *ngIf="!loading && clients.length">
        <div class="clients-grid">
          <a class="client-card" *ngFor="let c of clients" [href]="c.website || null" [attr.target]="c.website ? '_blank' : null" [attr.tabindex]="c.website ? null : -1" [attr.aria-hidden]="!c.website" rel="noopener" data-aos="fade-up">
            <img *ngIf="getLogo(c)" [src]="getLogo(c)" [alt]="c.name" loading="lazy" />
            <span *ngIf="!getLogo(c)" class="client-fallback">{{ c.name }}</span>
            <span class="client-industry" *ngIf="c.industry">{{ c.industry }}</span>
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
    .clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 18px; }
    .client-card { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 130px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; text-decoration: none; transition: var(--transition); }
    .client-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .client-card img { max-width: 150px; max-height: 60px; object-fit: contain; filter: grayscale(0.4); opacity: 0.85; transition: var(--transition); }
    .client-card:hover img { filter: grayscale(0); opacity: 1; }
    .client-fallback { font-weight: 700; color: var(--text-secondary); }
    .client-industry { margin-top: 10px; font-size: 0.76rem; color: var(--text-muted); }
  `],
})
export class ClientesPageComponent implements OnInit {
  private api = inject(ApiService);
  clients: Client[] = [];
  loading = true;

  ngOnInit(): void {
    this.api.getPublicClients().subscribe({
      next: (list) => {
        this.clients = list || [];
        this.loading = false;
        setTimeout(() => this.initAOS(), 100);
      },
      error: () => { this.loading = false; },
    });
  }

  getLogo(c: Client): string | null {
    if (!c.logoUrl) return null;
    if (c.logoUrl.startsWith('http://') || c.logoUrl.startsWith('https://') || c.logoUrl.startsWith('data:')) return c.logoUrl;
    return `${environment.uploadUrl}/${c.logoUrl}`;
  }

  private initAOS(): void {
    const aos = (window as any).AOS;
    if (aos) aos.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Client } from '../core/models';
import { environment } from '../../environments/environment';
import { ScrollRevealDirective } from '../core/directives/scroll-reveal.directive';
import { ContactCtaComponent } from '../shared/components/contact-cta.component';

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [NgIf, NgFor, ScrollRevealDirective, ContactCtaComponent],
  template: `
    <div class="page-wrapper">
      <header class="page-hero page-hero--center">
        <div class="container-alantek">
          <span class="eyebrow">Confianza</span>
          <h1 class="page-title">Clientes</h1>
          <p class="page-subtitle">Empresas que confían en nuestro trabajo.</p>
        </div>
      </header>

      <div *ngIf="loading" class="page-loading"><div class="spinner"></div></div>
      <div *ngIf="error" class="page-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <p>No pudimos cargar la información. Intenta de nuevo.</p>
        <button class="btn-retry" (click)="retry()" aria-label="Reintentar">Reintentar</button>
      </div>
      <div *ngIf="!loading && !error && !clients.length" class="page-empty">Aún no hay clientes publicados.</div>

      <section class="page-section" *ngIf="!loading && !error && clients.length">
        <div class="container-alantek">
          <div class="grid-clients">
            <a
              class="client-card"
              *ngFor="let c of clients; trackBy: trackByClient"
              [href]="c.website || null"
              [attr.target]="c.website ? '_blank' : null"
              [attr.tabindex]="c.website ? null : -1"
              [attr.aria-label]="c.name"
              rel="noopener"
              appScrollReveal
            >
              <img *ngIf="getLogo(c)" [src]="getLogo(c)" [alt]="c.name" loading="lazy" />
              <span *ngIf="!getLogo(c)" class="client-fallback">{{ c.name }}</span>
              <span class="client-industry" *ngIf="c.industry">{{ c.industry }}</span>
            </a>
          </div>
        </div>
      </section>

      <app-contact-cta
        eyebrow="Empecemos"
        title="¿Trabajamos juntos?"
        text="Suma tu empresa a las organizaciones que ya confían en ALANTEK."
      ></app-contact-cta>
    </div>
  `,
  styles: [`
    .client-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 130px;
      padding: var(--space-5);
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: all var(--duration-base) var(--ease-out);

      &:hover {
        border-color: var(--border-accent);
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
      }

      img {
        max-width: 150px;
        max-height: 60px;
        object-fit: contain;
        filter: grayscale(0.4);
        opacity: 0.85;
        transition: all var(--duration-base) var(--ease-out);
      }

      &:hover img {
        filter: grayscale(0);
        opacity: 1;
      }
    }
    .client-fallback {
      font-family: var(--font-heading);
      font-weight: var(--fw-bold);
      color: var(--text-secondary);
    }
    .client-industry {
      margin-top: var(--space-2);
      font-size: var(--fs-xs);
      color: var(--text-muted);
    }
  `],
})
export class ClientesPageComponent implements OnInit {
  private api = inject(ApiService);
  clients: Client[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = false;
    this.api.getPublicClients().subscribe({
      next: (list) => {
        this.clients = list || [];
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  getLogo(c: Client): string | null {
    if (!c.logoUrl) return null;
    if (c.logoUrl.startsWith('http://') || c.logoUrl.startsWith('https://') || c.logoUrl.startsWith('data:')) return c.logoUrl;
    return `${environment.uploadUrl}/${c.logoUrl}`;
  }

  retry(): void {
    this.loadClients();
  }

  trackByClient = (i: number, c: any) => c.id || i;
}

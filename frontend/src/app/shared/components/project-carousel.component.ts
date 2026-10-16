import { Component, ChangeDetectionStrategy, Input, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-project-carousel',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="carousel" role="region" aria-roledescription="carrusel" aria-label="Proyectos destacados">
      <div class="carousel-controls" *ngIf="projects.length > 1">
        <button
          class="carousel-btn"
          type="button"
          (click)="prev()"
          aria-label="Proyecto anterior"
          [disabled]="!canScroll"
        >
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <button
          class="carousel-btn"
          type="button"
          (click)="next()"
          aria-label="Proyecto siguiente"
          [disabled]="!canScroll"
        >
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>

      <div
        #track
        class="carousel-track"
        (scroll)="onScroll()"
        tabindex="0"
        (keydown)="onKeydown($event)"
        aria-label="Lista de proyectos, usa las flechas para navegar"
      >
        <a
          class="card-project carousel-item"
          *ngFor="let p of projects; trackBy: trackById"
          [routerLink]="['/proyectos', p.slug]"
        >
          <img
            class="project-image"
            [src]="getPrimaryImage(p) || 'assets/project-placeholder.svg'"
            [alt]="'Portada de ' + p.title"
            loading="lazy"
            decoding="async"
          />
          <div class="project-body">
            <span class="project-category" *ngIf="p.categories?.length">{{ p.categories[0].name }}</span>
            <h3>{{ p.title }}</h3>
            <p class="project-summary">{{ p.summary || p.description }}</p>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .carousel {
      position: relative;
    }
    .carousel-track {
      display: flex;
      gap: var(--space-5);
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      padding: var(--space-2) var(--space-1) var(--space-5);
      scrollbar-width: none;
    }
    .carousel-track::-webkit-scrollbar {
      display: none;
    }
    .carousel-track:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
      border-radius: var(--radius-lg);
    }
    .carousel-item {
      flex: 0 0 min(360px, 82vw);
      scroll-snap-align: start;
    }
    .project-summary {
      font-size: var(--fs-sm);
      color: var(--text-secondary);
      line-height: var(--lh-normal);
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .carousel-controls {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }
    .carousel-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-base) var(--ease-out);
    }
    .carousel-btn:hover:not(:disabled) {
      color: var(--accent);
      border-color: var(--accent);
      box-shadow: var(--shadow-glow);
    }
    .carousel-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .carousel-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `],
})
export class ProjectCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() projects: Project[] = [];
  @ViewChild('track') trackRef?: ElementRef<HTMLDivElement>;

  canScroll = false;
  private resizeObs?: ResizeObserver;

  ngAfterViewInit(): void {
    const track = this.trackRef?.nativeElement;
    if (!track || typeof ResizeObserver === 'undefined') {
      this.canScroll = this.projects.length > 1;
      return;
    }
    this.resizeObs = new ResizeObserver(() => {
      this.canScroll = track.scrollWidth > track.clientWidth + 4;
    });
    this.resizeObs.observe(track);
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
  }

  next(): void {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.85, behavior: 'smooth' });
  }

  prev(): void {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    track.scrollBy({ left: -track.clientWidth * 0.85, behavior: 'smooth' });
  }

  onScroll(): void {}

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((img: any) => img.isPrimary);
    const url = primary?.url || project.images?.[0]?.url || project.bannerImage || null;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  trackById = (i: number, p: any) => p.id || i;
}

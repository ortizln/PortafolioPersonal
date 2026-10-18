import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Testimonial } from '../../core/models';
import { environment } from '../../../environments/environment';
import { AvatarComponent } from './avatar.component';

@Component({
  selector: 'app-testimonial-carousel',
  standalone: true,
  imports: [NgFor, NgIf, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="carousel" role="region" aria-roledescription="carrusel" aria-label="Testimonios">
      <div #track class="carousel-track" tabindex="0">
        <figure
          class="card-testimonial carousel-item"
          *ngFor="let t of testimonials; trackBy: trackById"
        >
          <span class="testimonial-quote" aria-hidden="true">&ldquo;</span>
          <div class="testimonial-stars" *ngIf="t.rating" [attr.aria-label]="t.rating + ' de 5 estrellas'">
            <i class="bi bi-star-fill" *ngFor="let s of stars(t.rating)" aria-hidden="true"></i>
          </div>
          <blockquote class="testimonial-text">{{ t.content }}</blockquote>
          <figcaption class="testimonial-author">
            <app-avatar class="author-avatar" [src]="resolvePhoto(t.photoUrl)" [name]="t.authorName" [size]="48"></app-avatar>
            <span class="author-info">
              <strong>{{ t.authorName }}</strong>
              <span>{{ t.authorPosition || t.company || (t.client?.name || '') }}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  `,
  styles: [`
    .carousel-track {
      display: flex;
      gap: var(--space-5);
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      padding: var(--space-2) var(--space-1) var(--space-5);
      scrollbar-width: none;
    }
    .carousel-track::-webkit-scrollbar { display: none; }
    .carousel-track:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
      border-radius: var(--radius-lg);
    }
    .carousel-item {
      flex: 0 0 min(380px, 84vw);
      scroll-snap-align: start;
      margin: 0;
    }
    .testimonial-text {
      font-style: normal;
      margin: 0 0 var(--space-5);
    }
  `],
})
export class TestimonialCarouselComponent {
  @Input() testimonials: Testimonial[] = [];

  stars(rating: number | undefined): number[] {
    return Array.from({ length: rating || 0 });
  }

  resolvePhoto(url?: string): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${environment.uploadUrl}/${url}`;
  }

  trackById = (i: number, t: any) => t.id || i;
}

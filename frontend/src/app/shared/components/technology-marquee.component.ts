import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { Technology } from '../../core/models';

@Component({
  selector: 'app-technology-marquee',
  standalone: true,
  imports: [NgFor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="marquee" role="region" aria-label="Tecnologías">
      <div class="alantek-marquee-track" [style.--marquee-duration]="duration">
        <ng-container *ngFor="let pass of [0, 1]">
          <span
            class="marquee-item"
            *ngFor="let t of technologies; trackBy: trackById"
            [attr.aria-hidden]="pass === 1"
          >
            <span class="tech-dot" [style.background]="t.color || 'var(--accent)'"></span>
            <span class="tech-name">{{ t.name }}</span>
            <span class="tech-cat">{{ t.category }}</span>
          </span>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .marquee {
      overflow: hidden;
      position: relative;
      padding: var(--space-4) 0;
      mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    }
    .marquee-item {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      margin: 0 var(--space-2);
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      white-space: nowrap;
      transition: border-color var(--duration-base) var(--ease-out);
    }
    .marquee-item:hover {
      border-color: var(--accent);
    }
    .tech-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .tech-name {
      font-size: var(--fs-sm);
      font-weight: var(--fw-semibold);
      color: var(--text-primary);
    }
    .tech-cat {
      font-size: var(--fs-xs);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: var(--ls-wide);
    }
  `],
})
export class TechnologyMarqueeComponent {
  @Input() technologies: Technology[] = [];
  @Input() duration = '42s';

  trackById = (i: number, t: any) => t.id || i;
}

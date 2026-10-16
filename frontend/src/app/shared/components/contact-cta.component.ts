import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-contact-cta',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="cta" appScrollReveal>
      <div class="cta-glow" aria-hidden="true"></div>
      <div class="cta-inner">
        <span class="cta-eyebrow">{{ eyebrow }}</span>
        <h2 class="cta-title">{{ title }}</h2>
        <p class="cta-text">{{ text }}</p>
        <div class="cta-actions">
          <a class="btn-alantek btn-alantek-accent" routerLink="/contacto">
            {{ ctaLabel }} <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cta {
      position: relative;
      overflow: hidden;
      background: var(--gradient-brand);
      padding: var(--space-10) var(--space-5);
      text-align: center;
    }
    .cta-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 120%, rgba(228, 161, 108, 0.25), transparent 60%);
      pointer-events: none;
    }
    .cta-inner {
      position: relative;
      max-width: 720px;
      margin: 0 auto;
    }
    .cta-eyebrow {
      display: inline-block;
      font-size: var(--fs-xs);
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: var(--ls-wider);
      color: var(--alantek-accent-light);
      margin-bottom: var(--space-3);
    }
    .cta-title {
      font-family: var(--font-heading);
      font-size: var(--fs-4xl);
      font-weight: var(--fw-bold);
      color: #F7F7F2;
      margin: 0 0 var(--space-3);
      line-height: var(--lh-tight);
    }
    .cta-text {
      font-size: var(--fs-lg);
      color: rgba(247, 247, 242, 0.82);
      margin: 0 0 var(--space-6);
      line-height: var(--lh-normal);
    }
    .cta-actions {
      display: flex;
      justify-content: center;
      gap: var(--space-3);
    }
  `],
})
export class ContactCtaComponent {
  @Input() eyebrow = 'Empecemos';
  @Input() title = '¿Listo para impulsar tu proyecto?';
  @Input() text = 'Hablemos sobre cómo podemos ayudarte a alcanzar tus objetivos.';
  @Input() ctaLabel = 'Contáctanos';
}

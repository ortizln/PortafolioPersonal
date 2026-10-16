import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Service } from '../../core/models';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card-service" [routerLink]="['/servicios', service.slug]" appScrollReveal>
      <span class="service-icon">
        <i [class]="service.icon || 'bi bi-code-slash'" aria-hidden="true"></i>
      </span>
      <h3>{{ service.name }}</h3>
      <p>{{ service.shortDescription || service.description }}</p>
      <span class="service-link">Ver más <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
    </a>
  `,
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: Service;
}

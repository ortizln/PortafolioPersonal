import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() appScrollReveal: 'up' | 'left' | 'right' | 'scale' | 'fade' = 'up';
  @Input() revealDelay = 0;

  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const host = this.el.nativeElement;

    if (typeof IntersectionObserver === 'undefined' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    host.classList.add('reveal');
    if (this.appScrollReveal !== 'up') {
      host.classList.add(`reveal-${this.appScrollReveal}`);
    }
    if (this.revealDelay) {
      host.style.transitionDelay = `${this.revealDelay}ms`;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            host.classList.add('reveal-visible');
            this.observer?.unobserve(host);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.observer.observe(host);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

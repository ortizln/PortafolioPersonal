import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, NgZone, inject } from '@angular/core';

interface Dot {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
}

@Component({
  selector: 'app-particle-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="particle-canvas" aria-hidden="true"></canvas>`,
  styles: [`
    .particle-canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.5;
    }
    :host-context([data-theme='dark']) .particle-canvas,
    :host-context([data-bs-theme='dark']) .particle-canvas {
      opacity: 0.65;
    }
    @media (prefers-reduced-motion: reduce) {
      .particle-canvas { display: none; }
    }
  `],
})
export class ParticleBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx?: CanvasRenderingContext2D;
  private dots: Dot[] = [];
  private rafId = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private running = false;
  private ngZone = inject(NgZone);
  private readonly onVis = () => this.handleVisibility();
  private readonly onResize = () => this.resize();

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.ngZone.runOutsideAngular(() => {
      this.setup();
      document.addEventListener('visibilitychange', this.onVis);
      window.addEventListener('resize', this.onResize);
      this.running = !document.hidden;
      if (this.running) this.loop();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    document.removeEventListener('visibilitychange', this.onVis);
    window.removeEventListener('resize', this.onResize);
  }

  private setup(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d') || undefined;
    this.resize();
    this.spawn();
  }

  private resize(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    if (this.ctx) this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private spawn(): void {
    const area = this.width * this.height;
    const count = Math.min(70, Math.round(area / 26000));
    this.dots = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      a: Math.random() * 0.4 + 0.15,
    }));
  }

  private handleVisibility(): void {
    if (document.hidden) {
      this.running = false;
      cancelAnimationFrame(this.rafId);
    } else if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  private loop = (): void => {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const copper = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-rgb').trim() || '228, 161, 108';

    for (const d of this.dots) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0) d.x = this.width;
      if (d.x > this.width) d.x = 0;
      if (d.y < 0) d.y = this.height;
      if (d.y > this.height) d.y = 0;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${copper}, ${d.a})`;
      ctx.fill();
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}

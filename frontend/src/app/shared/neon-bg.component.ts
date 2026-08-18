import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-neon-bg',
  standalone: true,
  template: `<canvas #canvas class="neon-canvas" aria-hidden="true"></canvas>`,
  styles: [`
    :host { display: block; position: fixed; inset: 0; z-index: 0; pointer-events: none; }
    .neon-canvas { width: 100%; height: 100%; }
  `]
})
export class NeonBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animId = 0;
  private stars: { x: number; y: number; r: number; a: number; speed: number; phase: number }[] = [];
  private lines: { x1: number; y1: number; x2: number; y2: number; speed: number; opacity: number; hue: number }[] = [];
  private w = 0;
  private h = 0;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initStars(120);
    this.initLines(18);
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    this.w = canvas.width = window.innerWidth;
    this.h = canvas.height = window.innerHeight;
  }

  private initStars(count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: Math.random() * 1.8 + 0.3,
        a: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initLines(count: number): void {
    this.lines = [];
    for (let i = 0; i < count; i++) {
      this.lines.push({
        x1: Math.random() * this.w,
        y1: Math.random() * this.h,
        x2: Math.random() * this.w,
        y2: Math.random() * this.h,
        speed: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.18 + 0.04,
        hue: Math.random() > 0.5 ? 180 : 260,
      });
    }
  }

  private animate(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const time = Date.now() * 0.001;

    for (const line of this.lines) {
      line.x1 += line.speed;
      line.x2 += line.speed * 0.7;
      line.y1 += Math.sin(time + line.hue) * 0.15;
      line.y2 += Math.cos(time + line.hue) * 0.15;

      if (line.x1 > this.w + 100) { line.x1 = -100; line.y1 = Math.random() * this.h; }
      if (line.x2 > this.w + 100) { line.x2 = -100; line.y2 = Math.random() * this.h; }
      if (line.x1 < -100) { line.x1 = this.w + 100; }
      if (line.x2 < -100) { line.x2 = this.w + 100; }

      const alpha = isDark ? line.opacity : line.opacity * 0.3;
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.strokeStyle = `hsla(${line.hue}, 80%, 65%, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = `hsla(${line.hue}, 90%, 60%, ${alpha * 1.5})`;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (const star of this.stars) {
      star.phase += star.speed;
      const twinkle = (Math.sin(star.phase) + 1) / 2;
      const alpha = star.a * (0.3 + twinkle * 0.7);
      const color = isDark
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(100, 116, 139, ${alpha * 0.4})`;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isDark && star.r > 1.2) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140, 180, 255, ${alpha * 0.08})`;
        ctx.fill();
      }
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

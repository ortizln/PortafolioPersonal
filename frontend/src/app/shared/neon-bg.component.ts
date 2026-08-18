import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Star {
  x: number; y: number; r: number; a: number; speed: number; phase: number;
  baseX: number; baseY: number;
}

interface NeonLine {
  x1: number; y1: number; x2: number; y2: number;
  vx1: number; vy1: number; vx2: number; vy2: number;
  opacity: number; hue: number; width: number;
  curvX: number; curvY: number;
}

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
  private stars: Star[] = [];
  private lines: NeonLine[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; life: number; hue: number; r: number }[] = [];
  private w = 0;
  private h = 0;
  private mouse = { x: -9999, y: -9999, active: false };
  private platformId = inject(PLATFORM_ID);
  private boundMouseMove!: (e: MouseEvent) => void;
  private boundMouseLeave!: () => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindMouse();
    this.initStars(100);
    this.initLines(20);
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseleave', this.boundMouseLeave);
  }

  private bindMouse(): void {
    this.boundMouseMove = (e: MouseEvent) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    };
    this.boundMouseLeave = () => {
      this.mouse.active = false;
    };
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseleave', this.boundMouseLeave);
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    this.w = canvas.width = window.innerWidth;
    this.h = canvas.height = window.innerHeight;
  }

  private initStars(count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.w;
      const y = Math.random() * this.h;
      this.stars.push({
        x, y, baseX: x, baseY: y,
        r: Math.random() * 2 + 0.4,
        a: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.025 + 0.008,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initLines(count: number): void {
    this.lines = [];
    for (let i = 0; i < count; i++) {
      const x1 = Math.random() * this.w;
      const y1 = Math.random() * this.h;
      const x2 = x1 + (Math.random() - 0.5) * 400;
      const y2 = y1 + (Math.random() - 0.5) * 300;
      this.lines.push({
        x1, y1, x2, y2,
        vx1: (Math.random() - 0.5) * 0.6,
        vy1: (Math.random() - 0.5) * 0.3,
        vx2: (Math.random() - 0.5) * 0.6,
        vy2: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.25 + 0.06,
        hue: Math.random() > 0.4 ? 180 : Math.random() > 0.5 ? 260 : 220,
        width: Math.random() * 1.2 + 0.4,
        curvX: 0,
        curvY: 0,
      });
    }
  }

  private spawnParticle(x: number, y: number, hue: number): void {
    if (this.particles.length > 60) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    this.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      hue,
      r: Math.random() * 2 + 1,
    });
  }

  private animate(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const time = Date.now() * 0.001;
    const mx = this.mouse.x;
    const my = this.mouse.y;
    const mouseActive = this.mouse.active;
    const mouseRadius = 250;

    // ── CURSOR GLOW ──
    if (mouseActive && isDark) {
      const grd = ctx.createRadialGradient(mx, my, 0, mx, my, mouseRadius);
      grd.addColorStop(0, 'rgba(34, 211, 238, 0.06)');
      grd.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(mx - mouseRadius, my - mouseRadius, mouseRadius * 2, mouseRadius * 2);
    }

    // ── NEON LINES (mouse-reactive) ──
    for (const line of this.lines) {
      // Base movement
      line.x1 += line.vx1;
      line.y1 += line.vy1;
      line.x2 += line.vx2;
      line.y2 += line.vy2;

      // Mouse attraction/repulsion
      if (mouseActive) {
        const midX = (line.x1 + line.x2) / 2;
        const midY = (line.y1 + line.y2) / 2;
        const dx = mx - midX;
        const dy = my - midY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius * 2) {
          const force = (1 - dist / (mouseRadius * 2)) * 0.8;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Endpoints get pulled toward cursor
          line.vx1 += nx * force * 0.15;
          line.vy1 += ny * force * 0.15;
          line.vx2 += nx * force * 0.12;
          line.vy2 += ny * force * 0.12;

          // Curve bends toward cursor
          line.curvX += nx * force * 2;
          line.curvY += ny * force * 2;

          // Spawn particles near cursor
          if (Math.random() < force * 0.3) {
            this.spawnParticle(mx + (Math.random() - 0.5) * 40, my + (Math.random() - 0.5) * 40, line.hue);
          }
        }
      }

      // Friction
      line.vx1 *= 0.985;
      line.vy1 *= 0.985;
      line.vx2 *= 0.985;
      line.vy2 *= 0.985;
      line.curvX *= 0.96;
      line.curvY *= 0.96;

      // Natural drift
      line.vx1 += (Math.random() - 0.5) * 0.02;
      line.vy1 += (Math.random() - 0.5) * 0.02;
      line.vx2 += (Math.random() - 0.5) * 0.02;
      line.vy2 += (Math.random() - 0.5) * 0.02;

      // Wrap around
      if (line.x1 > this.w + 150) { line.x1 = -150; line.y1 = Math.random() * this.h; line.vx1 = Math.abs(line.vx1); }
      if (line.x1 < -150) { line.x1 = this.w + 150; line.y1 = Math.random() * this.h; line.vx1 = -Math.abs(line.vx1); }
      if (line.y1 > this.h + 150) { line.y1 = -150; }
      if (line.y1 < -150) { line.y1 = this.h + 150; }
      if (line.x2 > this.w + 150) { line.x2 = -150; line.y2 = Math.random() * this.h; line.vx2 = Math.abs(line.vx2); }
      if (line.x2 < -150) { line.x2 = this.w + 150; line.y2 = Math.random() * this.h; line.vx2 = -Math.abs(line.vx2); }
      if (line.y2 > this.h + 150) { line.y2 = -150; }
      if (line.y2 < -150) { line.y2 = this.h + 150; }

      // Draw curved neon line
      const cpx = (line.x1 + line.x2) / 2 + line.curvX + Math.sin(time * 0.5 + line.hue) * 30;
      const cpy = (line.y1 + line.y2) / 2 + line.curvY + Math.cos(time * 0.5 + line.hue) * 30;

      const alpha = isDark ? line.opacity : line.opacity * 0.25;

      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.quadraticCurveTo(cpx, cpy, line.x2, line.y2);
      ctx.strokeStyle = `hsla(${line.hue}, 85%, 65%, ${alpha})`;
      ctx.lineWidth = line.width;
      ctx.shadowColor = `hsla(${line.hue}, 90%, 60%, ${alpha * 2})`;
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Thinner bright inner line
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.quadraticCurveTo(cpx, cpy, line.x2, line.y2);
      ctx.strokeStyle = `hsla(${line.hue}, 90%, 80%, ${alpha * 0.6})`;
      ctx.lineWidth = line.width * 0.4;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ── PARTICLES ──
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= 0.015;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const a = p.life * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${a})`;
      ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${a})`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ── STARS (twinkle + mouse push) ──
    for (const star of this.stars) {
      star.phase += star.speed;

      // Mouse push
      if (mouseActive) {
        const dx = star.x - mx;
        const dy = star.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          star.x += (dx / (dist || 1)) * force * 1.2;
          star.y += (dy / (dist || 1)) * force * 1.2;
        }
      }

      // Drift back toward base position
      star.x += (star.baseX - star.x) * 0.003;
      star.y += (star.baseY - star.y) * 0.003;
      // Slow base drift
      star.baseX += Math.sin(time * 0.3 + star.phase) * 0.05;
      star.baseY += Math.cos(time * 0.2 + star.phase) * 0.05;

      const twinkle = (Math.sin(star.phase) + 1) / 2;
      const alpha = star.a * (0.25 + twinkle * 0.75);
      const color = isDark
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(100, 116, 139, ${alpha * 0.35})`;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * (0.7 + twinkle * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Glow halo for bright stars in dark mode
      if (isDark && star.r > 1.3) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140, 180, 255, ${alpha * 0.06})`;
        ctx.fill();
      }
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="toggle()"
      [attr.aria-label]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      [attr.aria-pressed]="isDark"
      title="Cambiar tema"
    >
      <i class="bi" [class.bi-sun]="isDark" [class.bi-moon]="!isDark" aria-hidden="true"></i>
    </button>
  `,
  styles: [`
    .theme-toggle {
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
      font-size: 1.05rem;
    }
    .theme-toggle:hover {
      color: var(--accent);
      border-color: var(--accent);
      box-shadow: var(--shadow-glow);
      transform: translateY(-1px);
    }
    .theme-toggle:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `],
})
export class ThemeToggleComponent {
  isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  toggle(): void {
    this.isDark = !this.isDark;
    const theme = this.isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem('alantek-theme', theme); } catch {}
  }
}

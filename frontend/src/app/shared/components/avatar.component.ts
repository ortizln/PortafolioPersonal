import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="alantek-avatar"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="size * 0.38"
      [title]="name || ''"
    >
      <img
        *ngIf="src && !failed"
        [src]="src"
        [alt]="name || 'Avatar'"
        loading="lazy"
        decoding="async"
        (error)="onError()"
      />
      <span *ngIf="!src || failed" class="alantek-avatar-initials" aria-hidden="true">{{ initials }}</span>
    </span>
  `,
  styles: [`
    .alantek-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      border-radius: var(--radius-full, 50%);
      overflow: hidden;
      background: var(--gradient-brand, linear-gradient(135deg, #19261E 0%, #354B35 55%, #BD6735 100%));
      color: #F7F7F2;
      font-family: var(--font-heading, sans-serif);
      font-weight: 700;
      line-height: 1;
      border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    }
    .alantek-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .alantek-avatar-initials {
      letter-spacing: 0.02em;
      user-select: none;
    }
  `],
})
export class AvatarComponent implements OnChanges {
  @Input() src?: string | null;
  @Input() name?: string | null;
  @Input() size = 64;

  failed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this.failed = false;
    }
  }

  onError(): void {
    this.failed = true;
  }

  get initials(): string {
    const n = (this.name || '').trim();
    if (!n) return '?';
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }
}

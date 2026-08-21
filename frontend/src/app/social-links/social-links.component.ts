import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { SocialLink } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

@Component({
  selector: 'app-social-links',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './social-links.component.html',
  styleUrls: ['./social-links.component.scss']
})
export class SocialLinksComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  links: SocialLink[] = [];
  showForm = false;
  editingLink: SocialLink | null = null;
  useCustomPlatform = false;
  form = { platform: '', url: '', icon: '', order: 0, isActive: true };
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  predefinedPlatforms = [
    { name: 'GitHub', icon: 'bi-github' },
    { name: 'LinkedIn', icon: 'bi-linkedin' },
    { name: 'Twitter / X', icon: 'bi-twitter-x' },
    { name: 'YouTube', icon: 'bi-youtube' },
    { name: 'Instagram', icon: 'bi-instagram' },
    { name: 'Facebook', icon: 'bi-facebook' },
    { name: 'Dribbble', icon: 'bi-dribbble' },
    { name: 'Behance', icon: 'bi-behance' },
    { name: 'Medium', icon: 'bi-medium' },
    { name: 'Dev.to', icon: 'bi-dev' },
    { name: 'Stack Overflow', icon: 'bi-stack-overflow' },
    { name: 'Twitch', icon: 'bi-twitch' },
    { name: 'Discord', icon: 'bi-discord' },
    { name: 'Telegram', icon: 'bi-telegram' },
    { name: 'WhatsApp', icon: 'bi-whatsapp' },
    { name: 'Email', icon: 'bi-envelope-fill' },
    { name: 'Website', icon: 'bi-globe2' },
  ];

  ngOnInit(): void {
    this.loadLinks();
  }

  loadLinks(): void {
    this.loading = true;
    this.apiService.getSocialLinksAll().subscribe({
      next: (list) => (this.links = list),
      error: () => this.showToast('No se pudieron cargar las redes sociales', 'error'),
      complete: () => (this.loading = false)
    });
  }

  onPlatformSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const val = select.value;
    if (val === '__custom__') {
      this.useCustomPlatform = true;
      this.form.platform = '';
      this.form.icon = '';
    } else {
      this.useCustomPlatform = false;
      const found = this.predefinedPlatforms.find(p => p.name === val);
      this.form.platform = val;
      this.form.icon = found?.icon || 'bi-link-45deg';
    }
  }

  openCreate(): void {
    this.editingLink = null;
    this.useCustomPlatform = false;
    this.form = { platform: '', url: '', icon: 'bi-link-45deg', order: this.links.length + 1, isActive: true };
    this.showForm = true;
  }

  openEdit(link: SocialLink): void {
    this.editingLink = link;
    const isPredefined = this.predefinedPlatforms.some(p => p.name === link.platform);
    this.useCustomPlatform = !isPredefined;
    this.form = {
      platform: link.platform,
      url: link.url,
      icon: link.icon || 'bi-link-45deg',
      order: link.order,
      isActive: link.isActive
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingLink = null;
  }

  submitForm(): void {
    if (!this.form.platform.trim() || !this.form.url.trim()) return;
    this.isSubmitting = true;
    const payload = {
      platform: this.form.platform,
      url: this.form.url,
      icon: this.form.icon || 'bi-link-45deg',
      order: this.form.order,
      isActive: this.form.isActive
    };

    if (this.editingLink) {
      this.apiService.updateSocialLink(this.editingLink.id, payload).subscribe({
        next: () => {
          this.showToast('Red social actualizada', 'success');
          this.loadLinks();
          this.cancelForm();
        },
        error: () => this.showToast('Error al actualizar la red social', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    } else {
      this.apiService.createSocialLink(payload).subscribe({
        next: () => {
          this.showToast('Red social creada', 'success');
          this.loadLinks();
          this.cancelForm();
        },
        error: () => this.showToast('Error al crear la red social', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    }
  }

  async deleteLink(id: string): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar esta red social?' });
    if (!ok) return;
    this.apiService.deleteSocialLink(id).subscribe({
      next: () => {
        this.links = this.links.filter(l => l.id !== id);
        this.showToast('Red social eliminada', 'success');
      },
      error: () => this.showToast('Error al eliminar la red social', 'error')
    });
  }

  toggleActive(link: SocialLink): void {
    this.apiService.updateSocialLink(link.id, { isActive: !link.isActive }).subscribe({
      next: (updated) => {
        const idx = this.links.findIndex(l => l.id === link.id);
        if (idx !== -1) this.links[idx] = updated;
      },
      error: () => this.showToast('Error al actualizar la red social', 'error')
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}

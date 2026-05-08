import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  order: number;
  isActive: boolean;
}

@Component({
  selector: 'app-social-links',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-links.component.html',
  styleUrls: ['./social-links.component.scss']
})
export class SocialLinksComponent implements OnInit {
  links: SocialLink[] = [];
  showForm = false;
  editingLink: SocialLink | null = null;
  useCustomPlatform = false;
  form = { platform: '', url: '', icon: '', order: 0, isActive: true };
  isSubmitting = false;

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
    const stored = localStorage.getItem('portfolio_social_links');
    this.links = stored ? JSON.parse(stored) : [
      { id: '1', platform: 'GitHub', url: 'https://github.com/user', icon: 'bi-github', order: 1, isActive: true },
      { id: '2', platform: 'LinkedIn', url: 'https://linkedin.com/in/user', icon: 'bi-linkedin', order: 2, isActive: true },
    ];
  }

  saveLinks(): void {
    localStorage.setItem('portfolio_social_links', JSON.stringify(this.links));
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
      icon: link.icon,
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
    const data: SocialLink = {
      id: this.editingLink?.id || crypto.randomUUID(),
      platform: this.form.platform,
      url: this.form.url,
      icon: this.form.icon,
      order: this.form.order,
      isActive: this.form.isActive
    };
    if (this.editingLink) {
      const idx = this.links.findIndex(l => l.id === this.editingLink!.id);
      if (idx !== -1) this.links[idx] = data;
    } else {
      this.links.push(data);
    }
    this.links.sort((a, b) => a.order - b.order);
    this.saveLinks();
    this.showForm = false;
    this.editingLink = null;
    this.isSubmitting = false;
  }

  deleteLink(id: string): void {
    if (confirm('Delete this social link?')) {
      this.links = this.links.filter(l => l.id !== id);
      this.saveLinks();
    }
  }

  toggleActive(link: SocialLink): void {
    link.isActive = !link.isActive;
    this.saveLinks();
  }
}

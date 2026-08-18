import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';

interface Stats {
  projects: number;
  publishedProjects: number;
  teamMembers: number;
  services: number;
  clients: number;
  testimonials: number;
  unreadMessages: number;
  leadsByStatus: Record<string, number>;
  projectsByCategory: Record<string, number>;
  projectsByTechnology: Record<string, number>;
  postsByStatus: Record<string, number>;
  postsByCategory: Record<string, number>;
  topProjects: { id: string; title: string; views: number; slug: string }[];
  topPages: { path: string; count: number }[];
  messagesByMonth: Record<string, number>;
  recentAudit: { id: string; action: string; entity: string; description?: string; createdAt: string; user?: { name: string } }[];
  recentPosts: { id: string; title: string; slug: string; publishedAt: string; excerpt: string }[];
  recentContacts: { id: string; name: string; email: string; subject: string; status: string; createdAt: string; isRead: boolean }[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  WON: 'Ganado',
  LOST: 'Perdido',
  CLOSED: 'Cerrado',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'var(--accent)',
  CONTACTED: '#3b82f6',
  QUALIFIED: '#a855f7',
  PROPOSAL: '#eab308',
  WON: '#22c55e',
  LOST: '#ef4444',
  CLOSED: '#6b7280',
};

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './corporate-dashboard.component.html',
  styleUrls: ['./corporate-dashboard.component.scss'],
})
export class CorporateDashboardComponent implements OnInit {
  private apiService = inject(ApiService);

  stats: Stats | null = null;
  loading = true;
  error = false;

  get statusLabels(): Record<string, string> {
    return STATUS_LABELS;
  }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = false;
    this.apiService.getCorporateStats().subscribe({
      next: (res) => (this.stats = res as Stats),
      error: () => (this.error = true),
      complete: () => (this.loading = false),
    });
  }

  retry(): void {
    this.loadStats();
  }

  kpis(): { label: string; value: number; icon: string; link: string }[] {
    if (!this.stats) return [];
    return [
      { label: 'Proyectos', value: this.stats.projects, icon: 'bi-folder2-open', link: '/admin/projects' },
      { label: 'Publicados', value: this.stats.publishedProjects, icon: 'bi-globe', link: '/admin/projects' },
      { label: 'Equipo', value: this.stats.teamMembers, icon: 'bi-people', link: '/admin/team' },
      { label: 'Servicios', value: this.stats.services, icon: 'bi-grid', link: '/admin/services' },
      { label: 'Clientes', value: this.stats.clients, icon: 'bi-briefcase', link: '/admin/clients' },
      { label: 'Testimonios', value: this.stats.testimonials, icon: 'bi-chat-quote', link: '/admin/testimonials' },
      { label: 'Blog posts', value: Object.values(this.stats.postsByStatus || {}).reduce((a, b) => a + b, 0), icon: 'bi-journal-text', link: '/admin/posts' },
      { label: 'No leídos', value: this.stats.unreadMessages, icon: 'bi-envelope-exclamation', link: '/admin/leads' },
    ];
  }

  maxLeads(): number {
    if (!this.stats) return 1;
    return Math.max(1, ...Object.values(this.stats.leadsByStatus));
  }

  maxCategory(): number {
    if (!this.stats) return 1;
    return Math.max(1, ...Object.values(this.stats.projectsByCategory));
  }

  maxTech(): number {
    if (!this.stats) return 1;
    return Math.max(1, ...Object.values(this.stats.projectsByTechnology));
  }

  maxMonth(): number {
    if (!this.stats) return 1;
    return Math.max(1, ...Object.values(this.stats.messagesByMonth));
  }

  monthLabel(key: string): string {
    const [y, m] = key.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[Number(m) - 1]}`;
  }

  barWidth(value: number, max: number): number {
    return Math.max(4, Math.round((value / max) * 100));
  }

  statusColor(status: string): string {
    return STATUS_COLORS[status] || 'var(--text-secondary)';
  }

  maxPostCategory(): number {
    if (!this.stats) return 1;
    const vals = Object.values(this.stats.postsByCategory || {});
    return vals.length ? Math.max(1, ...vals) : 1;
  }

  totalPosts(): number {
    if (!this.stats) return 0;
    return Object.values(this.stats.postsByStatus || {}).reduce((a, b) => a + b, 0);
  }

  publishedPosts(): number {
    if (!this.stats) return 0;
    return this.stats.postsByStatus?.['PUBLISHED'] || 0;
  }
}

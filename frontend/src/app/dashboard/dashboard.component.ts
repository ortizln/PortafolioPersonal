import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, AsyncPipe, KeyValuePipe } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe, KeyValuePipe, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your portfolio</p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/profile" class="btn-outline-accent">Edit Profile</a>
          <a routerLink="/admin/projects/new" class="btn-gradient">New Project</a>
        </div>
      </header>

      <section class="stats-grid">
        <div class="stat-card" *ngFor="let stat of stats | keyvalue">
          <div class="stat-icon" [class]="'icon-' + stat.key">
            <span [innerHTML]="icons[stat.key]"></span>
          </div>
          <div class="stat-info">
            <span class="stat-value" [attr.data-target]="stat.value">{{ stat.value }}</span>
            <span class="stat-label">{{ labels[stat.key] || stat.key }}</span>
          </div>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="card-modern quick-actions">
          <h2>Quick Actions</h2>
          <div class="actions-list">
            <a *ngFor="let action of quickActions" [routerLink]="action.link" class="action-item">
              <span class="action-icon" [innerHTML]="action.icon"></span>
              <span class="action-text">{{ action.label }}</span>
            </a>
          </div>
        </section>

        <section class="card-modern recent-messages">
          <h2>Recent Messages</h2>
          <div *ngIf="(messages$ | async)?.length === 0" class="empty-state">No messages yet</div>
          <div *ngFor="let msg of messages$ | async" class="message-item">
            <div class="message-header">
              <strong>{{ msg.name }}</strong>
              <span class="message-date">{{ msg.createdAt | date:'short' }}</span>
            </div>
            <p class="message-subject">{{ msg.subject }}</p>
            <span class="badge-tech" [class.unread]="!msg.isRead">{{ msg.isRead ? 'Read' : 'New' }}</span>
          </div>
        </section>
      </div>

      <section class="card-modern project-status">
        <h2>Project Status</h2>
        <div class="status-chart">
          <div *ngFor="let entry of projectStats | keyvalue" class="status-bar-item">
            <div class="status-bar-label">
              <span>{{ entry.key }}</span>
              <span>{{ entry.value }}</span>
            </div>
            <div class="status-bar-track">
              <div class="status-bar-fill" [style.width.%]="barPercent(entry.value)"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);

  stats: Record<string, number> = {};
  projectStats: Record<string, number> = {};
  messages$: Observable<any[]> = this.apiService.getContactMessagesAll();

  labels: Record<string, string> = {
    projects: 'Projects',
    experiences: 'Experiences',
    education: 'Education',
    certifications: 'Certifications',
    skills: 'Skills',
    languages: 'Languages',
    unreadMessages: 'Unread Messages',
    totalMessages: 'Total Messages',
  };

  icons: Record<string, string> = {
    projects: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
    experiences: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
    education: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    certifications: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M12 13v8l-2-2-2 2"/></svg>`,
    skills: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    languages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    unreadMessages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    totalMessages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  };

  quickActions = [
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`, label: 'Add Project', link: '/admin/projects/new' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`, label: 'Add Experience', link: '/admin/experiences/new' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`, label: 'Add Education', link: '/admin/education/new' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M12 13v8l-2-2-2 2"/></svg>`, label: 'Add Certification', link: '/admin/certifications/new' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`, label: 'Add Skill', link: '/admin/skills/new' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`, label: 'View Messages', link: '/admin/messages' },
  ];

  ngOnInit(): void {
    this.apiService.getStats().subscribe((s) => this.stats = s);
    this.apiService.getProjectStats().subscribe((s) => this.projectStats = s);
  }

  barPercent(value: number): number {
    const max = Math.max(...Object.values(this.projectStats), 1);
    return (value / max) * 100;
  }
}

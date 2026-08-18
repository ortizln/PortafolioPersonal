import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { AuditLog } from '../core/models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
})
export class AuditLogComponent implements OnInit {
  private apiService = inject(ApiService);

  logs: AuditLog[] = [];
  total = 0;
  page = 1;
  limit = 25;
  entity = '';
  action = '';
  search = '';
  loading = true;
  error = false;

  get entities(): string[] {
    return ['User', 'Role', 'Project', 'TeamMember', 'Service', 'Client', 'Company', 'ContactMessage', 'MediaFile', 'Auth'];
  }

  get actions(): string[] {
    return ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ROLE_CHANGE', 'PASSWORD_RESET', 'ASSIGN'];
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = false;
    this.apiService.getAuditLogs({
      page: this.page,
      limit: this.limit,
      entity: this.entity || undefined,
      action: this.action || undefined,
      search: this.search || undefined,
    }).subscribe({
      next: (res) => {
        this.logs = res.logs;
        this.total = res.total;
      },
      error: () => (this.error = true),
      complete: () => (this.loading = false),
    });
  }

  retry(): void {
    this.loadLogs();
  }

  applyFilters(): void {
    this.page = 1;
    this.loadLogs();
  }

  actionClass(action: string): string {
    const a = action.toUpperCase();
    if (a.includes('DELETE')) return 'danger';
    if (a.includes('CREATE')) return 'success';
    if (a.includes('LOGIN') || a.includes('AUTH')) return 'info';
    return 'neutral';
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p;
    this.loadLogs();
  }
}

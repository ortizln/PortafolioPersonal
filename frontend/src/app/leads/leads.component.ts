import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { ContactMessage } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  WON: 'Ganado',
  LOST: 'Perdido',
  CLOSED: 'Cerrado',
};

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss'],
})
export class LeadsComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  leads: ContactMessage[] = [];
  statusCounts: Record<string, number> = {};
  statuses: string[] = [];
  total = 0;
  page = 1;
  limit = 15;
  search = '';
  statusFilter = 'ALL';
  selectedLead: ContactMessage | null = null;
  loading = true;
  users: { id: string; name: string; email: string }[] = [];
  usersError = false;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  get statusLabels(): Record<string, string> {
    return STATUS_LABELS;
  }

  ngOnInit(): void {
    this.loadLeads();
    this.apiService.getUsers({ limit: 100 }).subscribe({
      next: (res) => (this.users = res.users.map((u) => ({ id: u.id, name: u.name, email: u.email }))),
      error: () => (this.usersError = true),
    });
  }

  retryUsers(): void {
    this.usersError = false;
    this.apiService.getUsers({ limit: 100 }).subscribe({
      next: (res) => (this.users = res.users.map((u) => ({ id: u.id, name: u.name, email: u.email }))),
      error: () => (this.usersError = true),
    });
  }

  loadLeads(): void {
    this.loading = true;
    this.apiService.getLeads({
      page: this.page,
      limit: this.limit,
      status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
      search: this.search || undefined,
    }).subscribe({
      next: (res) => {
        this.leads = res.contacts;
        this.total = res.total;
        this.statusCounts = res.statusCounts;
        this.statuses = res.statuses;
      },
      error: () => this.showToast('No se pudieron cargar los leads', 'error'),
      complete: () => (this.loading = false),
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadLeads();
  }

  filterStatus(status: string): void {
    this.statusFilter = status;
    this.page = 1;
    this.loadLeads();
  }

  changeStatus(lead: ContactMessage, status: string): void {
    this.apiService.updateLead(lead.id, { status }).subscribe({
      next: (updated) => {
        const idx = this.leads.findIndex((l) => l.id === updated.id);
        if (idx >= 0) this.leads[idx] = updated;
        this.loadLeads();
        this.showToast(`Estado: ${STATUS_LABELS[status] || status}`, 'success');
      },
      error: () => this.showToast('Error al actualizar el estado', 'error'),
    });
  }

  toggleRead(lead: ContactMessage): void {
    this.apiService.updateLead(lead.id, { isRead: !lead.isRead }).subscribe({
      next: (updated) => {
        const idx = this.leads.findIndex((l) => l.id === updated.id);
        if (idx >= 0) this.leads[idx] = updated;
      },
      error: (err) => console.error('Failed to toggle read status', err),
    });
  }

  openDetail(lead: ContactMessage): void {
    this.selectedLead = lead;
    if (!lead.isRead) this.toggleRead(lead);
  }

  closeDetail(): void {
    this.selectedLead = null;
  }

  assignTo(lead: ContactMessage, userId: string): void {
    this.apiService.updateLead(lead.id, { assignedToId: userId || null }).subscribe({
      next: (updated) => {
        const idx = this.leads.findIndex((l) => l.id === updated.id);
        if (idx >= 0) this.leads[idx] = updated;
        this.selectedLead = updated;
        this.showToast('Lead asignado', 'success');
      },
      error: () => this.showToast('Error al asignar', 'error'),
    });
  }

  saveNotes(): void {
    if (!this.selectedLead) return;
    this.apiService.updateLead(this.selectedLead.id, { notes: this.selectedLead.notes }).subscribe({
      next: () => this.showToast('Notas guardadas', 'success'),
      error: () => this.showToast('Error al guardar notas', 'error'),
    });
  }

  async deleteLead(lead: ContactMessage): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar este lead?' });
    if (!ok) return;
    this.apiService.deleteContactMessage(lead.id).subscribe({
      next: () => {
        this.leads = this.leads.filter((l) => l.id !== lead.id);
        if (this.selectedLead?.id === lead.id) this.selectedLead = null;
        this.showToast('Lead eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar', 'error'),
    });
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p;
    this.loadLeads();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}

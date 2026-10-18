import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { QuoteRequest } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nueva',
  CONTACTED: 'Contactada',
  QUALIFIED: 'Calificada',
  PROPOSAL: 'Propuesta',
  WON: 'Ganada',
  LOST: 'Perdida',
  SPAM: 'Spam',
};

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.scss'],
})
export class QuoteListComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);

  quotes: QuoteRequest[] = [];
  total = 0;
  page = 1;
  limit = 15;
  search = '';
  statusFilter = 'ALL';
  statusCounts: Record<string, number> = {};
  statuses: string[] = [];
  selected: QuoteRequest | null = null;
  loading = true;
  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  get statusLabels(): Record<string, string> { return STATUS_LABELS; }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getQuotes({
      page: this.page,
      limit: this.limit,
      status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
      search: this.search || undefined,
    }).subscribe({
      next: (res) => {
        this.quotes = res.quotes;
        this.total = res.total;
        this.statusCounts = res.statusCounts;
        this.statuses = res.statuses;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('No se pudieron cargar las cotizaciones', 'error');
      },
    });
  }

  filterStatus(status: string): void {
    this.statusFilter = status;
    this.page = 1;
    this.load();
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p;
    this.load();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  openDetail(q: QuoteRequest): void {
    this.api.getQuote(q.id).subscribe({
      next: (res) => (this.selected = res.quote),
      error: () => (this.selected = q),
    });
  }

  closeDetail(): void {
    this.selected = null;
  }

  features(q: QuoteRequest): string[] {
    return q.requirementsJson?.features || [];
  }

  changeStatus(q: QuoteRequest, status: string): void {
    this.api.updateQuote(q.id, { status: status as any }).subscribe({
      next: (res) => {
        q.status = res.quote.status;
        if (this.selected?.id === q.id) this.selected.status = res.quote.status;
        this.showToast('Estado actualizado', 'success');
        this.load();
      },
      error: () => this.showToast('No se pudo actualizar', 'error'),
    });
  }

  saveFields(q: QuoteRequest): void {
    this.api.updateQuote(q.id, {
      contactName: q.contactName || undefined,
      contactEmail: q.contactEmail || undefined,
      contactPhone: q.contactPhone || undefined,
      budgetRange: q.budgetRange || undefined,
      deadline: q.deadline || undefined,
      projectDescription: q.projectDescription || undefined,
    }).subscribe({
      next: () => this.showToast('Cotización guardada', 'success'),
      error: () => this.showToast('No se pudo guardar', 'error'),
    });
  }

  async deleteQuote(q: QuoteRequest): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar cotización',
      message: `¿Eliminar la cotización ${q.code}?`,
      confirmText: 'Eliminar',
      type: 'danger',
    });
    if (!ok) return;
    this.api.deleteQuote(q.id).subscribe({
      next: () => {
        this.showToast('Cotización eliminada', 'success');
        if (this.selected?.id === q.id) this.selected = null;
        this.load();
      },
      error: () => this.showToast('No se pudo eliminar', 'error'),
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => (this.toasts = this.toasts.filter((t) => t.id !== id)), 3500);
  }
}

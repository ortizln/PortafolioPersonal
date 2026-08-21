import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { ContactMessage } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './contact-messages.component.html',
  styleUrls: ['./contact-messages.component.scss']
})
export class ContactMessagesComponent implements OnInit {
  private apiService = inject(ApiService);

  messages: ContactMessage[] = [];
  expandedId: string | null = null;
  showDeleteConfirm: string | null = null;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  get unreadCount(): number {
    return this.messages.filter(m => !m.isRead).length;
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    this.apiService.getContactMessagesAll().subscribe({
      next: (list) => (this.messages = list),
      error: () => this.showToast('No se pudieron cargar los mensajes', 'error'),
      complete: () => (this.loading = false)
    });
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  markAsRead(id: string): void {
    this.apiService.markContactMessageAsRead(id).subscribe({
      next: (updated) => {
        const idx = this.messages.findIndex(m => m.id === id);
        if (idx !== -1) this.messages[idx] = updated;
      },
      error: () => this.showToast('Error al marcar el mensaje', 'error')
    });
  }

  markAsReadEvent(event: Event, id: string): void {
    event.stopPropagation();
    this.markAsRead(id);
  }

  requestDelete(id: string): void {
    this.showDeleteConfirm = id;
  }

  requestDeleteEvent(event: Event, id: string): void {
    event.stopPropagation();
    this.requestDelete(id);
  }

  cancelDelete(): void {
    this.showDeleteConfirm = null;
  }

  confirmDelete(): void {
    const id = this.showDeleteConfirm;
    if (!id) return;
    this.apiService.deleteContactMessage(id).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== id);
        if (this.expandedId === id) this.expandedId = null;
        this.showDeleteConfirm = null;
        this.showToast('Mensaje eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar el mensaje', 'error')
    });
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
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

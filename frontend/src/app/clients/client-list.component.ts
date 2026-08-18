import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { UploadUrlPipe } from '../shared/upload-url.pipe';
import { Client } from '../core/models';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UploadUrlPipe],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  clients: Client[] = [];
  showForm = false;
  editingClient: Client | null = null;
  form: any = {};
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.apiService.getClientsAll().subscribe({
      next: (list) => (this.clients = list),
      error: () => this.showToast('No se pudieron cargar los clientes', 'error'),
      complete: () => (this.loading = false)
    });
  }

  openCreate(): void {
    this.editingClient = null;
    this.form = { name: '', website: '', industry: '', description: '', isPublic: true, isFeatured: false, order: 0 };
    this.showForm = true;
  }

  openEdit(c: Client): void {
    this.editingClient = c;
    this.form = {
      name: c.name,
      logoUrl: c.logoUrl || '',
      website: c.website || '',
      industry: c.industry || '',
      description: c.description || '',
      isPublic: c.isPublic,
      isFeatured: c.isFeatured,
      order: c.order
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingClient = null;
  }

  submitForm(): void {
    if (!this.form.name.trim()) return;
    this.isSubmitting = true;

    const request = this.editingClient
      ? this.apiService.updateClient(this.editingClient.id, this.form)
      : this.apiService.createClient(this.form);

    request.subscribe({
      next: () => {
        this.showToast(this.editingClient ? 'Cliente actualizado' : 'Cliente creado', 'success');
        this.loadClients();
        this.cancelForm();
      },
      error: () => this.showToast('Error al guardar el cliente', 'error'),
      complete: () => (this.isSubmitting = false)
    });
  }

  uploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.apiService.uploadFile(file, 'clients').subscribe({
      next: (res) => {
        this.form.logoUrl = res.url;
        this.showToast('Logotipo subido', 'success');
      },
      error: () => this.showToast('Error al subir el logotipo', 'error'),
      complete: () => (input.value = '')
    });
  }

  async deleteClient(c: Client): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar el cliente "${c.name}"?` });
    if (!ok) return;
    this.apiService.deleteClient(c.id).subscribe({
      next: () => {
        this.clients = this.clients.filter((x) => x.id !== c.id);
        this.showToast('Cliente eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar el cliente', 'error')
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

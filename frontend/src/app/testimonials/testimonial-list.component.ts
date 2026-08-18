import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { UploadUrlPipe } from '../shared/upload-url.pipe';
import { Testimonial, Client } from '../core/models';

@Component({
  selector: 'app-testimonial-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UploadUrlPipe],
  templateUrl: './testimonial-list.component.html',
  styleUrls: ['./testimonial-list.component.scss']
})
export class TestimonialListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  testimonials: Testimonial[] = [];
  clients: Client[] = [];
  showForm = false;
  editingTestimonial: Testimonial | null = null;
  form: any = {};
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadTestimonials();
    this.apiService.getClientsAll().subscribe({
      next: (list) => (this.clients = list.filter((c) => c.isPublic))
    });
  }

  loadTestimonials(): void {
    this.loading = true;
    this.apiService.getTestimonialsAll().subscribe({
      next: (list) => (this.testimonials = list),
      error: () => this.showToast('No se pudieron cargar los testimonios', 'error'),
      complete: () => (this.loading = false)
    });
  }

  openCreate(): void {
    this.editingTestimonial = null;
    this.form = { clientId: '', authorName: '', authorPosition: '', company: '', content: '', rating: 5, isPublished: true, isFeatured: false, order: 0 };
    this.showForm = true;
  }

  openEdit(t: Testimonial): void {
    this.editingTestimonial = t;
    this.form = {
      clientId: t.clientId || '',
      authorName: t.authorName,
      authorPosition: t.authorPosition || '',
      company: t.company || '',
      content: t.content,
      rating: t.rating || 5,
      photoUrl: t.photoUrl || '',
      isPublished: t.isPublished,
      isFeatured: t.isFeatured,
      order: t.order
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingTestimonial = null;
  }

  submitForm(): void {
    if (!this.form.authorName.trim() || !this.form.content.trim()) return;
    this.isSubmitting = true;

    const request = this.editingTestimonial
      ? this.apiService.updateTestimonial(this.editingTestimonial.id, this.form)
      : this.apiService.createTestimonial(this.form);

    request.subscribe({
      next: () => {
        this.showToast(this.editingTestimonial ? 'Testimonio actualizado' : 'Testimonio creado', 'success');
        this.loadTestimonials();
        this.cancelForm();
      },
      error: () => this.showToast('Error al guardar el testimonio', 'error'),
      complete: () => (this.isSubmitting = false)
    });
  }

  async deleteTestimonial(t: Testimonial): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar el testimonio de "${t.authorName}"?` });
    if (!ok) return;
    this.apiService.deleteTestimonial(t.id).subscribe({
      next: () => {
        this.testimonials = this.testimonials.filter((x) => x.id !== t.id);
        this.showToast('Testimonio eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar el testimonio', 'error')
    });
  }

  uploadPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.apiService.uploadFile(file, 'testimonials').subscribe({
      next: (res) => {
        this.form.photoUrl = res.url;
        this.showToast('Foto subida', 'success');
      },
      error: () => this.showToast('Error al subir la foto', 'error'),
      complete: () => (input.value = '')
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

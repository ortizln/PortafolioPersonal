import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Service, Technology } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.scss']
})
export class ServiceListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  services: Service[] = [];
  technologies: Technology[] = [];
  showForm = false;
  editingService: Service | null = null;
  form: any = {};
  selectedTechIds: string[] = [];
  featureName = '';
  featureDesc = '';
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadServices();
    this.apiService.getTechnologiesAll().subscribe({
      next: (list) => (this.technologies = list)
    });
  }

  loadServices(): void {
    this.loading = true;
    this.apiService.getServicesAll().subscribe({
      next: (list) => (this.services = list),
      error: () => this.showToast('No se pudieron cargar los servicios', 'error'),
      complete: () => (this.loading = false)
    });
  }

  openCreate(): void {
    this.editingService = null;
    this.form = { name: '', shortDescription: '', description: '', icon: 'bi-gear', coverImage: '', status: 'DRAFT', order: 0, isFeatured: false };
    this.featureName = '';
    this.featureDesc = '';
    this.selectedTechIds = [];
    this.showForm = true;
  }

  openEdit(s: Service): void {
    this.editingService = s;
    this.form = {
      name: s.name,
      shortDescription: s.shortDescription || '',
      description: s.description || '',
      icon: s.icon || 'bi-gear',
      coverImage: s.coverImage || '',
      status: s.status,
      order: s.order,
      isFeatured: s.isFeatured
    };
    this.selectedTechIds = (s.technologies || []).map((t) => t.technology.id);
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingService = null;
  }

  addFeature(): void {
    if (!this.featureName.trim()) return;
    if (!this.form.features) this.form.features = [];
    this.form.features.push({ name: this.featureName.trim(), description: this.featureDesc.trim(), order: this.form.features.length });
    this.featureName = '';
    this.featureDesc = '';
  }

  removeFeature(index: number): void {
    this.form.features?.splice(index, 1);
  }

  toggleTech(id: string): void {
    const idx = this.selectedTechIds.indexOf(id);
    if (idx >= 0) this.selectedTechIds.splice(idx, 1);
    else this.selectedTechIds.push(id);
  }

  submitForm(): void {
    if (!this.form.name.trim()) return;
    this.isSubmitting = true;
    const payload = {
      ...this.form,
      technologyIds: this.selectedTechIds
    };

    const request = this.editingService
      ? this.apiService.updateService(this.editingService.id, payload)
      : this.apiService.createService(payload);

    request.subscribe({
      next: () => {
        this.showToast(this.editingService ? 'Servicio actualizado' : 'Servicio creado', 'success');
        this.loadServices();
        this.cancelForm();
      },
      error: () => this.showToast('Error al guardar el servicio', 'error'),
      complete: () => (this.isSubmitting = false)
    });
  }

  async deleteService(s: Service): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar el servicio "${s.name}"?` });
    if (!ok) return;
    this.apiService.deleteService(s.id).subscribe({
      next: () => {
        this.services = this.services.filter((x) => x.id !== s.id);
        this.showToast('Servicio eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar el servicio', 'error')
    });
  }

  uploadCover(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.apiService.uploadFile(file, 'services').subscribe({
      next: (res) => {
        this.form.coverImage = res.url;
        this.showToast('Imagen subida', 'success');
      },
      error: () => this.showToast('Error al subir la imagen', 'error'),
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

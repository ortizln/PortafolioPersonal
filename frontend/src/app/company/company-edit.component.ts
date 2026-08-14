import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { Company } from '../core/models';

@Component({
  selector: 'app-company-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss']
})
export class CompanyEditComponent implements OnInit {
  private apiService = inject(ApiService);

  company: Company | null = null;
  form: any = {};
  loading = true;
  isSubmitting = false;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.apiService.getCompany().subscribe({
      next: (company) => {
        this.company = company;
        this.form = {
          name: company?.name ?? '',
          legalName: company?.legalName ?? '',
          slogan: company?.slogan ?? '',
          shortDescription: company?.shortDescription ?? '',
          description: company?.description ?? '',
          mission: company?.mission ?? '',
          vision: company?.vision ?? '',
          history: company?.history ?? '',
          email: company?.email ?? '',
          phone: company?.phone ?? '',
          whatsapp: company?.whatsapp ?? '',
          website: company?.website ?? '',
          address: company?.address ?? '',
          city: company?.city ?? '',
          country: company?.country ?? '',
          logoUrl: company?.logoUrl ?? '',
          logoDarkUrl: company?.logoDarkUrl ?? '',
          faviconUrl: company?.faviconUrl ?? '',
          heroImageUrl: company?.heroImageUrl ?? '',
          primaryColor: company?.primaryColor ?? '',
          secondaryColor: company?.secondaryColor ?? '',
          accentColor: company?.accentColor ?? '',
          foundedYear: company?.foundedYear ?? new Date().getFullYear(),
          seoTitle: company?.seoTitle ?? '',
          seoDescription: company?.seoDescription ?? ''
        };
      },
      error: () => this.showToast('No se pudo cargar la información corporativa', 'error'),
      complete: () => (this.loading = false)
    });
  }

  submit(): void {
    if (!this.form.name.trim()) {
      this.showToast('El nombre es obligatorio', 'error');
      return;
    }
    this.isSubmitting = true;
    this.apiService.upsertCompany(this.form).subscribe({
      next: () => {
        this.showToast('Información corporativa guardada', 'success');
      },
      error: () => this.showToast('Error al guardar', 'error'),
      complete: () => (this.isSubmitting = false)
    });
  }

  uploadImage(field: 'logoUrl' | 'logoDarkUrl' | 'faviconUrl' | 'heroImageUrl', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.apiService.uploadFile(file, 'branding').subscribe({
      next: (res) => {
        this.form[field] = res.url;
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

import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Certification, CertificateFile } from '../core/models';

@Component({
  selector: 'app-certificate-list',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, NgClass, DatePipe],
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss'],
})
export class CertificateListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  certificates: Certification[] = [];
  educationList: { id: number; institution: string; degree: string }[] = [];
  certFiles: CertificateFile[] = [];
  certImagePreview: string | null = null;
  pendingImageFile: File | null = null;
  pendingImagePreview: string | null = null;
  pendingCertFile: File | null = null;
  pendingCertPreview: string | null = null;
  showForm = false;
  editingId: number | null = null;
  saving = false;
  loading = true;
  certForm!: FormGroup;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.buildForm();
    this.loadCertificates();
    this.loadEducation();
  }

  private buildForm(): void {
    this.certForm = this.fb.group({
      name: [''],
      issuingOrganization: [''],
      description: [''],
      issueDate: [''],
      expiryDate: [''],
      credentialId: [''],
      credentialUrl: [''],
      category: [''],
      educationId: [null],
      doesNotExpire: [false],
    });

    this.certForm.get('doesNotExpire')?.valueChanges.subscribe((noExpiry) => {
      const expiry = this.certForm.get('expiryDate');
      if (noExpiry) { expiry?.disable(); expiry?.reset(); }
      else { expiry?.enable(); }
    });
  }

  private loadCertificates(): void {
    this.apiService.getCertificationsAll().subscribe({
      next: (list) => (this.certificates = list),
      error: () => this.showToast('Error al cargar certificados', 'error'),
      complete: () => (this.loading = false),
    });
  }

  private loadEducation(): void {
    this.apiService.getEducationAll().subscribe({
      next: (list) => {
        this.educationList = list.map((e) => ({
          id: e.id,
          institution: e.institution,
          degree: e.degree,
        }));
      },
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.certFiles = [];
    this.certImagePreview = null;
    this.pendingImageFile = null;
    this.pendingImagePreview = null;
    this.pendingCertFile = null;
    this.pendingCertPreview = null;
    this.certForm.reset({ doesNotExpire: false, educationId: null });
    this.showForm = true;
  }

  openEdit(cert: Certification): void {
    this.editingId = cert.id;
    this.certFiles = [...(cert.files || [])];
    this.certImagePreview = this.apiService.getUploadUrl((cert as any).imageUrl);
    this.pendingImageFile = null;
    this.pendingImagePreview = null;
    this.pendingCertFile = null;
    this.pendingCertPreview = null;
    this.certForm.patchValue({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      description: cert.description,
      issueDate: cert.issueDate?.slice(0, 10),
      expiryDate: cert.expiryDate?.slice(0, 10) ?? null,
      credentialId: cert.credentialId,
      credentialUrl: cert.credentialUrl,
      category: (cert as any).category || '',
      educationId: (cert as any).educationId || null,
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.certFiles = [];
    this.certImagePreview = null;
    this.pendingImageFile = null;
    this.pendingImagePreview = null;
    this.pendingCertFile = null;
    this.pendingCertPreview = null;
    this.certForm.reset({ doesNotExpire: false, educationId: null });
  }

  onPendingImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => (this.pendingImagePreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onPendingFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.pendingCertFile = input.files[0];
    this.pendingCertPreview = input.files[0].name;
  }

  removePendingImage(): void {
    this.pendingImageFile = null;
    this.pendingImagePreview = null;
  }

  removePendingFile(): void {
    this.pendingCertFile = null;
    this.pendingCertPreview = null;
  }

  save(): void {
    if (this.certForm.invalid) return;
    this.saving = true;
    const form = this.certForm.value;

    const payload: Partial<Certification> = {
      name: form.name,
      issuingOrganization: form.issuingOrganization,
      description: form.description,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || null,
      credentialId: form.credentialId,
      credentialUrl: form.credentialUrl,
      category: form.category,
      educationId: form.educationId,
    } as any;

    const request = this.editingId
      ? this.apiService.updateCertification(this.editingId, payload)
      : this.apiService.createCertification(payload);

    request.subscribe({
      next: (saved) => {
        this.showToast(this.editingId ? 'Certificado actualizado' : 'Certificado creado', 'success');
        const certId = (saved as any).id || this.editingId;
        const uploads: Promise<void>[] = [];

        if (this.pendingImageFile && certId) {
          uploads.push(new Promise((resolve) => {
            this.apiService.uploadCertificationImage(certId, this.pendingImageFile!).subscribe({
              next: () => { resolve(); },
              error: () => { this.showToast('Error al subir imagen', 'error'); resolve(); },
            });
          }));
        }

        if (this.pendingCertFile && certId) {
          uploads.push(new Promise((resolve) => {
            this.apiService.uploadCertificationFile(certId, this.pendingCertFile!).subscribe({
              next: () => resolve(),
              error: () => { this.showToast('Error al subir archivo', 'error'); resolve(); },
            });
          }));
        }

        Promise.all(uploads).then(() => {
          this.cancelForm();
          this.loadCertificates();
        });

        if (uploads.length === 0) {
          this.cancelForm();
          this.loadCertificates();
        }
      },
      error: () => this.showToast('Error al guardar certificado', 'error'),
      complete: () => (this.saving = false),
    });
  }

  async deleteCertificate(id: number): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar este certificado?' });
    if (!ok) return;
    this.apiService.deleteCertification(id).subscribe({
      next: () => {
        this.showToast('Certificado eliminado', 'success');
        this.loadCertificates();
      },
      error: () => this.showToast('Error al eliminar certificado', 'error'),
    });
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.editingId) return;
    const file = input.files[0];
    this.apiService.uploadCertificationFile(this.editingId, file).subscribe({
      next: (certFile) => {
        this.certFiles.push(certFile);
        this.showToast('Archivo subido', 'success');
        this.loadCertificates();
      },
      error: () => this.showToast('Error al subir archivo', 'error'),
    });
    input.value = '';
  }

  uploadCertImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.editingId) return;
    const file = input.files[0];
    this.certImagePreview = URL.createObjectURL(file);
    this.apiService.uploadCertificationImage(this.editingId, file).subscribe({
      next: () => {
        this.showToast('Imagen de certificado subida', 'success');
        this.loadCertificates();
      },
      error: () => this.showToast('Error al subir imagen', 'error'),
    });
    input.value = '';
  }

  async removeCertFile(file: CertificateFile): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar "${file.originalName}"?` });
    if (!ok) return;
    this.apiService.deleteFile(file.path).subscribe({
      next: () => {
        this.certFiles = this.certFiles.filter((f) => f.id !== file.id);
        this.showToast('Archivo eliminado', 'success');
        this.loadCertificates();
      },
      error: () => this.showToast('Error al eliminar archivo', 'error'),
    });
  }

  getUploadUrl(path: string | null | undefined): string {
    return this.apiService.getUploadUrl(path);
  }

  getFileUrl(file: CertificateFile): string {
    return this.apiService.getUploadUrl(file.path);
  }

  isImage(mimeType: string): boolean {
    return mimeType?.startsWith('image/');
  }

  isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 4000);
  }
}

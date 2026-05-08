import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/services/api.service';
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

  certificates: Certification[] = [];
  educationList: { id: number; institution: string; degree: string }[] = [];
  certFiles: CertificateFile[] = [];
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
  }

  private loadCertificates(): void {
    this.apiService.getCertificationsAll().subscribe({
      next: (list) => (this.certificates = list),
      error: () => this.showToast('Failed to load certificates', 'error'),
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
    this.certForm.reset({ doesNotExpire: false, educationId: null });
    this.showForm = true;
  }

  openEdit(cert: Certification): void {
    this.editingId = cert.id;
    this.certFiles = [...(cert.files || [])];
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
    this.certForm.reset({ doesNotExpire: false, educationId: null });
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
      next: () => {
        this.showToast(this.editingId ? 'Certificate updated' : 'Certificate created', 'success');
        this.cancelForm();
        this.loadCertificates();
      },
      error: () => this.showToast('Failed to save certificate', 'error'),
      complete: () => (this.saving = false),
    });
  }

  deleteCertificate(id: number): void {
    if (!confirm('Delete this certificate?')) return;
    this.apiService.deleteCertification(id).subscribe({
      next: () => {
        this.showToast('Certificate deleted', 'success');
        this.loadCertificates();
      },
      error: () => this.showToast('Failed to delete certificate', 'error'),
    });
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.editingId) return;
    const file = input.files[0];
    this.apiService.uploadCertificationFile(this.editingId, file).subscribe({
      next: (certFile) => {
        this.certFiles.push(certFile);
        this.showToast('File uploaded', 'success');
        this.loadCertificates();
      },
      error: () => this.showToast('Failed to upload file', 'error'),
    });
    input.value = '';
  }

  removeCertFile(file: CertificateFile): void {
    if (!confirm(`Remove "${file.filename}"?`)) return;
    this.apiService.deleteFile(environment.uploadUrl + '/' + file.path).subscribe({
      next: () => {
        this.certFiles = this.certFiles.filter((f) => f.id !== file.id);
        this.showToast('File removed', 'success');
        this.loadCertificates();
      },
      error: () => this.showToast('Failed to remove file', 'error'),
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 4000);
  }
}

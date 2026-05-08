import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Education } from '../core/models';

@Component({
  selector: 'app-education-list',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, DatePipe],
  templateUrl: './education-list.component.html',
  styleUrls: ['./education-list.component.scss'],
})
export class EducationListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  educationList: Education[] = [];
  showForm = false;
  editingId: number | null = null;
  saving = false;
  loading = true;
  educationForm!: FormGroup;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.buildForm();
    this.loadEducation();
  }

  private buildForm(): void {
    this.educationForm = this.fb.group({
      institution: [''],
      degree: [''],
      field: [''],
      level: [''],
      description: [''],
      startDate: [''],
      endDate: [''],
      current: [false],
      grade: [''],
    });
  }

  private loadEducation(): void {
    this.apiService.getEducationAll().subscribe({
      next: (list) => (this.educationList = list),
      error: () => this.showToast('Failed to load education', 'error'),
      complete: () => (this.loading = false),
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.educationForm.reset({ current: false });
    this.showForm = true;
  }

  openEdit(edu: Education): void {
    this.editingId = edu.id;
    this.educationForm.patchValue({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      description: edu.description,
      startDate: edu.startDate?.slice(0, 10),
      endDate: edu.endDate?.slice(0, 10) ?? null,
      current: edu.current,
      grade: edu.grade,
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.educationForm.reset({ current: false });
  }

  save(): void {
    if (this.educationForm.invalid) return;
    this.saving = true;
    const form = this.educationForm.value;

    const payload: Partial<Education> = {
      institution: form.institution,
      degree: form.degree,
      field: form.field,
      description: form.description,
      startDate: form.startDate,
      endDate: form.current ? null : form.endDate || null,
      current: form.current,
      grade: form.grade,
    };

    const request = this.editingId
      ? this.apiService.updateEducation(this.editingId, payload)
      : this.apiService.createEducation(payload);

    request.subscribe({
      next: () => {
        this.showToast(this.editingId ? 'Education updated' : 'Education created', 'success');
        this.cancelForm();
        this.loadEducation();
      },
      error: () => this.showToast('Failed to save education', 'error'),
      complete: () => (this.saving = false),
    });
  }

  deleteEducation(id: number): void {
    if (!confirm('Delete this education entry?')) return;
    this.apiService.deleteEducation(id).subscribe({
      next: () => {
        this.showToast('Education deleted', 'success');
        this.loadEducation();
      },
      error: () => this.showToast('Failed to delete education', 'error'),
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

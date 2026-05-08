import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Experience } from '../core/models';

@Component({
  selector: 'app-experience-list',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, DatePipe],
  templateUrl: './experience-list.component.html',
  styleUrls: ['./experience-list.component.scss'],
})
export class ExperienceListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  experiences: Experience[] = [];
  showForm = false;
  editingId: number | null = null;
  saving = false;
  loading = true;
  experienceForm!: FormGroup;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.buildForm();
    this.loadExperiences();
  }

  private buildForm(): void {
    this.experienceForm = this.fb.group({
      company: [''],
      position: [''],
      description: [''],
      startDate: [''],
      endDate: [''],
      current: [false],
      location: [''],
      technologies: [''],
      achievements: [''],
    });
  }

  private loadExperiences(): void {
    this.apiService.getExperiencesAll().subscribe({
      next: (list) => (this.experiences = list),
      error: () => this.showToast('Failed to load experiences', 'error'),
      complete: () => (this.loading = false),
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.experienceForm.reset({ current: false });
    this.showForm = true;
  }

  openEdit(exp: Experience): void {
    this.editingId = exp.id;
    this.experienceForm.patchValue({
      company: exp.company,
      position: exp.position,
      description: exp.description,
      startDate: exp.startDate?.slice(0, 10),
      endDate: exp.endDate?.slice(0, 10) ?? null,
      current: exp.current,
      location: exp.location,
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.experienceForm.reset({ current: false });
  }

  save(): void {
    if (this.experienceForm.invalid) return;
    this.saving = true;
    const form = this.experienceForm.value;

    const payload: Partial<Experience> = {
      company: form.company,
      position: form.position,
      description: form.description,
      startDate: form.startDate,
      endDate: form.current ? null : form.endDate || null,
      current: form.current,
      location: form.location,
    };

    const request = this.editingId
      ? this.apiService.updateExperience(this.editingId, payload)
      : this.apiService.createExperience(payload);

    request.subscribe({
      next: () => {
        this.showToast(this.editingId ? 'Experience updated' : 'Experience created', 'success');
        this.cancelForm();
        this.loadExperiences();
      },
      error: () => this.showToast('Failed to save experience', 'error'),
      complete: () => (this.saving = false),
    });
  }

  deleteExperience(id: number): void {
    if (!confirm('Delete this experience?')) return;
    this.apiService.deleteExperience(id).subscribe({
      next: () => {
        this.showToast('Experience deleted', 'success');
        this.loadExperiences();
      },
      error: () => this.showToast('Failed to delete experience', 'error'),
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

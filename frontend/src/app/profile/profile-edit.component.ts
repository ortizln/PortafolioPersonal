import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Profile } from '../core/models';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  profileForm!: FormGroup;
  loading = true;
  saving = false;
  photoPreview: string | null = null;
  bannerPreview: string | null = null;
  cvName: string | null = null;
  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;
  private readonly maxSize = 20 * 1024 * 1024; // 20MB
  private readonly maxSizeMB = 20;

  ngOnInit(): void {
    this.buildForm();
    this.loadProfile();
  }

  private buildForm(): void {
    this.profileForm = this.fb.group({
      fullName: [''],
      professionalTitle: [''],
      description: [''],
      biography: [''],
      aboutMe: [''],
      professionalStory: [''],
      objectives: [''],
      workPhilosophy: [''],
      specialties: [''],
      email: [''],
      phone: [''],
      location: [''],
      website: [''],
    });
  }

  private loadProfile(): void {
    this.apiService.getProfile().subscribe({
      next: (profile) => this.patchForm(profile),
      error: () => this.showToast('Failed to load profile', 'error'),
      complete: () => (this.loading = false),
    });
  }

  private patchForm(profile: Profile): void {
    this.profileForm.patchValue({
      fullName: profile.fullName,
      professionalTitle: profile.professionalTitle,
      description: profile.description,
      biography: profile.biography,
      aboutMe: profile.aboutMe,
      professionalStory: profile.professionalStory,
      objectives: profile.objectives,
      workPhilosophy: profile.workPhilosophy,
      specialties: profile.specialties,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      website: profile.website,
    });
    this.photoPreview = this.apiService.getUploadUrl(profile.profileImage);
    this.bannerPreview = this.apiService.getUploadUrl(profile.bannerImage);
  }

  private uploadFile(
    file: File,
    uploadFn: (f: File) => any,
    setPreview: (url: string) => void,
    label: string
  ): void {
    if (file.size > this.maxSize) {
      this.showToast(`${label}: File exceeds ${this.maxSizeMB}MB limit`, 'error');
      return;
    }
    uploadFn(file).subscribe({
      next: (res: any) => {
        if (res.profileImage) setPreview(this.apiService.getUploadUrl(res.profileImage));
        if (res.bannerImage) setPreview(this.apiService.getUploadUrl(res.bannerImage));
        this.showToast(`${label} uploaded`, 'success');
      },
      error: (err: any) => {
        const msg = err.error?.error || `${label} upload failed`;
        this.showToast(msg, 'error');
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoPreview = URL.createObjectURL(file);
    this.uploadFile(file, (f) => this.apiService.uploadPhoto(f), (url) => this.photoPreview = url, 'Photo');
  }

  onBannerSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.bannerPreview = URL.createObjectURL(file);
    this.uploadFile(file, (f) => this.apiService.uploadBanner(f), (url) => this.bannerPreview = url, 'Banner');
  }

  onCVSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadFile(file, (f) => this.apiService.uploadCV(f), () => this.cvName = file.name, 'CV');
  }

  save(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    const form = this.profileForm.value;

    const payload: Partial<Profile> = {
      fullName: form.fullName,
      professionalTitle: form.professionalTitle,
      description: form.description,
      biography: form.biography,
      aboutMe: form.aboutMe,
      professionalStory: form.professionalStory,
      objectives: form.objectives,
      workPhilosophy: form.workPhilosophy,
      specialties: form.specialties,
      email: form.email,
      phone: form.phone,
      location: form.location,
      website: form.website,
    };

    this.apiService.updateProfile(payload).subscribe({
      next: () => this.showToast('Profile saved successfully', 'success'),
      error: () => this.showToast('Failed to save profile', 'error'),
      complete: () => (this.saving = false),
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

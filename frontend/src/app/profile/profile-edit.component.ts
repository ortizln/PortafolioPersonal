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
      biography: profile.aboutMe,
      aboutMe: profile.aboutMe,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      website: profile.website,
    });
    this.photoPreview = profile.profileImage;
    this.bannerPreview = profile.bannerImage;
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.apiService.uploadPhoto(file).subscribe({
      next: (res) => {
        this.photoPreview = res.url;
        this.showToast('Photo uploaded', 'success');
      },
      error: () => this.showToast('Photo upload failed', 'error'),
    });
  }

  onBannerSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.apiService.uploadBanner(file).subscribe({
      next: (res) => {
        this.bannerPreview = res.url;
        this.showToast('Banner uploaded', 'success');
      },
      error: () => this.showToast('Banner upload failed', 'error'),
    });
  }

  onCVSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.apiService.uploadCV(file).subscribe({
      next: (res) => {
        this.cvName = file.name;
        this.showToast('CV uploaded', 'success');
      },
      error: () => this.showToast('CV upload failed', 'error'),
    });
  }

  save(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    const form = this.profileForm.value;

    const payload: Partial<Profile> = {
      fullName: form.fullName,
      professionalTitle: form.professionalTitle,
      description: form.description,
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

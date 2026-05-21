import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { ApiService } from '../core/services/api.service';
import { Profile } from '../core/models';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, ImageCropperComponent],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  @ViewChild('fileInputPhoto') fileInputPhoto!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputBanner') fileInputBanner!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputCV') fileInputCV!: ElementRef<HTMLInputElement>;

  profileForm!: FormGroup;
  loading = true;
  saving = false;
  photoPreview: string | null = null;
  bannerPreview: string | null = null;
  cvName: string | null = null;
  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;
  private readonly maxSize = 20 * 1024 * 1024;
  private readonly maxSizeMB = 20;

  // Cropper state
  showCropper = false;
  cropperType: 'photo' | 'banner' = 'photo';
  cropperAspectRatio = 1;
  cropperImageEvent: any = null;
  cropperRound = false;
  private croppedBlob: Blob | null = null;

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
    this.cvName = profile.cvFile ? profile.cvFile.split('/').pop() || profile.cvFile : null;
  }

  // Cropper
  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > this.maxSize) {
      this.showToast(`Photo: File exceeds ${this.maxSizeMB}MB limit`, 'error');
      return;
    }
    this.cropperType = 'photo';
    this.cropperAspectRatio = 1;
    this.cropperRound = true;
    this.cropperImageEvent = event;
    this.showCropper = true;
  }

  onBannerSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > this.maxSize) {
      this.showToast(`Banner: File exceeds ${this.maxSizeMB}MB limit`, 'error');
      return;
    }
    this.cropperType = 'banner';
    this.cropperAspectRatio = 3;
    this.cropperRound = false;
    this.cropperImageEvent = event;
    this.showCropper = true;
  }

  onCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob;
  }

  applyCrop(): void {
    if (!this.croppedBlob) return;
    const fileName = this.cropperType === 'photo' ? 'profile.png' : 'banner.png';
    const file = new File([this.croppedBlob], fileName, { type: 'image/png' });

    if (this.cropperType === 'photo') {
      this.photoPreview = URL.createObjectURL(file);
      this.apiService.uploadPhoto(file).subscribe({
        next: (res: any) => {
          if (res.profileImage) this.photoPreview = this.apiService.getUploadUrl(res.profileImage);
          this.showToast('Photo uploaded', 'success');
        },
        error: (err: any) => this.showToast(err.error?.error || 'Photo upload failed', 'error'),
      });
    } else {
      this.bannerPreview = URL.createObjectURL(file);
      this.apiService.uploadBanner(file).subscribe({
        next: (res: any) => {
          if (res.bannerImage) this.bannerPreview = this.apiService.getUploadUrl(res.bannerImage);
          this.showToast('Banner uploaded', 'success');
        },
        error: (err: any) => this.showToast(err.error?.error || 'Banner upload failed', 'error'),
      });
    }
    this.closeCropper();
  }

  cancelCrop(): void {
    this.closeCropper();
    if (this.cropperType === 'photo') this.fileInputPhoto.nativeElement.value = '';
    else this.fileInputBanner.nativeElement.value = '';
  }

  private closeCropper(): void {
    this.showCropper = false;
    this.cropperImageEvent = null;
    this.croppedBlob = null;
  }

  onCVSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > this.maxSize) {
      this.showToast(`CV: File exceeds ${this.maxSizeMB}MB limit`, 'error');
      return;
    }
    this.apiService.uploadCV(file).subscribe({
      next: () => {
        this.cvName = file.name;
        this.showToast('CV uploaded', 'success');
      },
      error: (err: any) => this.showToast(err.error?.error || 'CV upload failed', 'error'),
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

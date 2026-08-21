import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { UploadUrlPipe } from '../shared/upload-url.pipe';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { TeamMember } from '../core/models';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UploadUrlPipe, HasPermissionDirective],
  templateUrl: './team-list.component.html',
  styleUrls: ['./team-list.component.scss']
})
export class TeamListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  members: TeamMember[] = [];
  showForm = false;
  editingMember: TeamMember | null = null;
  form: any = {};
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.apiService.getTeamAll().subscribe({
      next: (list) => (this.members = list),
      error: () => this.showToast('No se pudieron cargar los miembros', 'error'),
      complete: () => (this.loading = false)
    });
  }

  openCreate(): void {
    this.editingMember = null;
    this.form = { fullName: '', professionalTitle: '', email: '', phone: '', location: '', bio: '', about: '', role: '', department: '', order: 0, isActive: true, isPublic: true, isFounder: false };
    this.showForm = true;
  }

  openEdit(m: TeamMember): void {
    this.editingMember = m;
    this.form = {
      fullName: m.fullName,
      professionalTitle: m.professionalTitle,
      email: m.email || '',
      phone: m.phone || '',
      location: m.location || '',
      bio: m.bio || '',
      about: m.about || '',
      photoUrl: m.photoUrl || '',
      role: m.role || '',
      department: m.department || '',
      linkedinUrl: m.linkedinUrl || '',
      githubUrl: m.githubUrl || '',
      twitterUrl: m.twitterUrl || '',
      order: m.order,
      isActive: m.isActive,
      isPublic: m.isPublic,
      isFounder: m.isFounder,
      seoTitle: m.seoTitle || '',
      seoDescription: m.seoDescription || ''
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingMember = null;
  }

  submitForm(): void {
    if (!this.form.fullName.trim() || !this.form.professionalTitle.trim()) {
      this.showToast('Nombre y cargo son obligatorios', 'error');
      return;
    }
    this.isSubmitting = true;

    const request = this.editingMember
      ? this.apiService.updateTeamMember(this.editingMember.id, this.form)
      : this.apiService.createTeamMember(this.form);

    request.subscribe({
      next: () => {
        this.showToast(this.editingMember ? 'Miembro actualizado' : 'Miembro creado', 'success');
        this.loadMembers();
        this.cancelForm();
      },
      error: (err) => this.showToast(err?.error?.message || 'Error al guardar el miembro', 'error'),
      complete: () => (this.isSubmitting = false)
    });
  }

  uploadPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.apiService.uploadFile(file, 'team').subscribe({
      next: (res) => {
        this.form.photoUrl = res.url;
        this.showToast('Foto subida', 'success');
      },
      error: () => this.showToast('Error al subir la foto', 'error'),
      complete: () => (input.value = '')
    });
  }

  async deleteMember(m: TeamMember): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar a "${m.fullName}"?` });
    if (!ok) return;
    this.apiService.deleteTeamMember(m.id).subscribe({
      next: () => {
        this.members = this.members.filter((x) => x.id !== m.id);
        this.showToast('Miembro eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar el miembro', 'error')
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

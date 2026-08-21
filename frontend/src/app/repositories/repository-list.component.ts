import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Repository } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

@Component({
  selector: 'app-repository-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './repository-list.component.html',
  styleUrls: ['./repository-list.component.scss']
})
export class RepositoryListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  repos: Repository[] = [];
  showForm = false;
  editingRepo: Repository | null = null;
  form = {
    name: '', fullName: '', description: '', url: '',
    platform: 'github' as 'github' | 'gitlab',
    language: '', stars: 0, forks: 0, isPrivate: false,
    lastPushed: '', topics: ''
  };
  isSubmitting = false;
  syncing = { github: false, gitlab: false };
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  constructor() {}

  ngOnInit(): void {
    this.loadRepos();
  }

  loadRepos(): void {
    this.loading = true;
    this.apiService.getRepositoriesAll().subscribe({
      next: (list) => (this.repos = list),
      error: () => this.showToast('No se pudieron cargar los repositorios', 'error'),
      complete: () => (this.loading = false)
    });
  }

  syncGitHub(): void {
    this.syncing.github = true;
    this.apiService.syncGithub().subscribe({
      next: () => {
        this.showToast('Repositorios de GitHub sincronizados', 'success');
        this.loadRepos();
      },
      error: () => this.showToast('La sincronización de GitHub no está configurada aún', 'error'),
      complete: () => (this.syncing.github = false)
    });
  }

  syncGitLab(): void {
    this.syncing.gitlab = true;
    this.apiService.syncGitlab().subscribe({
      next: () => {
        this.showToast('Repositorios de GitLab sincronizados', 'success');
        this.loadRepos();
      },
      error: () => this.showToast('La sincronización de GitLab no está configurada aún', 'error'),
      complete: () => (this.syncing.gitlab = false)
    });
  }

  openCreate(): void {
    this.editingRepo = null;
    this.form = {
      name: '', fullName: '', description: '', url: '',
      platform: 'github', language: '', stars: 0, forks: 0,
      isPrivate: false, lastPushed: '', topics: ''
    };
    this.showForm = true;
  }

  openEdit(repo: Repository): void {
    this.editingRepo = repo;
    this.form = {
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description || '',
      url: repo.url,
      platform: (repo.platform as 'github' | 'gitlab') || 'github',
      language: repo.language || '',
      stars: repo.stars,
      forks: repo.forks,
      isPrivate: repo.isPrivate,
      lastPushed: repo.lastPushed || '',
      topics: repo.topics.join(', ')
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingRepo = null;
  }

  submitForm(): void {
    if (!this.form.name.trim()) return;
    this.isSubmitting = true;
    const payload = {
      name: this.form.name,
      fullName: this.form.fullName,
      description: this.form.description || null,
      url: this.form.url,
      platform: this.form.platform,
      language: this.form.language || null,
      stars: this.form.stars,
      forks: this.form.forks,
      isPrivate: this.form.isPrivate,
      lastPushed: this.form.lastPushed || null,
      topics: this.form.topics.split(',').map(t => t.trim()).filter(Boolean)
    };

    if (this.editingRepo) {
      this.apiService.updateRepository(this.editingRepo.id, payload).subscribe({
        next: () => {
          this.showToast('Repositorio actualizado', 'success');
          this.loadRepos();
          this.cancelForm();
        },
        error: () => this.showToast('Error al actualizar el repositorio', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    } else {
      this.apiService.createRepository(payload).subscribe({
        next: () => {
          this.showToast('Repositorio creado', 'success');
          this.loadRepos();
          this.cancelForm();
        },
        error: () => this.showToast('Error al crear el repositorio', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    }
  }

  async deleteRepo(id: string): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar este repositorio?' });
    if (!ok) return;
    this.apiService.deleteRepository(id).subscribe({
      next: () => {
        this.repos = this.repos.filter(r => r.id !== id);
        this.showToast('Repositorio eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar el repositorio', 'error')
    });
  }

  openRepo(url: string): void {
    window.open(url, '_blank');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}

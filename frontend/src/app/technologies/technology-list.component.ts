import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Technology } from '../core/models';

@Component({
  selector: 'app-technology-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './technology-list.component.html',
  styleUrls: ['./technology-list.component.scss'],
})
export class TechnologyListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  technologies: Technology[] = [];
  loading = true;
  search = '';
  showForm = false;
  editing: Technology | null = null;
  form: { name: string; slug: string; description: string; icon: string; color: string; category: string; website: string } = {
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#38bdf8',
    category: '',
    website: '',
  };

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadTechnologies();
  }

  loadTechnologies(): void {
    this.loading = true;
    this.apiService.getTechnologiesAll().subscribe({
      next: (tech) => (this.technologies = tech),
      error: () => this.showToast('No se pudieron cargar las tecnologías', 'error'),
      complete: () => (this.loading = false),
    });
  }

  get filtered(): Technology[] {
    if (!this.search) return this.technologies;
    const q = this.search.toLowerCase();
    return this.technologies.filter((t) => t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
  }

  categories(): string[] {
    return Array.from(new Set(this.technologies.map((t) => t.category).filter((c): c is string => !!c))).sort();
  }

  openCreate(): void {
    this.editing = null;
    this.form = { name: '', slug: '', description: '', icon: '', color: '#38bdf8', category: '', website: '' };
    this.showForm = true;
  }

  openEdit(t: Technology): void {
    this.editing = t;
    this.form = {
      name: t.name,
      slug: t.slug,
      description: t.description || '',
      icon: t.icon || '',
      color: t.color || '#38bdf8',
      category: t.category || '',
      website: t.website || '',
    };
    this.showForm = true;
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  onNameChange(): void {
    if (!this.editing && !this.form.slug) {
      this.form.slug = this.slugify(this.form.name);
    }
  }

  save(): void {
    const payload = { ...this.form, name: this.form.name.trim() };
    if (!payload.name) return;
    if (this.editing) {
      this.apiService.updateTechnology(this.editing.id, payload).subscribe({
        next: () => {
          this.showToast('Tecnología actualizada', 'success');
          this.showForm = false;
          this.loadTechnologies();
        },
        error: (err) => this.showToast(err?.error?.error || 'Error al actualizar', 'error'),
      });
    } else {
      this.apiService.createTechnology(payload).subscribe({
        next: () => {
          this.showToast('Tecnología creada', 'success');
          this.showForm = false;
          this.loadTechnologies();
        },
        error: (err) => this.showToast(err?.error?.error || 'Error al crear', 'error'),
      });
    }
  }

  async deleteTechnology(t: Technology): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar la tecnología "${t.name}"?` });
    if (!ok) return;
    this.apiService.deleteTechnology(t.id).subscribe({
      next: () => {
        this.technologies = this.technologies.filter((x) => x.id !== t.id);
        this.showToast('Tecnología eliminada', 'success');
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al eliminar', 'error'),
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

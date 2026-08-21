import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Category } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

interface CategoryWithCount extends Category {
  projectCount?: number;
  _count?: { projects?: number };
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  categories: CategoryWithCount[] = [];
  showForm = false;
  editingCategory: CategoryWithCount | null = null;
  form = { name: '', description: '' };
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.apiService.getCategoriesAll().subscribe({
      next: (list) => {
        this.categories = (list as CategoryWithCount[]).map((c) => ({
          ...c,
          projectCount: c._count?.projects ?? c.projectCount ?? 0
        }));
      },
      error: () => this.showToast('No se pudieron cargar las categorías', 'error'),
      complete: () => (this.loading = false)
    });
  }

  slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  onNameChange(name: string): void {
    if (!this.editingCategory) {
      this.form.name = name;
    }
  }

  openCreate(): void {
    this.editingCategory = null;
    this.form = { name: '', description: '' };
    this.showForm = true;
  }

  openEdit(cat: CategoryWithCount): void {
    this.editingCategory = cat;
    this.form = { name: cat.name, description: cat.description || '' };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingCategory = null;
  }

  submitForm(): void {
    if (!this.form.name.trim()) return;
    this.isSubmitting = true;
    const payload = { name: this.form.name, description: this.form.description };

    if (this.editingCategory) {
      this.apiService.updateCategory(this.editingCategory.id, payload).subscribe({
        next: () => {
          this.showToast('Categoría actualizada', 'success');
          this.loadCategories();
          this.cancelForm();
        },
        error: () => this.showToast('Error al actualizar la categoría', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    } else {
      this.apiService.createCategory(payload).subscribe({
        next: () => {
          this.showToast('Categoría creada', 'success');
          this.loadCategories();
          this.cancelForm();
        },
        error: () => this.showToast('Error al crear la categoría', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar esta categoría?' });
    if (!ok) return;
    this.apiService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== id);
        this.showToast('Categoría eliminada', 'success');
      },
      error: () => this.showToast('Error al eliminar la categoría', 'error')
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

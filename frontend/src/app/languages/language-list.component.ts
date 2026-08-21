import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Language } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

type LanguageLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';

@Component({
  selector: 'app-language-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './language-list.component.html',
  styleUrls: ['./language-list.component.scss']
})
export class LanguageListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  languages: Language[] = [];
  showForm = false;
  editingLanguage: Language | null = null;
  form = { name: '', level: 'Beginner' as LanguageLevel, percentage: 0, certification: '' };
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadLanguages();
  }

  loadLanguages(): void {
    this.loading = true;
    this.apiService.getLanguagesAll().subscribe({
      next: (list) => (this.languages = list),
      error: () => this.showToast('No se pudieron cargar los idiomas', 'error'),
      complete: () => (this.loading = false)
    });
  }

  openCreate(): void {
    this.editingLanguage = null;
    this.form = { name: '', level: 'Beginner', percentage: 0, certification: '' };
    this.showForm = true;
  }

  openEdit(lang: Language): void {
    this.editingLanguage = lang;
    this.form = {
      name: lang.name,
      level: (lang.level as LanguageLevel) || 'Beginner',
      percentage: lang.percentage,
      certification: lang.certification || ''
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingLanguage = null;
  }

  submitForm(): void {
    if (!this.form.name.trim()) return;
    this.isSubmitting = true;
    const payload = {
      name: this.form.name,
      level: this.form.level,
      percentage: this.form.percentage,
      certification: this.form.certification || null
    };

    if (this.editingLanguage) {
      this.apiService.updateLanguage(this.editingLanguage.id, payload).subscribe({
        next: () => {
          this.showToast('Idioma actualizado', 'success');
          this.loadLanguages();
          this.cancelForm();
        },
        error: () => this.showToast('Error al actualizar el idioma', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    } else {
      this.apiService.createLanguage(payload).subscribe({
        next: () => {
          this.showToast('Idioma creado', 'success');
          this.loadLanguages();
          this.cancelForm();
        },
        error: () => this.showToast('Error al crear el idioma', 'error'),
        complete: () => (this.isSubmitting = false)
      });
    }
  }

  async deleteLanguage(id: string): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar este idioma?' });
    if (!ok) return;
    this.apiService.deleteLanguage(id).subscribe({
      next: () => {
        this.languages = this.languages.filter((l) => l.id !== id);
        this.showToast('Idioma eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar el idioma', 'error')
    });
  }

  getLevelLabel(level: string): string {
    const map: Record<string, string> = {
      Beginner: 'Básico',
      Intermediate: 'Intermedio',
      Advanced: 'Avanzado',
      Native: 'Nativo'
    };
    return map[level] || level;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}

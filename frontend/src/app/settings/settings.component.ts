import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { Setting } from '../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private apiService = inject(ApiService);

  settings: Setting[] = [];
  showForm = false;
  editingSetting: Setting | null = null;
  form = { key: '', value: '', description: '', editMode: 'text' as 'text' | 'json' };
  isSubmitting = false;
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.apiService.getSettingsAll().subscribe({
      next: (list) => {
        this.settings = list.map((s) => ({
          ...s,
          value: typeof s.value === 'object' && s.value !== null
            ? JSON.stringify(s.value, null, 2)
            : String(s.value ?? '')
        }));
      },
      error: () => this.showToast('No se pudieron cargar los ajustes', 'error'),
      complete: () => (this.loading = false)
    });
  }

  isJsonObject(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  openCreate(): void {
    this.editingSetting = null;
    this.form = { key: '', value: '', description: '', editMode: 'text' };
    this.showForm = true;
  }

  openEdit(setting: Setting): void {
    this.editingSetting = setting;
    this.form = {
      key: setting.key,
      value: setting.value,
      description: setting.description || '',
      editMode: this.isJsonObject(setting.value) ? 'json' : 'text'
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingSetting = null;
  }

  submitForm(): void {
    if (!this.form.key.trim()) return;
    this.isSubmitting = true;

    let value: any = this.form.value;
    if (this.form.editMode === 'json') {
      if (!this.isValidJson(this.form.value)) {
        this.showToast('El valor JSON no es válido', 'error');
        this.isSubmitting = false;
        return;
      }
      value = JSON.parse(this.form.value);
    }

    this.apiService.updateSetting(this.form.key, {
      value,
      description: this.form.description || null
    }).subscribe({
      next: () => {
        this.showToast(this.editingSetting ? 'Ajuste actualizado' : 'Ajuste creado', 'success');
        this.loadSettings();
        this.cancelForm();
      },
      error: () => this.showToast('Error al guardar el ajuste', 'error'),
      complete: () => (this.isSubmitting = false)
    });
  }

  toggleEditMode(setting: Setting): void {
    const isJson = this.isJsonObject(setting.value);
    if (!isJson && setting.value.trim().startsWith('{')) {
      try {
        JSON.parse(setting.value);
      } catch {
        return;
      }
    }
    setting.value = isJson ? this.stringify(setting.value) : setting.value;
    this.apiService.updateSetting(setting.key, {
      value: isJson ? JSON.parse(this.stringify(setting.value)) : setting.value
    }).subscribe({
      error: () => this.showToast('Error al guardar el ajuste', 'error')
    });
  }

  formatJson(setting: Setting): void {
    try {
      const parsed = JSON.parse(setting.value);
      setting.value = JSON.stringify(parsed, null, 2);
      this.apiService.updateSetting(setting.key, { value: parsed }).subscribe({
        error: () => this.showToast('Error al guardar el ajuste', 'error')
      });
    } catch {
    }
  }

  private stringify(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  private isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  trackById(index: number, item: Setting): string {
    return item.id;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}

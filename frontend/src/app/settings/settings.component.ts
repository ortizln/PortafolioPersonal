import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  editMode: 'text' | 'json';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings: Setting[] = [];
  showForm = false;
  editingSetting: Setting | null = null;
  form = { key: '', value: '', description: '', editMode: 'text' as Setting['editMode'] };
  isSubmitting = false;

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    const stored = localStorage.getItem('portfolio_settings');
    this.settings = stored ? JSON.parse(stored) : [
      { id: '1', key: 'site_title', value: 'My Portfolio', description: 'Site title shown in the browser tab', editMode: 'text' },
      { id: '2', key: 'site_description', value: 'Personal portfolio showcasing my work', description: 'Meta description for SEO', editMode: 'text' },
      { id: '3', key: 'social_links', value: JSON.stringify({ github: 'https://github.com/user' }, null, 2), description: 'Social links configuration', editMode: 'json' },
    ];
  }

  saveSettings(): void {
    localStorage.setItem('portfolio_settings', JSON.stringify(this.settings));
  }

  isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
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
      description: setting.description,
      editMode: setting.editMode
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
    const data: Setting = {
      id: this.editingSetting?.id || crypto.randomUUID(),
      key: this.form.key,
      value: this.form.value,
      description: this.form.description,
      editMode: this.form.editMode
    };
    if (this.editingSetting) {
      const idx = this.settings.findIndex(s => s.id === this.editingSetting!.id);
      if (idx !== -1) this.settings[idx] = data;
    } else {
      this.settings.push(data);
    }
    this.settings.sort((a, b) => a.key.localeCompare(b.key));
    this.saveSettings();
    this.showForm = false;
    this.editingSetting = null;
    this.isSubmitting = false;
  }

  deleteSetting(id: string): void {
    if (confirm('Delete this setting?')) {
      this.settings = this.settings.filter(s => s.id !== id);
      this.saveSettings();
    }
  }

  toggleEditMode(setting: Setting): void {
    setting.editMode = setting.editMode === 'text' ? 'json' : 'text';
    if (setting.editMode === 'json') {
      try {
        JSON.parse(setting.value);
      } catch {
        setting.value = JSON.stringify(setting.value, null, 2);
      }
    }
    this.saveSettings();
  }

  formatJson(setting: Setting): void {
    try {
      const parsed = JSON.parse(setting.value);
      setting.value = JSON.stringify(parsed, null, 2);
      this.saveSettings();
    } catch {
    }
  }

  trackById(index: number, item: Setting): string {
    return item.id;
  }
}

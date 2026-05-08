import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Language {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
  percentage: number;
  certification?: string;
}

@Component({
  selector: 'app-language-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './language-list.component.html',
  styleUrls: ['./language-list.component.scss']
})
export class LanguageListComponent implements OnInit {
  languages: Language[] = [];
  showForm = false;
  editingLanguage: Language | null = null;
  form = { name: '', level: 'Beginner' as Language['level'], percentage: 0, certification: '' };
  isSubmitting = false;

  ngOnInit(): void {
    this.loadLanguages();
  }

  loadLanguages(): void {
    const stored = localStorage.getItem('portfolio_languages');
    this.languages = stored ? JSON.parse(stored) : [
      { id: '1', name: 'English', level: 'Native', percentage: 100, certification: 'TOEFL 110' },
      { id: '2', name: 'Spanish', level: 'Native', percentage: 100 },
      { id: '3', name: 'French', level: 'Intermediate', percentage: 55, certification: 'DELF B1' },
    ];
  }

  saveLanguages(): void {
    localStorage.setItem('portfolio_languages', JSON.stringify(this.languages));
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
      level: lang.level,
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
    if (this.editingLanguage) {
      const idx = this.languages.findIndex(l => l.id === this.editingLanguage!.id);
      if (idx !== -1) {
        this.languages[idx] = {
          ...this.languages[idx],
          name: this.form.name,
          level: this.form.level,
          percentage: this.form.percentage,
          certification: this.form.certification || undefined
        };
      }
    } else {
      this.languages.push({
        id: crypto.randomUUID(),
        name: this.form.name,
        level: this.form.level,
        percentage: this.form.percentage,
        certification: this.form.certification || undefined
      });
    }
    this.saveLanguages();
    this.showForm = false;
    this.editingLanguage = null;
    this.isSubmitting = false;
  }

  deleteLanguage(id: string): void {
    if (confirm('Delete this language?')) {
      this.languages = this.languages.filter(l => l.id !== id);
      this.saveLanguages();
    }
  }

  getLevelLabel(level: string): string {
    return level;
  }
}

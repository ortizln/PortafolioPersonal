import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  projectCount: number;
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  showForm = false;
  editingCategory: Category | null = null;
  form = { name: '', description: '' };
  isSubmitting = false;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    const stored = localStorage.getItem('portfolio_categories');
    this.categories = stored ? JSON.parse(stored) : [
      { id: '1', name: 'Frontend', description: 'Frontend development projects', slug: 'frontend', projectCount: 5 },
      { id: '2', name: 'Backend', description: 'Backend APIs and services', slug: 'backend', projectCount: 3 },
      { id: '3', name: 'Fullstack', description: 'Fullstack applications', slug: 'fullstack', projectCount: 7 },
    ];
  }

  saveCategories(): void {
    localStorage.setItem('portfolio_categories', JSON.stringify(this.categories));
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

  openEdit(cat: Category): void {
    this.editingCategory = cat;
    this.form = { name: cat.name, description: cat.description };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingCategory = null;
  }

  submitForm(): void {
    if (!this.form.name.trim()) return;
    this.isSubmitting = true;
    const slug = this.slugify(this.form.name);
    if (this.editingCategory) {
      const idx = this.categories.findIndex(c => c.id === this.editingCategory!.id);
      if (idx !== -1) {
        this.categories[idx] = {
          ...this.categories[idx],
          name: this.form.name,
          description: this.form.description,
          slug
        };
      }
    } else {
      this.categories.push({
        id: crypto.randomUUID(),
        name: this.form.name,
        description: this.form.description,
        slug,
        projectCount: 0
      });
    }
    this.saveCategories();
    this.showForm = false;
    this.editingCategory = null;
    this.isSubmitting = false;
  }

  deleteCategory(id: string): void {
    if (confirm('Delete this category?')) {
      this.categories = this.categories.filter(c => c.id !== id);
      this.saveCategories();
    }
  }
}

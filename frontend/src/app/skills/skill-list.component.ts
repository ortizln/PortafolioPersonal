import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgFor, NgIf, NgClass, NgStyle } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Skill } from '../core/models';

const SKILL_CATEGORIES = [
  'Frontend', 'Backend', 'Database', 'DevOps',
  'Mobile', 'Testing', 'Design', 'Tools',
  'Languages', 'Frameworks', 'Other',
];

@Component({
  selector: 'app-skill-list',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, NgClass, NgStyle],
  templateUrl: './skill-list.component.html',
  styleUrls: ['./skill-list.component.scss'],
})
export class SkillListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  skills: Skill[] = [];
  activeCategory = 'All';
  categories = SKILL_CATEGORIES;
  showForm = false;
  editingId: number | null = null;
  saving = false;
  loading = true;
  skillForm!: FormGroup;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  get filteredSkills(): Skill[] {
    if (this.activeCategory === 'All') return this.skills;
    return this.skills.filter((s) => s.category === this.activeCategory);
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadSkills();
  }

  private buildForm(): void {
    this.skillForm = this.fb.group({
      name: [''],
      percentage: [50],
      level: [''],
      icon: [''],
      color: ['#64ffda'],
      order: [0],
      category: ['Frontend'],
    });
  }

  private loadSkills(): void {
    this.apiService.getSkillsAll().subscribe({
      next: (list) => (this.skills = list.sort((a, b) => a.order - b.order)),
      error: () => this.showToast('Failed to load skills', 'error'),
      complete: () => (this.loading = false),
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.skillForm.reset({ percentage: 50, order: 0, category: 'Frontend', color: '#64ffda' });
    this.showForm = true;
  }

  openEdit(skill: Skill): void {
    this.editingId = skill.id;
    this.skillForm.patchValue({
      name: skill.name,
      percentage: skill.percentage,
      level: (skill as any).level || '',
      icon: (skill as any).icon || '',
      color: (skill as any).color || '#64ffda',
      order: skill.order,
      category: skill.category,
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.skillForm.reset({ percentage: 50, order: 0, category: 'Frontend', color: '#64ffda' });
  }

  save(): void {
    if (this.skillForm.invalid) return;
    this.saving = true;
    const form = this.skillForm.value;

    const payload: Partial<Skill> = {
      name: form.name,
      percentage: Number(form.percentage),
      category: form.category,
      order: Number(form.order),
      level: form.level,
      icon: form.icon,
      color: form.color,
    } as any;

    const request = this.editingId
      ? this.apiService.updateSkill(this.editingId, payload)
      : this.apiService.createSkill(payload);

    request.subscribe({
      next: () => {
        this.showToast(this.editingId ? 'Skill updated' : 'Skill created', 'success');
        this.cancelForm();
        this.loadSkills();
      },
      error: () => this.showToast('Failed to save skill', 'error'),
      complete: () => (this.saving = false),
    });
  }

  deleteSkill(id: number): void {
    if (!confirm('Delete this skill?')) return;
    this.apiService.deleteSkill(id).subscribe({
      next: () => {
        this.showToast('Skill deleted', 'success');
        this.loadSkills();
      },
      error: () => this.showToast('Failed to delete skill', 'error'),
    });
  }

  setCategory(cat: string): void {
    this.activeCategory = cat;
  }

  getCategoryCount(category: string): number {
    return this.skills.filter((s) => s.category === category).length;
  }

  deleteWithEvent(event: Event, id: number): void {
    event.stopPropagation();
    this.deleteSkill(id);
  }

  getCategoryPercentage(category: string): number {
    const catSkills = this.skills.filter((s) => s.category === category);
    if (!catSkills.length) return 0;
    return Math.round(catSkills.reduce((sum, s) => sum + s.percentage, 0) / catSkills.length);
  }

  getCategoryColor(category: string): string {
    const skill = this.skills.find((s) => s.category === category && (s as any).color);
    return (skill as any)?.color || '#64ffda';
  }

  getBarColor(skill: Skill): string {
    return (skill as any).color || '#64ffda';
  }

  getGroupSkills(category: string): Skill[] {
    return this.skills.filter((s) => s.category === category);
  }

  getLevelLabel(percentage: number): string {
    if (percentage >= 90) return 'Expert';
    if (percentage >= 75) return 'Advanced';
    if (percentage >= 50) return 'Intermediate';
    if (percentage >= 25) return 'Beginner';
    return 'Learning';
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 4000);
  }
}

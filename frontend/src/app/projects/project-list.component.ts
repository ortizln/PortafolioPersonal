import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgFor, NgIf, NgClass, NgStyle, DatePipe } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Project, ProjectImage, Technology, Category } from '../core/models';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, NgClass, NgStyle, DatePipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  projects: Project[] = [];
  categories: Category[] = [];
  technologies: Technology[] = [];
  projectImages: ProjectImage[] = [];
  showForm = false;
  editingId: number | null = null;
  saving = false;
  loading = true;
  projectForm!: FormGroup;

  selectedTechIds: number[] = [];
  selectedCategoryIds: number[] = [];

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.buildForm();
    this.loadProjects();
    this.loadCategories();
    this.loadTechnologies();
  }

  private buildForm(): void {
    this.projectForm = this.fb.group({
      title: [''],
      description: [''],
      summary: [''],
      client: [''],
      status: ['draft'],
      startDate: [''],
      endDate: [''],
      demoUrl: [''],
      githubUrl: [''],
      gitlabUrl: [''],
      videoUrl: [''],
      architecture: [''],
      features: [''],
      isFeatured: [false],
      order: [0],
      bannerImage: [null],
    });
  }

  private loadProjects(): void {
    this.apiService.getProjectsAll().subscribe({
      next: (list) => (this.projects = list.sort((a, b) => b.order - a.order)),
      error: () => this.showToast('Failed to load projects', 'error'),
      complete: () => (this.loading = false),
    });
  }

  private loadCategories(): void {
    this.apiService.getCategoriesAll().subscribe({
      next: (list) => (this.categories = list),
    });
  }

  private loadTechnologies(): void {
    this.apiService.getSkillsAll().subscribe({
      next: () => {
        this.technologies = [
          { id: 1, name: 'Angular', icon: '', color: '#dd0031', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 2, name: 'React', icon: '', color: '#61dafb', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 3, name: 'Node.js', icon: '', color: '#339933', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 4, name: 'TypeScript', icon: '', color: '#3178c6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 5, name: 'Python', icon: '', color: '#3776ab', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 6, name: 'Java', icon: '', color: '#007396', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 7, name: 'Docker', icon: '', color: '#2496ed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 8, name: 'PostgreSQL', icon: '', color: '#336791', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
      },
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.projectImages = [];
    this.selectedTechIds = [];
    this.selectedCategoryIds = [];
    this.projectForm.reset({ isFeatured: false, order: 0, status: 'draft' });
    this.showForm = true;
  }

  openEdit(project: Project): void {
    this.editingId = project.id;
    this.projectImages = [...(project.images || [])];
    this.selectedTechIds = (project.technologies || []).map((t) => t.id);
    this.selectedCategoryIds = project.categories?.[0]?.id ? [project.categories[0].id] : [];

    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      summary: (project as any).summary || project.description,
      client: (project as any).client || '',
      status: (project as any).status || 'draft',
      startDate: project.startDate?.slice(0, 10),
      endDate: project.endDate?.slice(0, 10) ?? null,
      demoUrl: (project as any).url || '',
      githubUrl: project.githubUrl || '',
      gitlabUrl: (project as any).gitlabUrl || '',
      videoUrl: (project as any).videoUrl || '',
      architecture: (project as any).architecture || '',
      features: (project as any).features ? JSON.stringify((project as any).features, null, 2) : '',
      isFeatured: project.isFeatured,
      order: project.order,
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.projectImages = [];
    this.projectForm.reset({ isFeatured: false, order: 0, status: 'draft' });
  }

  save(): void {
    if (this.projectForm.invalid) return;
    this.saving = true;
    const form = this.projectForm.value;

    let features: any = null;
    try {
      if (form.features) features = JSON.parse(form.features);
    } catch {
      this.showToast('Features must be valid JSON', 'error');
      this.saving = false;
      return;
    }

    const payload: any = {
      title: form.title,
      description: form.description,
      content: form.summary,
      url: form.demoUrl,
      githubUrl: form.githubUrl,
      startDate: form.startDate,
      endDate: form.endDate || null,
      isFeatured: form.isFeatured,
      order: form.order,
      categoryId: this.selectedCategoryIds[0] || null,
      client: form.client,
      status: form.status,
      gitlabUrl: form.gitlabUrl,
      videoUrl: form.videoUrl,
      architecture: form.architecture,
      features,
      technologyIds: this.selectedTechIds,
    };

    const request = this.editingId
      ? this.apiService.updateProject(this.editingId, payload)
      : this.apiService.createProject(payload);

    request.subscribe({
      next: (saved) => {
        this.showToast(this.editingId ? 'Project updated' : 'Project created', 'success');
        if (!this.editingId && form.bannerImage) {
          const file: File = form.bannerImage;
          this.apiService.addProjectImage(saved.id, file, true).subscribe();
        }
        this.cancelForm();
        this.loadProjects();
      },
      error: () => this.showToast('Failed to save project', 'error'),
      complete: () => (this.saving = false),
    });
  }

  deleteProject(id: number): void {
    if (!confirm('Delete this project?')) return;
    this.apiService.deleteProject(id).subscribe({
      next: () => {
        this.showToast('Project deleted', 'success');
        this.loadProjects();
      },
      error: () => this.showToast('Failed to delete project', 'error'),
    });
  }

  toggleTech(techId: number): void {
    const idx = this.selectedTechIds.indexOf(techId);
    if (idx >= 0) this.selectedTechIds.splice(idx, 1);
    else this.selectedTechIds.push(techId);
  }

  toggleCategory(catId: number): void {
    const idx = this.selectedCategoryIds.indexOf(catId);
    if (idx >= 0) this.selectedCategoryIds.splice(idx, 1);
    else this.selectedCategoryIds = [catId];
  }

  isTechSelected(id: number): boolean {
    return this.selectedTechIds.includes(id);
  }

  isCatSelected(id: number): boolean {
    return this.selectedCategoryIds.includes(id);
  }

  uploadImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.editingId) return;
    Array.from(input.files).forEach((file, idx) => {
      const isPrimary = idx === 0 && this.projectImages.length === 0;
      this.apiService.addProjectImage(this.editingId, file, isPrimary).subscribe({
        next: (img) => {
          this.projectImages.push(img);
          this.showToast('Image uploaded', 'success');
          this.loadProjects();
        },
        error: () => this.showToast('Failed to upload image', 'error'),
      });
    });
    input.value = '';
  }

  removeImage(img: ProjectImage): void {
    if (!confirm('Remove this image?')) return;
    this.apiService.removeProjectImage(Number(img.projectId), img.id).subscribe({
      next: () => {
        this.projectImages = this.projectImages.filter((i) => i.id !== img.id);
        this.showToast('Image removed', 'success');
        this.loadProjects();
      },
      error: () => this.showToast('Failed to remove image', 'error'),
    });
  }

  setPrimary(img: ProjectImage): void {
    this.apiService.updateProject(Number(img.projectId), { bannerImage: img.url } as any).subscribe({
      next: () => {
        this.projectImages.forEach((i) => (i.isPrimary = false));
        img.isPrimary = true;
        this.showToast('Primary image set', 'success');
        this.loadProjects();
      },
      error: () => this.showToast('Failed to set primary image', 'error'),
    });
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.projectForm.patchValue({ bannerImage: input.files[0] });
    }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      draft: 'badge-draft',
      in_progress: 'badge-progress',
      completed: 'badge-done',
      archived: 'badge-archived',
    };
    return map[status] || 'badge-draft';
  }

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((i) => i.isPrimary);
    return primary?.url || project.images?.[0]?.url || null;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 4000);
  }
}

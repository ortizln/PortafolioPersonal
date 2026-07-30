import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgFor, NgIf, NgClass, NgStyle, DatePipe } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Project, ProjectImage, Technology, Category } from '../core/models';
import { environment } from '../../environments/environment';

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
  private confirmService = inject(ConfirmService);

  projects: Project[] = [];
  categories: Category[] = [];
  technologies: Technology[] = [];
  projectImages: ProjectImage[] = [];
  bannerPreview: string | null = null;
  bannerFile: File | null = null;
  additionalFiles: { file: File; preview: string }[] = [];
  showForm = false;
  editingId: string | null = null;
  saving = false;
  loading = true;
  projectForm!: FormGroup;

  selectedTechIds: string[] = [];
  selectedCategoryIds: string[] = [];

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
    });
  }

  private loadProjects(): void {
    this.apiService.getProjectsAll().subscribe({
      next: (list) => (this.projects = (list as any[]).map((p) => ({
        ...p,
        technologies: (p.technologies || []).map((t: any) =>
          t.technology ? { ...t.technology, id: t.technology.id } : t
        ),
        categories: (p.categories || []).map((c: any) =>
          c.category ? { ...c.category, id: c.category.id } : c
        ),
      })).sort((a: any, b: any) => b.order - a.order)),
      error: () => this.showToast('Error al cargar proyectos', 'error'),
      complete: () => (this.loading = false),
    });
  }

  private loadCategories(): void {
    this.apiService.getCategoriesAll().subscribe({
      next: (list) => (this.categories = list),
    });
  }

  private loadTechnologies(): void {
    this.apiService.getTechnologiesAll().subscribe({
      next: (list) => (this.technologies = list),
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.projectImages = [];
    this.bannerPreview = null;
    this.bannerFile = null;
    this.additionalFiles = [];
    this.selectedTechIds = [];
    this.selectedCategoryIds = [];
    this.projectForm.reset({ isFeatured: false, order: 0, status: 'draft' });
    this.showForm = true;
  }

  openEdit(project: Project): void {
    this.editingId = project.id;
    this.projectImages = [...(project.images || [])];
    this.bannerPreview = this.getPrimaryImage(project);
    this.bannerFile = null;
    this.additionalFiles = [];
    this.selectedTechIds = (project.technologies as any[] || []).map((t) => t.technology?.id ?? t.id).filter(Boolean);
    this.selectedCategoryIds = ((project.categories as any[]) || [])
      .map((c) => c.category?.id ?? c.id)
      .filter(Boolean)
      .slice(0, 1);

    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      summary: (project as any).summary || project.description,
      client: (project as any).client || '',
      status: (project as any).status || 'draft',
      startDate: project.startDate?.slice(0, 10),
      endDate: project.endDate?.slice(0, 10) ?? null,
      demoUrl: project.demoUrl || '',
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
    this.bannerPreview = null;
    this.bannerFile = null;
    this.additionalFiles = [];
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
      this.showToast('Features debe ser JSON válido', 'error');
      this.saving = false;
      return;
    }

    const payload: any = {
      title: form.title,
      description: form.description,
      content: form.summary,
      demoUrl: form.demoUrl,
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
        this.showToast(this.editingId ? 'Proyecto actualizado' : 'Proyecto creado', 'success');
        const projectId = saved.id || this.editingId;
        const uploads: Promise<void>[] = [];

        if (this.bannerFile) {
          uploads.push(new Promise((resolve) => {
            this.apiService.addProjectImage(projectId, this.bannerFile!, true).subscribe({
              next: () => { this.showToast('Imagen subida', 'success'); resolve(); },
              error: () => { this.showToast('Error al subir imagen', 'error'); resolve(); },
            });
          }));
        }

        this.additionalFiles.forEach((item) => {
          uploads.push(new Promise((resolve) => {
            this.apiService.addProjectImage(projectId, item.file, false).subscribe({
              next: () => resolve(),
              error: () => resolve(),
            });
          }));
        });

        Promise.all(uploads).then(() => {
          this.cancelForm();
          this.loadProjects();
        });

        if (uploads.length === 0) {
          this.cancelForm();
          this.loadProjects();
        }
      },
      error: () => this.showToast('Error al guardar proyecto', 'error'),
      complete: () => (this.saving = false),
    });
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.bannerFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => (this.bannerPreview = e.target?.result as string);
      reader.readAsDataURL(input.files[0]);
    }
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.additionalFiles.push({ file, preview: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removePendingImage(index: number): void {
    this.additionalFiles.splice(index, 1);
  }

  async deleteProject(id: string): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar este proyecto?' });
    if (!ok) return;
    this.apiService.deleteProject(id).subscribe({
      next: () => {
        this.showToast('Proyecto eliminado', 'success');
        this.loadProjects();
      },
      error: () => this.showToast('Error al eliminar proyecto', 'error'),
    });
  }

  toggleTech(techId: string): void {
    const idx = this.selectedTechIds.indexOf(techId);
    if (idx >= 0) this.selectedTechIds.splice(idx, 1);
    else this.selectedTechIds.push(techId);
  }

  toggleCategory(catId: string): void {
    const idx = this.selectedCategoryIds.indexOf(catId);
    if (idx >= 0) this.selectedCategoryIds.splice(idx, 1);
    else this.selectedCategoryIds = [catId];
  }

  isTechSelected(id: string): boolean {
    return this.selectedTechIds.includes(id);
  }

  isCatSelected(id: string): boolean {
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
          this.showToast('Imagen subida', 'success');
          this.loadProjects();
        },
        error: () => this.showToast('Error al subir imagen', 'error'),
      });
    });
    input.value = '';
  }

  async removeImage(img: ProjectImage): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar esta imagen?' });
    if (!ok) return;
    this.apiService.removeProjectImage(img.projectId, img.id).subscribe({
      next: () => {
        this.projectImages = this.projectImages.filter((i) => i.id !== img.id);
        this.showToast('Imagen eliminada', 'success');
        this.loadProjects();
      },
      error: () => this.showToast('Error al eliminar imagen', 'error'),
    });
  }

  setPrimary(img: ProjectImage): void {
    this.apiService.updateProject(img.projectId, { bannerImage: img.url } as any).subscribe({
      next: () => {
        this.projectImages.forEach((i) => (i.isPrimary = false));
        img.isPrimary = true;
        this.showToast('Imagen principal establecida', 'success');
        this.loadProjects();
      },
      error: () => this.showToast('Error al establecer imagen principal', 'error'),
    });
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

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      draft: 'Borrador',
      in_progress: 'En Progreso',
      completed: 'Completado',
      archived: 'Archivado',
    };
    return map[status] || 'Borrador';
  }

  getImageUrl(image: any): string {
    if (!image?.url) return '';
    if (image.url.startsWith('http://') || image.url.startsWith('https://') || image.url.startsWith('data:')) return image.url;
    return `${environment.uploadUrl}/${image.url}`;
  }

  getPrimaryImage(project: Project): string | null {
    const primary = project.images?.find((i) => i.isPrimary);
    const url = primary?.url || project.images?.[0]?.url || null;
    return url ? `${environment.uploadUrl}/${url}` : null;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 4000);
  }
}

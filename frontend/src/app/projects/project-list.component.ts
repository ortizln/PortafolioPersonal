import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgFor, NgIf, NgClass, NgStyle, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Project, ProjectImage, Technology, Category, Client, Service, TeamMember } from '../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, NgClass, NgStyle, DatePipe],
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
  clients: Client[] = [];
  services: Service[] = [];
  teamMembers: TeamMember[] = [];
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
  selectedMemberIds: string[] = [];

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  filterSearch = '';
  filterStatus = '';
  filterVisibility = '';
  showDeleted = false;

  ngOnInit(): void {
    this.buildForm();
    this.loadProjects();
    this.loadCategories();
    this.loadTechnologies();
    this.loadClients();
    this.loadServices();
    this.loadTeamMembers();
  }

  private buildForm(): void {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      summary: [''],
      client: [''],
      clientId: [''],
      serviceId: [''],
      status: ['draft'],
      projectType: [''],
      visibility: ['PUBLIC'],
      startDate: [''],
      endDate: [''],
      demoUrl: [''],
      githubUrl: [''],
      gitlabUrl: [''],
      videoUrl: [''],
      architecture: [''],
      challenge: [''],
      solution: [''],
      results: [''],
      metrics: [''],
      features: [''],
      isFeatured: [false],
      isCaseStudy: [false],
      order: [0],
      seoTitle: [''],
      seoDescription: [''],
    });
  }

  private loadProjects(): void {
    this.apiService.getProjectsAll({
      search: this.filterSearch || undefined,
      status: this.filterStatus || undefined,
      visibility: this.filterVisibility || undefined,
      deleted: this.showDeleted || undefined,
    }).subscribe({
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

  private loadClients(): void {
    this.apiService.getClientsAll().subscribe({
      next: (list) => (this.clients = list),
    });
  }

  private loadServices(): void {
    this.apiService.getServicesAll().subscribe({
      next: (list) => (this.services = list),
    });
  }

  private loadTeamMembers(): void {
    this.apiService.getTeamAll().subscribe({
      next: (list) => (this.teamMembers = list),
    });
  }

  applyFilters(): void {
    this.loading = true;
    this.loadProjects();
  }

  resetFilters(): void {
    this.filterSearch = '';
    this.filterStatus = '';
    this.filterVisibility = '';
    this.loading = true;
    this.loadProjects();
  }

  toggleDeletedView(): void {
    this.showDeleted = !this.showDeleted;
    this.loading = true;
    this.loadProjects();
  }

  async restoreProject(id: string): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Restaurar este proyecto?' });
    if (!ok) return;
    this.apiService.restoreProject(id).subscribe({
      next: () => {
        this.showToast('Proyecto restaurado', 'success');
        this.loadProjects();
      },
      error: () => this.showToast('Error al restaurar proyecto', 'error'),
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
    this.selectedMemberIds = [];
    this.projectForm.reset({ isFeatured: false, isCaseStudy: false, order: 0, status: 'draft', visibility: 'PUBLIC' });
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
    this.selectedMemberIds = (project.members as any[] || []).map((m) => m.teamMemberId).filter(Boolean);

    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      summary: (project as any).summary || project.description,
      client: (project as any).client || '',
      clientId: (project as any).clientId || '',
      serviceId: (project as any).serviceId || '',
      status: (project as any).status || 'draft',
      projectType: (project as any).projectType || '',
      visibility: (project as any).visibility || 'PUBLIC',
      startDate: project.startDate?.slice(0, 10),
      endDate: project.endDate?.slice(0, 10) ?? null,
      demoUrl: project.demoUrl || '',
      githubUrl: project.githubUrl || '',
      gitlabUrl: (project as any).gitlabUrl || '',
      videoUrl: (project as any).videoUrl || '',
      architecture: (project as any).architecture || '',
      challenge: (project as any).challenge || '',
      solution: (project as any).solution || '',
      results: (project as any).results || '',
      metrics: (project as any).metrics ? JSON.stringify((project as any).metrics, null, 2) : '',
      features: (project as any).features ? JSON.stringify((project as any).features, null, 2) : '',
      isFeatured: project.isFeatured,
      isCaseStudy: (project as any).isCaseStudy || false,
      order: project.order,
      seoTitle: (project as any).seoTitle || '',
      seoDescription: (project as any).seoDescription || '',
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
    this.selectedMemberIds = [];
    this.projectForm.reset({ isFeatured: false, isCaseStudy: false, order: 0, status: 'draft', visibility: 'PUBLIC' });
  }

  save(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
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

    let metrics: any = null;
    try {
      if (form.metrics) metrics = JSON.parse(form.metrics);
    } catch {
      this.showToast('Métricas debe ser JSON válido', 'error');
      this.saving = false;
      return;
    }

    const payload: any = {
      title: form.title,
      description: form.description,
      summary: form.summary,
      demoUrl: form.demoUrl || null,
      githubUrl: form.githubUrl || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      isFeatured: form.isFeatured,
      isCaseStudy: form.isCaseStudy,
      order: form.order,
      categoryIds: this.selectedCategoryIds,
      client: form.client || null,
      clientId: form.clientId || null,
      serviceId: form.serviceId || null,
      status: form.status,
      projectType: form.projectType || null,
      visibility: form.visibility || 'PUBLIC',
      gitlabUrl: form.gitlabUrl || null,
      videoUrl: form.videoUrl || null,
      architecture: form.architecture || null,
      challenge: form.challenge || null,
      solution: form.solution || null,
      results: form.results || null,
      metrics: metrics || null,
      features,
      technologyIds: this.selectedTechIds,
      members: this.teamMembers
        .filter((m) => this.selectedMemberIds.includes(m.id))
        .map((m) => ({ teamMemberId: m.id, role: '', description: '', isLead: false })),
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

        if (uploads.length === 0) {
          this.cancelForm();
          this.loadProjects();
        } else {
          Promise.all(uploads).then(() => {
            this.cancelForm();
            this.loadProjects();
          });
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

  toggleMember(memberId: string): void {
    const idx = this.selectedMemberIds.indexOf(memberId);
    if (idx >= 0) this.selectedMemberIds.splice(idx, 1);
    else this.selectedMemberIds.push(memberId);
  }

  isMemberSelected(id: string): boolean {
    return this.selectedMemberIds.includes(id);
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

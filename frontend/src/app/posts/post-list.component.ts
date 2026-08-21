import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Post, PostCategory, PostTag } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { environment } from '../../environments/environment';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  REVIEW: 'Revisión',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss'],
})
export class PostListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  posts: Post[] = [];
  categories: PostCategory[] = [];
  tags: PostTag[] = [];
  total = 0;
  page = 1;
  limit = 12;
  search = '';
  statusFilter = '';
  loading = true;
  uploadUrl = environment.uploadUrl;

  showForm = false;
  editing: Post | null = null;
  form: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    status: string;
    seoTitle: string;
    seoDescription: string;
    categoryIds: string[];
    tagIds: string[];
  } = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    status: 'DRAFT',
    seoTitle: '',
    seoDescription: '',
    categoryIds: [],
    tagIds: [],
  };

  newCategory = '';
  newTag = '';
  showCategoriesPanel = false;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  get statusLabels(): Record<string, string> {
    return STATUS_LABELS;
  }

  ngOnInit(): void {
    this.loadPosts();
    this.loadTaxonomies();
  }

  loadPosts(): void {
    this.loading = true;
    this.apiService.getPosts({
      page: this.page,
      limit: this.limit,
      search: this.search || undefined,
      status: this.statusFilter || undefined,
    }).subscribe({
      next: (res) => {
        this.posts = res.posts;
        this.total = res.total;
      },
      error: () => this.showToast('No se pudieron cargar los posts', 'error'),
      complete: () => (this.loading = false),
    });
  }

  loadTaxonomies(): void {
    this.apiService.getPostCategories().subscribe({ next: (c) => (this.categories = c), error: (err) => console.error('Failed to load categories', err) });
    this.apiService.getPostTags().subscribe({ next: (t) => (this.tags = t), error: (err) => console.error('Failed to load tags', err) });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadPosts();
  }

  filterStatus(status: string): void {
    this.statusFilter = status;
    this.page = 1;
    this.loadPosts();
  }

  statusClass(s: string): string {
    return s.toLowerCase();
  }

  countByStatus(s: string): number {
    return this.posts.filter((p) => p.status === s).length;
  }

  coverUrl(p: Post): string | null {
    if (!p.coverImage) return null;
    if (p.coverImage.startsWith('http://') || p.coverImage.startsWith('https://') || p.coverImage.startsWith('data:')) return p.coverImage;
    return `${this.uploadUrl}/${p.coverImage}`;
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  openCreate(): void {
    this.editing = null;
    this.form = {
      title: '', slug: '', excerpt: '', content: '', coverImage: '',
      status: 'DRAFT', seoTitle: '', seoDescription: '', categoryIds: [], tagIds: [],
    };
    this.showForm = true;
  }

  openEdit(p: Post): void {
    this.editing = p;
    this.form = {
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content || '',
      coverImage: p.coverImage || '',
      status: p.status,
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || '',
      categoryIds: (p.categories || []).map((c) => c.id),
      tagIds: (p.tags || []).map((t) => t.id),
    };
    this.showForm = true;
  }

  onTitleChange(): void {
    if (!this.editing && !this.form.slug) {
      this.form.slug = this.slugify(this.form.title);
    }
  }

  toggleSelected(list: string[], id: string): void {
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(id);
  }

  save(): void {
    const payload = {
      title: this.form.title.trim(),
      slug: this.form.slug || this.slugify(this.form.title),
      excerpt: this.form.excerpt,
      content: this.form.content,
      coverImage: this.form.coverImage,
      status: this.form.status as Post['status'],
      seoTitle: this.form.seoTitle,
      seoDescription: this.form.seoDescription,
      categoryIds: this.form.categoryIds,
      tagIds: this.form.tagIds,
    };
    if (!payload.title) return;
    const action = this.editing
      ? this.apiService.updatePost(this.editing.id, payload)
      : this.apiService.createPost(payload);
    action.subscribe({
      next: () => {
        this.showToast(this.editing ? 'Post actualizado' : 'Post creado', 'success');
        this.showForm = false;
        this.loadPosts();
        this.loadTaxonomies();
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al guardar el post', 'error'),
    });
  }

  publish(p: Post): void {
    this.apiService.publishPost(p.id).subscribe({
      next: () => {
        this.showToast('Post publicado', 'success');
        this.loadPosts();
      },
      error: () => this.showToast('Error al publicar', 'error'),
    });
  }

  archive(p: Post): void {
    this.apiService.archivePost(p.id).subscribe({
      next: () => {
        this.showToast('Post archivado', 'success');
        this.loadPosts();
      },
      error: () => this.showToast('Error al archivar', 'error'),
    });
  }

  async remove(p: Post): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar "${p.title}"?` });
    if (!ok) return;
    this.apiService.deletePost(p.id).subscribe({
      next: () => {
        this.posts = this.posts.filter((x) => x.id !== p.id);
        this.showToast('Post eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar', 'error'),
    });
  }

  addCategory(): void {
    const name = this.newCategory.trim();
    if (!name) return;
    this.apiService.createPostCategory({ name }).subscribe({
      next: () => {
        this.newCategory = '';
        this.showToast('Categoría creada', 'success');
        this.loadTaxonomies();
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al crear categoría', 'error'),
    });
  }

  async removeCategory(c: PostCategory): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar la categoría "${c.name}"?` });
    if (!ok) return;
    this.apiService.deletePostCategory(c.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((x) => x.id !== c.id);
        this.showToast('Categoría eliminada', 'success');
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al eliminar', 'error'),
    });
  }

  addTag(): void {
    const name = this.newTag.trim();
    if (!name) return;
    this.apiService.createPostTag({ name }).subscribe({
      next: () => {
        this.newTag = '';
        this.showToast('Tag creado', 'success');
        this.loadTaxonomies();
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al crear tag', 'error'),
    });
  }

  async removeTag(t: PostTag): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar el tag "${t.name}"?` });
    if (!ok) return;
    this.apiService.deletePostTag(t.id).subscribe({
      next: () => {
        this.tags = this.tags.filter((x) => x.id !== t.id);
        this.showToast('Tag eliminado', 'success');
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al eliminar', 'error'),
    });
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p;
    this.loadPosts();
  }

  uploadCover(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.apiService.uploadFile(file, 'blog').subscribe({
      next: (res) => {
        this.form.coverImage = res.url;
        this.showToast('Imagen subida', 'success');
      },
      error: () => this.showToast('Error al subir la imagen', 'error'),
      complete: () => (input.value = '')
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

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { MediaFile } from '../core/models';
import { environment } from '../../environments/environment';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

@Component({
  selector: 'app-media-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './media-list.component.html',
  styleUrls: ['./media-list.component.scss'],
})
export class MediaListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  files: MediaFile[] = [];
  folders: { folder: string; count: number }[] = [];
  total = 0;
  page = 1;
  limit = 24;
  search = '';
  folderFilter = '';
  uploading = false;
  loading = true;
  previewFile: MediaFile | null = null;
  previewUrl = '';
  editingAlt: MediaFile | null = null;
  altText = '';
  uploadUrl = environment.uploadUrl;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadMedia();
  }

  loadMedia(): void {
    this.loading = true;
    this.apiService.getMedia({ page: this.page, limit: this.limit, search: this.search || undefined, folder: this.folderFilter || undefined }).subscribe({
      next: (res) => {
        this.files = res.files;
        this.total = res.total;
        this.folders = (res.folders || []).map((f) => ({ folder: f.folder, count: f._count?._all ?? 0 }));
      },
      error: () => this.showToast('No se pudieron cargar los archivos', 'error'),
      complete: () => (this.loading = false),
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadMedia();
  }

  clearSearch(): void {
    this.search = '';
    this.page = 1;
    this.loadMedia();
  }

  filterFolder(folder: string): void {
    this.folderFilter = this.folderFilter === folder ? '' : folder;
    this.page = 1;
    this.loadMedia();
  }

  fileUrl(f: MediaFile): string {
    return f.url ? `${this.uploadUrl}${f.url}` : `${this.uploadUrl}/${f.path}`;
  }

  thumbUrl(f: MediaFile): string {
    if (f.thumbnail) return `${this.uploadUrl}/${f.thumbnail}`;
    return this.fileUrl(f);
  }

  isImage(f: MediaFile): boolean {
    return !!f.mimeType?.startsWith('image/');
  }

  isVideo(f: MediaFile): boolean {
    return !!f.mimeType?.startsWith('video/');
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.apiService.uploadImage(file).subscribe({
      next: () => {
        this.showToast('Archivo subido', 'success');
        this.page = 1;
        this.loadMedia();
      },
      error: () => this.showToast('Error al subir el archivo', 'error'),
      complete: () => {
        this.uploading = false;
        input.value = '';
      },
    });
  }

  openPreview(f: MediaFile): void {
    this.previewFile = f;
    this.previewUrl = this.fileUrl(f);
  }

  closePreview(): void {
    this.previewFile = null;
  }

  copyUrl(f: MediaFile): void {
    const url = this.fileUrl(f);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => this.showToast('URL copiada al portapapeles', 'success'),
        () => this.showToast('No se pudo copiar', 'error')
      );
    }
  }

  startEditAlt(f: MediaFile): void {
    this.editingAlt = f;
    this.altText = f.altText || '';
  }

  saveAlt(): void {
    if (!this.editingAlt) return;
    this.apiService.updateMediaFile(this.editingAlt.id, { altText: this.altText }).subscribe({
      next: (updated) => {
        const idx = this.files.findIndex((x) => x.id === updated.id);
        if (idx >= 0) this.files[idx] = updated;
        this.editingAlt = null;
        this.showToast('Texto alternativo actualizado', 'success');
      },
      error: () => this.showToast('Error al actualizar', 'error'),
    });
  }

  async deleteFile(f: MediaFile): Promise<void> {
    const ok = await this.confirmService.confirm({ message: '¿Eliminar este archivo?' });
    if (!ok) return;
    this.apiService.deleteMediaFile(f.id).subscribe({
      next: () => {
        this.files = this.files.filter((x) => x.id !== f.id);
        if (this.previewFile?.id === f.id) this.previewFile = null;
        this.showToast('Archivo eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar', 'error'),
    });
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p;
    this.loadMedia();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}

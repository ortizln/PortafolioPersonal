import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({ name: 'uploadUrl', standalone: true })
export class UploadUrlPipe implements PipeTransform {
  transform(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
    return `${environment.uploadUrl}/${path}`;
  }
}

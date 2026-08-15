import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { User, Role } from '../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  users: User[] = [];
  roles: Role[] = [];
  total = 0;
  page = 1;
  limit = 15;
  search = '';
  roleFilter = '';
  loading = true;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => this.showToast('No se pudieron cargar los roles', 'error'),
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.apiService.getUsers({ page: this.page, limit: this.limit, search: this.search || undefined, role: this.roleFilter || undefined }).subscribe({
      next: (res) => {
        this.users = res.users;
        this.total = res.total;
      },
      error: () => this.showToast('No se pudieron cargar los usuarios', 'error'),
      complete: () => (this.loading = false),
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadUsers();
  }

  userRoleName(user: User): string {
    return user.rbacRole?.name || user.userRoles?.[0]?.role?.name || user.role || 'VIEWER';
  }

  changeRole(user: User, roleId: string): void {
    if (!roleId) return;
    this.apiService.assignUserRole(user.id, roleId).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex((u) => u.id === updated.id);
        if (idx >= 0) this.users[idx] = updated;
        this.showToast(`Rol de ${updated.name} actualizado`, 'success');
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al asignar rol', 'error'),
    });
  }

  toggleActive(user: User): void {
    this.apiService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex((u) => u.id === updated.id);
        if (idx >= 0) this.users[idx] = updated;
        this.showToast(updated.isActive ? 'Usuario activado' : 'Usuario desactivado', 'success');
      },
      error: () => this.showToast('Error al actualizar el usuario', 'error'),
    });
  }

  async deleteUser(user: User): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar a ${user.name}?` });
    if (!ok) return;
    this.apiService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.showToast('Usuario eliminado', 'success');
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
    this.loadUsers();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}

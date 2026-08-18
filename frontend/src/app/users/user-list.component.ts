import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { User, Role, Permission } from '../core/models';

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
  allPermissions: Permission[] = [];
  total = 0;
  page = 1;
  limit = 15;
  search = '';
  roleFilter = '';
  loading = true;

  selectedUser: User | null = null;
  userRolePermissions: Permission[] = [];
  loadingPermissions = false;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  readonly ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: '#ef4444',
    ADMIN: '#f59e0b',
    CONTENT_MANAGER: '#8b5cf6',
    PROJECT_MANAGER: '#3b82f6',
    TEAM_MEMBER: '#10b981',
    VIEWER: '#6b7280',
  };

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => this.showToast('No se pudieron cargar los roles', 'error'),
    });
  }

  loadPermissions(): void {
    this.apiService.getPermissions().subscribe({
      next: (perms) => (this.allPermissions = perms),
      error: () => {},
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

  roleColor(user: User): string {
    const name = this.userRoleName(user);
    return this.ROLE_COLORS[name] || '#6b7280';
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

  openPermissions(user: User): void {
    this.selectedUser = user;
    this.loadingPermissions = true;
    this.userRolePermissions = [];
    const roleId = user.rbacRole?.id || user.userRoles?.[0]?.role?.id;
    if (roleId) {
      const role = this.roles.find((r) => r.id === roleId);
      if (role?.permissions) {
        this.userRolePermissions = role.permissions;
        this.loadingPermissions = false;
      } else {
        this.loadingPermissions = false;
      }
    } else {
      this.loadingPermissions = false;
    }
  }

  closePermissions(): void {
    this.selectedUser = null;
    this.userRolePermissions = [];
  }

  permissionModules(): string[] {
    const modules = new Set(this.userRolePermissions.map((p) => p.module || 'other'));
    return Array.from(modules).sort();
  }

  permissionsByModule(module: string): Permission[] {
    return this.userRolePermissions.filter((p) => (p.module || 'other') === module);
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

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { User, Role, Permission, TeamMember } from '../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
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

  showCreateModal = false;
  creating = false;
  createError = '';
  teamMembers: TeamMember[] = [];
  newEmail = '';
  newPassword = '';
  newName = '';
  newRoleId = '';
  newTeamMemberId = '';

  showEditModal = false;
  editing = false;
  editError = '';
  editUserId = '';
  editEmail = '';
  editName = '';
  editRoleId = '';
  editTeamMemberId = '';
  editNewPassword = '';
  editConfirmPassword = '';
  editChangePassword = false;

  showDeleted = false;
  showDeletedList = false;
  deletedUsers: User[] = [];
  loadingDeleted = false;

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

  loadTeamMembers(excludeUserId?: string): void {
    this.apiService.getTeamAll().subscribe({
      next: (list) => {
        const linkedIds = new Set(
          this.users
            .filter(u => u.teamMemberId && u.id !== excludeUserId)
            .map(u => u.teamMemberId)
        );
        this.teamMembers = (list || []).filter(m => !linkedIds.has(m.id));
      },
      error: () => {},
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.createError = '';
    this.newEmail = '';
    this.newPassword = '';
    this.newName = '';
    this.newRoleId = '';
    this.newTeamMemberId = '';
    this.loadTeamMembers();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createError = '';
  }

  onTeamMemberSelect(): void {
    const member = this.teamMembers.find(m => m.id === this.newTeamMemberId);
    if (member) {
      this.newName = member.fullName;
      if (member.email) this.newEmail = member.email;
    }
  }

  submitCreate(): void {
    if (!this.newEmail || !this.newPassword || !this.newName || !this.newRoleId) {
      this.createError = 'Email, contraseña, nombre y rol son requeridos';
      return;
    }
    this.creating = true;
    this.createError = '';
    this.apiService.createUser({
      email: this.newEmail,
      password: this.newPassword,
      name: this.newName,
      roleId: this.newRoleId || undefined,
      teamMemberId: this.newTeamMemberId || undefined,
    }).subscribe({
      next: (user) => {
        this.showToast(`Usuario ${user.name} creado correctamente`, 'success');
        this.closeCreateModal();
        this.loadUsers();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err?.error?.error || 'Error al crear el usuario';
      },
      complete: () => { this.creating = false; },
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.apiService.getUsers({ page: this.page, limit: this.limit, search: this.search || undefined, role: this.roleFilter || undefined, deleted: this.showDeleted }).subscribe({
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

  openEditModal(user: User): void {
    this.editUserId = user.id;
    this.editEmail = user.email;
    this.editName = user.name;
    this.editRoleId = user.rbacRole?.id || user.userRoles?.[0]?.role?.id || '';
    this.editTeamMemberId = user.teamMemberId || '';
    this.editNewPassword = '';
    this.editConfirmPassword = '';
    this.editChangePassword = false;
    this.editError = '';
    this.showEditModal = true;
    this.loadTeamMembers(user.id);
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editError = '';
  }

  submitEdit(): void {
    if (!this.editEmail || !this.editName) {
      this.editError = 'Email y nombre son requeridos';
      return;
    }
    if (this.editChangePassword) {
      if (!this.editNewPassword) {
        this.editError = 'La nueva contraseña es requerida';
        return;
      }
      if (this.editNewPassword !== this.editConfirmPassword) {
        this.editError = 'Las contraseñas no coinciden';
        return;
      }
      if (this.editNewPassword.length < 8) {
        this.editError = 'La contraseña debe tener al menos 8 caracteres';
        return;
      }
    }
    this.editing = true;
    this.editError = '';
    const data: any = {
      email: this.editEmail,
      name: this.editName,
      roleId: this.editRoleId || null,
      teamMemberId: this.editTeamMemberId || null,
    };
    if (this.editChangePassword && this.editNewPassword) data.password = this.editNewPassword;

    this.apiService.updateUser(this.editUserId, data).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex((u) => u.id === updated.id);
        if (idx >= 0) this.users[idx] = updated;
        this.showToast(`Usuario ${updated.name} actualizado`, 'success');
        this.closeEditModal();
      },
      error: (err) => {
        this.editing = false;
        this.editError = err?.error?.error || 'Error al actualizar el usuario';
      },
      complete: () => { this.editing = false; },
    });
  }

  toggleShowDeleted(): void {
    this.showDeleted = !this.showDeleted;
    this.page = 1;
    this.loadUsers();
  }

  async restoreUser(user: User): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Restaurar a ${user.name}?` });
    if (!ok) return;
    this.apiService.restoreUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.showToast(`Usuario ${user.name} restaurado`, 'success');
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al restaurar', 'error'),
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

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { Role, Permission } from '../core/models';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss'],
})
export class RoleListComponent implements OnInit {
  private apiService = inject(ApiService);
  private confirmService = inject(ConfirmService);

  roles: Role[] = [];
  permissions: Permission[] = [];
  loading = true;
  error = false;
  expandedRoleId: string | null = null;
  showCreate = false;
  newRoleName = '';
  newRoleDescription = '';
  newRolePermissionIds: Set<string> = new Set();

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.loading = true;
    this.apiService.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => this.showToast('No se pudieron cargar los roles', 'error'),
      complete: () => (this.loading = false),
    });
  }

  loadPermissions(): void {
    this.apiService.getPermissions().subscribe({
      next: (permissions) => (this.permissions = permissions),
      error: () => (this.error = true),
    });
  }

  retry(): void {
    this.error = false;
    this.loadPermissions();
  }

  permissionGroups(): { module: string; items: Permission[] }[] {
    const map = new Map<string, Permission[]>();
    this.permissions.forEach((p) => {
      const mod = p.module || 'other';
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(p);
    });
    return Array.from(map.entries()).map(([module, items]) => ({ module, items }));
  }

  rolePermissionIds(role: Role): Set<string> {
    return new Set((role.permissions || []).map((p) => p.id));
  }

  toggleExpand(role: Role): void {
    this.expandedRoleId = this.expandedRoleId === role.id ? null : role.id;
  }

  hasPermission(role: Role, permId: string): boolean {
    return (role.permissions || []).some((p) => p.id === permId);
  }

  togglePermission(role: Role, permId: string): void {
    const current = this.hasPermission(role, permId);
    const next = current ? role.permissions!.filter((p) => p.id !== permId) : [...(role.permissions || []), this.permissions.find((p) => p.id === permId)!];
    this.apiService.updateRolePermissions(role.id, next.map((p) => p.id)).subscribe({
      next: (updated) => {
        const idx = this.roles.findIndex((r) => r.id === role.id);
        if (idx >= 0) this.roles[idx] = updated;
        this.showToast(current ? 'Permiso revocado' : 'Permiso concedido', 'success');
      },
      error: () => this.showToast('Error al actualizar permisos', 'error'),
    });
  }

  openCreate(): void {
    this.showCreate = true;
    this.newRoleName = '';
    this.newRoleDescription = '';
    this.newRolePermissionIds = new Set();
  }

  toggleNewPermission(permId: string): void {
    if (this.newRolePermissionIds.has(permId)) {
      this.newRolePermissionIds.delete(permId);
    } else {
      this.newRolePermissionIds.add(permId);
    }
  }

  createRole(): void {
    if (!this.newRoleName.trim()) return;
    this.apiService.createRole({
      name: this.newRoleName.trim().toUpperCase().replace(/\s+/g, '_'),
      description: this.newRoleDescription,
      permissionIds: Array.from(this.newRolePermissionIds),
    }).subscribe({
      next: () => {
        this.showToast('Rol creado', 'success');
        this.showCreate = false;
        this.loadRoles();
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al crear el rol', 'error'),
    });
  }

  async deleteRole(role: Role): Promise<void> {
    const ok = await this.confirmService.confirm({ message: `¿Eliminar el rol ${role.name}?` });
    if (!ok) return;
    this.apiService.deleteRole(role.id).subscribe({
      next: () => {
        this.roles = this.roles.filter((r) => r.id !== role.id);
        this.showToast('Rol eliminado', 'success');
      },
      error: (err) => this.showToast(err?.error?.error || 'Error al eliminar', 'error'),
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

const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const roleController = {
  async getAll(req, res, next) {
    try {
      const roles = await prisma.role.findMany({
        orderBy: { name: 'asc' },
        include: {
          permissions: { select: { permission: true } },
          _count: { select: { users: true } }
        }
      });

      res.json({ roles: roles.map((r) => ({ ...r, permissions: r.permissions.map((p) => p.permission) })) });
    } catch (error) {
      next(error);
    }
  },

  async getPermissions(req, res, next) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { name: 'asc' }]
      });
      res.json({ permissions });
    } catch (error) {
      next(error);
    }
  },

  async updateRolePermissions(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permissionIds = [] } = req.body;

      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw new AppError('Role not found', 404);

      if (role.isSystem && req.user.roles.includes('SUPER_ADMIN')) {
        // permitido: SUPER_ADMIN puede editar roles de sistema
      }

      await prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId, permissionId }))
          });
        }
      });

      const updated = await prisma.role.findUnique({
        where: { id: roleId },
        include: { permissions: { select: { permission: true } } }
      });

      res.json({ role: { ...updated, permissions: updated.permissions.map((p) => p.permission) } });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description, permissionIds = [] } = req.body;
      const existing = await prisma.role.findUnique({ where: { name } });
      if (existing) throw new AppError('Role already exists', 409);

      const role = await prisma.$transaction(async (tx) => {
        const created = await tx.role.create({ data: { name, description } });
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId: created.id, permissionId }))
          });
        }
        return created;
      });

      res.status(201).json({ role });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { roleId } = req.params;
      const { description } = req.body;
      const role = await prisma.role.update({
        where: { id: roleId },
        data: { description }
      });
      res.json({ role });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Role not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { roleId } = req.params;
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw new AppError('Role not found', 404);
      if (role.isSystem) throw new AppError('System roles cannot be deleted', 400);

      await prisma.role.delete({ where: { id: roleId } });
      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Role not found', 404));
      next(error);
    }
  }
};

module.exports = roleController;

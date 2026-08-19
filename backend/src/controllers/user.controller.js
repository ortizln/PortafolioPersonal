const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { audit } = require('../helpers/audit');

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  roleId: true,
  teamMemberId: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
  rbacRole: { select: { id: true, name: true } },
  userRoles: { select: { role: { select: { id: true, name: true } } } },
  teamMember: { select: { id: true, fullName: true, professionalTitle: true, photoUrl: true } }
};

const userController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, role, isActive, deleted } = req.query;
      const skip = (page - 1) * limit;

      const where = {};

      if (deleted === 'true') {
        where.deletedAt = { not: null };
      } else {
        where.deletedAt = null;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (role && role !== 'ALL') where.roleId = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: userSelect,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      res.json({ users, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { email, password, name, roleId, teamMemberId } = req.body;

      if (!email || !password || !name) {
        throw new AppError('Email, password y name son requeridos', 400);
      }

      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) throw new AppError('El email ya está registrado', 409);

      if (teamMemberId) {
        const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
        if (!member) throw new AppError('Miembro del equipo no encontrado', 404);

        const linked = await prisma.user.findUnique({ where: { teamMemberId } });
        if (linked) throw new AppError('Este miembro del equipo ya tiene una cuenta de usuario', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          roleId: roleId || null,
          teamMemberId: teamMemberId || null,
        },
        select: userSelect,
      });

      if (roleId) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId }
        });
      }

      audit(req, 'USER_CREATED', { userId: user.id, email: user.email, teamMemberId });

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          ...userSelect,
          profile: true
        }
      });

      if (!user || user.deletedAt) throw new AppError('User not found', 404);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { password, roleId, teamMemberId, ...data } = req.body;

      if (password) {
        data.password = await bcrypt.hash(password, 12);
      }

      if (teamMemberId !== undefined) {
        if (teamMemberId) {
          const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
          if (!member) throw new AppError('Miembro del equipo no encontrado', 404);
          const linked = await prisma.user.findFirst({ where: { teamMemberId, id: { not: req.params.id } } });
          if (linked) throw new AppError('Este miembro del equipo ya tiene otra cuenta vinculada', 409);
        }
        data.teamMemberId = teamMemberId || null;
      }

      if (roleId !== undefined) {
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new AppError('Role not found', 404);

        await this.assertNotLastSuperAdmin(req.params.id, role.name, req.user);
        data.roleId = roleId;
        await prisma.userRole.deleteMany({ where: { userId: req.params.id } });
        if (role.name !== 'VIEWER') {
          await prisma.userRole.create({ data: { userId: req.params.id, roleId } });
        }
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: userSelect
      });

      res.json({ user });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('User not found', 404));
      if (error.code === 'P2002') return next(new AppError('Email already in use', 409));
      next(error);
    }
  },

  async updateRole(req, res, next) {
    try {
      const { roleId } = req.body;
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw new AppError('Role not found', 404);

      await this.assertNotLastSuperAdmin(req.params.id, role.name, req.user);

      await prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId: req.params.id } });
        if (role.name !== 'VIEWER') {
          await tx.userRole.create({ data: { userId: req.params.id, roleId } });
        }
        await tx.user.update({ where: { id: req.params.id }, data: { roleId } });
      });

      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: userSelect
      });

      await audit({
        userId: req.user?.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: req.params.id,
        description: `Rol asignado a ${user?.email || req.params.id}: ${role.name}`,
        req
      });

      res.json({ user });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('User not found', 404));
      next(error);
    }
  },

  async assertNotLastSuperAdmin(userId, newRoleName, actor) {
    if (newRoleName === 'SUPER_ADMIN') return;
    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { rbacRole: { select: { name: true } }, userRoles: { select: { role: { select: { name: true } } } } }
    });
    const targetRoles = [];
    if (target.rbacRole) targetRoles.push(target.rbacRole.name);
    target.userRoles.forEach((ur) => targetRoles.push(ur.role.name));

    if (targetRoles.includes('SUPER_ADMIN')) {
      const superAdmins = await prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { roleId: { not: null } },
            { userRoles: { some: {} } }
          ]
        },
        include: { rbacRole: true, userRoles: { select: { role: { select: { name: true } } } } }
      });
      const count = superAdmins.filter((u) => {
        const names = [];
        if (u.rbacRole) names.push(u.rbacRole.name);
        u.userRoles.forEach((ur) => names.push(ur.role.name));
        return names.includes('SUPER_ADMIN');
      }).length;
      if (count <= 1 && actor?.id !== userId) {
        throw new AppError('Cannot remove the last SUPER_ADMIN', 400);
      }
      if (count <= 1 && actor?.id === userId) {
        throw new AppError('Cannot remove the last SUPER_ADMIN', 400);
      }
    }
  },

  async delete(req, res, next) {
    try {
      if (req.params.id === req.user.id) {
        throw new AppError('Cannot delete yourself', 403);
      }

      const target = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { rbacRole: true, userRoles: { select: { role: { select: { name: true } } } } }
      });
      if (!target) throw new AppError('User not found', 404);
      const names = [];
      if (target.rbacRole) names.push(target.rbacRole.name);
      target.userRoles.forEach((ur) => names.push(ur.role.name));
      if (names.includes('SUPER_ADMIN')) {
        throw new AppError('Cannot delete a SUPER_ADMIN', 403);
      }

      await prisma.user.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), isActive: false }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('User not found', 404));
      next(error);
    }
  },

  async restore(req, res, next) {
    try {
      const target = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!target) throw new AppError('User not found', 404);
      if (!target.deletedAt) throw new AppError('El usuario no está eliminado', 400);

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { deletedAt: null, isActive: true },
        select: userSelect,
      });

      audit(req, 'USER_RESTORED', { userId: user.id, email: user.email });

      res.json({ user });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('User not found', 404));
      next(error);
    }
  }
};

module.exports = userController;

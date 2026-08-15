const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../auth/jwt');
const { AppError } = require('../middlewares/errorHandler');
const { sendMail } = require('../helpers/mailer');

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:4200';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RESET_TOKEN_TTL_HOURS = 2;

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validatePassword(password) {
  if (!PASSWORD_PATTERN.test(password)) {
    throw new AppError('Password must be at least 8 characters and include uppercase, lowercase, number and special character.', 400);
  }
}

async function buildUserPayload(user) {
  const withRoles = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      roleId: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      rbacRole: { select: { name: true, permissions: { select: { permission: { select: { name: true } } } } } },
      userRoles: { select: { role: { select: { name: true, permissions: { select: { permission: { select: { name: true } } } } } } } }
    }
  });

  const roles = [];
  const permissions = [];
  if (withRoles.rbacRole) {
    roles.push(withRoles.rbacRole.name);
    withRoles.rbacRole.permissions.forEach((rp) => permissions.push(rp.permission.name));
  }
  withRoles.userRoles.forEach((ur) => {
    if (!roles.includes(ur.role.name)) roles.push(ur.role.name);
    ur.role.permissions.forEach((rp) => {
      if (!permissions.includes(rp.permission.name)) permissions.push(rp.permission.name);
    });
  });

  const { rbacRole, userRoles, ...base } = withRoles;
  return { ...base, roles, permissions };
}

const authController = {
  async register(req, res, next) {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { password, name, ...profileData } = req.body;

      validatePassword(password);

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) throw new AppError('Registration could not be completed.', 400);

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'USER',
          profile: { create: { fullName: profileData.fullName || name, professionalTitle: profileData.professionalTitle || '' } }
        },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

      res.status(201).json({ user: { ...user, roles: ['VIEWER'], permissions: [] }, accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const normalized = email?.toLowerCase().trim();

      const user = await prisma.user.findUnique({ where: { email: normalized } });
      if (!user) throw new AppError('Invalid credentials', 401);

      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        throw new AppError('Account temporarily locked due to failed attempts. Try again later.', 423);
      }

      if (user.deletedAt) throw new AppError('Invalid credentials', 401);

      const valid = await bcrypt.compare(password, user.password);
      if (!valid || !user.isActive) {
        const attempts = user.failedAttempts + 1;
        const lockoutUntil = attempts >= MAX_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null;
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: lockoutUntil ? 0 : attempts, lockoutUntil }
        });
        throw new AppError(lockoutUntil ? `Account locked for ${LOCKOUT_MINUTES} minutes due to failed attempts.` : 'Invalid credentials', lockoutUntil ? 423 : 401);
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken, lastLogin: new Date(), failedAttempts: 0, lockoutUntil: null }
      });

      const payload = await buildUserPayload(user);
      res.json({ user: payload, accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new AppError('Refresh token required', 400);

      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.isActive || user.deletedAt || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new AppError('Refresh token required', 400);

      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch {
        return res.json({ message: 'Logged out successfully' });
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user && user.refreshToken === refreshToken) {
        await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const payload = await buildUserPayload({ id: req.user.id });
      res.json({ user: payload });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const normalized = email?.toLowerCase().trim();
      if (!normalized) throw new AppError('Email is required', 400);

      const user = await prisma.user.findUnique({ where: { email: normalized } });
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: tokenHash,
            resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000)
          }
        });

        const resetUrl = `${PUBLIC_BASE}/auth/reset-password?token=${token}`;
        await sendMail({
          to: user.email,
          subject: 'Restablecer contraseña — ALANTEK',
          html: `<p>Hola ${user.name},</p><p>Recibimos una solicitud para restablecer tu contraseña.</p><p>Haz clic en el siguiente enlace (válido por ${RESET_TOKEN_TTL_HOURS} horas):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no solicitaste este cambio, ignora este correo.</p>`
        });
      }

      res.json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      if (!token) throw new AppError('Token is required', 400);
      validatePassword(password);

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const user = await prisma.user.findFirst({
        where: { resetToken: tokenHash, resetTokenExpiry: { gt: new Date() } }
      });

      if (!user) throw new AppError('Invalid or expired reset token.', 400);

      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          failedAttempts: 0,
          lockoutUntil: null
        }
      });

      res.json({ message: 'Password updated successfully.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;

const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../auth/jwt');
const { AppError } = require('../middlewares/errorHandler');

const authController = {
  async register(req, res, next) {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { password, name, ...profileData } = req.body;

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) throw new AppError('Registration could not be completed.', 400);

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          profile: { create: { fullName: profileData.fullName || name, professionalTitle: profileData.professionalTitle || '' } }
        },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

      res.status(201).json({ user, accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase().trim() } });
      if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Invalid credentials', 401);
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken, lastLogin: new Date() }
      });

      const { password: _, ...userData } = user;
      res.json({ user: userData, accessToken, refreshToken });
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
      if (!user || !user.isActive || user.refreshToken !== refreshToken) {
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
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true, email: true, name: true, role: true, isActive: true,
          lastLogin: true, createdAt: true, updatedAt: true,
          profile: true
        }
      });

      if (!user) throw new AppError('User not found', 404);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;

const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const slugify = require('slugify');

const teamController = {
  async getAll(req, res, next) {
    try {
      const { includeProfile } = req.query;
      const members = await prisma.teamMember.findMany({
        where: { deletedAt: null },
        include: includeProfile === 'true'
          ? {
              _count: {
                select: { experiences: true, educations: true, certifications: true, skills: true, languages: true, socialLinks: true }
              }
            }
          : undefined,
        orderBy: [{ order: 'asc' }, { fullName: 'asc' }]
      });
      res.json(members);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const member = await prisma.teamMember.findUnique({
        where: { id: req.params.id },
        include: {
          experiences: { where: { deletedAt: null }, orderBy: [{ current: 'desc' }, { startDate: 'desc' }] },
          educations: { where: { deletedAt: null }, include: { certificates: { where: { deletedAt: null }, include: { files: true } } }, orderBy: { startDate: 'desc' } },
          certifications: { where: { deletedAt: null }, include: { files: true }, orderBy: { issueDate: 'desc' } },
          skills: { where: { deletedAt: null }, include: { technology: true }, orderBy: [{ category: 'asc' }, { order: 'asc' }] },
          languages: { where: { deletedAt: null }, orderBy: { percentage: 'desc' } },
          socialLinks: { where: { deletedAt: null, isActive: true }, orderBy: { order: 'asc' } }
        }
      });

      if (!member || member.deletedAt) {
        throw new AppError('Team member not found', 404);
      }

      res.json({ member });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Team member not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { fullName, professionalTitle, email, phone, location, bio, about, photoUrl, role, department, linkedinUrl, githubUrl, twitterUrl, order, isActive, isPublic, isFounder, seoTitle, seoDescription } = req.body;

      if (!fullName || !professionalTitle) {
        throw new AppError('fullName and professionalTitle are required', 400);
      }

      const member = await prisma.teamMember.create({
        data: {
          fullName,
          professionalTitle,
          slug: slugify(fullName, { lower: true, strict: true }),
          email, phone, location, bio, about, photoUrl,
          role, department, linkedinUrl, githubUrl, twitterUrl,
          order: order !== undefined ? Number(order) : 0,
          isActive: isActive !== undefined ? !!isActive : true,
          isPublic: isPublic !== undefined ? !!isPublic : true,
          isFounder: !!isFounder,
          seoTitle, seoDescription
        }
      });

      res.status(201).json({ member });
    } catch (error) {
      if (error.code === 'P2002') {
        return next(new AppError('Ya existe un miembro con ese nombre', 409));
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.teamMember.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Team member not found', 404);
      }

      const { fullName, professionalTitle, email, phone, location, bio, about, photoUrl, role, department, linkedinUrl, githubUrl, twitterUrl, order, isActive, isPublic, isFounder, seoTitle, seoDescription } = req.body;
      const data = {};

      if (fullName !== undefined) {
        data.fullName = fullName;
        data.slug = slugify(fullName, { lower: true, strict: true });
      }
      if (professionalTitle !== undefined) data.professionalTitle = professionalTitle;
      if (email !== undefined) data.email = email;
      if (phone !== undefined) data.phone = phone;
      if (location !== undefined) data.location = location;
      if (bio !== undefined) data.bio = bio;
      if (about !== undefined) data.about = about;
      if (photoUrl !== undefined) data.photoUrl = photoUrl;
      if (role !== undefined) data.role = role;
      if (department !== undefined) data.department = department;
      if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl;
      if (githubUrl !== undefined) data.githubUrl = githubUrl;
      if (twitterUrl !== undefined) data.twitterUrl = twitterUrl;
      if (order !== undefined) data.order = Number(order);
      if (isActive !== undefined) data.isActive = !!isActive;
      if (isPublic !== undefined) data.isPublic = !!isPublic;
      if (isFounder !== undefined) data.isFounder = !!isFounder;
      if (seoTitle !== undefined) data.seoTitle = seoTitle;
      if (seoDescription !== undefined) data.seoDescription = seoDescription;

      const member = await prisma.teamMember.update({
        where: { id: existing.id },
        data
      });

      res.json({ member });
    } catch (error) {
      if (error.code === 'P2002') {
        return next(new AppError('Ya existe un miembro con ese nombre', 409));
      }
      if (error.code === 'P2025') return next(new AppError('Team member not found', 404));
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const existing = await prisma.teamMember.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Team member not found', 404);
      }

      await prisma.teamMember.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Team member not found', 404));
      next(error);
    }
  }
};

module.exports = teamController;

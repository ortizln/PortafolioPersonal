const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const certificationController = {
  async getAll(req, res, next) {
    try {
      const certifications = await prisma.certification.findMany({
        where: { userId: req.user.id, deletedAt: null },
        include: { files: true },
        orderBy: { issueDate: 'desc' }
      });

      res.json(certifications);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const certification = await prisma.certification.findUnique({
        where: { id: req.params.id },
        include: { files: true }
      });

      if (!certification || certification.deletedAt || certification.userId !== req.user.id) {
        throw new AppError('Certification not found', 404);
      }

      res.json({ certification });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Certification not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, issuingOrganization, description, issueDate, expiryDate, credentialId, credentialUrl, category, imageUrl, educationId } = req.body;

      const certification = await prisma.certification.create({
        data: {
          userId: req.user.id,
          name,
          issuingOrganization,
          description,
          issueDate: new Date(issueDate),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          credentialId,
          credentialUrl,
          category,
          imageUrl,
          educationId: educationId || null
        }
      });

      res.status(201).json({ certification });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.certification.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Certification not found', 404);
      }

      const { name, issuingOrganization, description, issueDate, expiryDate, credentialId, credentialUrl, category, imageUrl, educationId } = req.body;

      const certification = await prisma.certification.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(issuingOrganization !== undefined && { issuingOrganization }),
          ...(description !== undefined && { description }),
          ...(issueDate !== undefined && { issueDate: new Date(issueDate) }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
          ...(credentialId !== undefined && { credentialId }),
          ...(credentialUrl !== undefined && { credentialUrl }),
          ...(category !== undefined && { category }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(educationId !== undefined && { educationId: educationId || null })
        }
      });

      res.json({ certification });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Certification not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.certification.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Certification not found', 404);
      }

      await prisma.certification.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Certification deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Certification not found', 404));
      next(error);
    }
  },

  async uploadFile(req, res, next) {
    try {
      const certification = await prisma.certification.findUnique({
        where: { id: req.params.id }
      });

      if (!certification || certification.deletedAt || certification.userId !== req.user.id) {
        throw new AppError('Certification not found', 404);
      }

      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const urlPath = `certificates/${req.file.filename}`;

      const file = await prisma.certificateFile.create({
        data: {
          certificationId: req.params.id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: urlPath
        }
      });

      res.status(201).json({ file });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = certificationController;

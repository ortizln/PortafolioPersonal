const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const slugify = require('slugify');
const { audit } = require('../helpers/audit');

const companyController = {
  async get(req, res, next) {
    try {
      const company = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      res.json({ company });
    } catch (error) {
      next(error);
    }
  },

  async upsert(req, res, next) {
    try {
      const {
        name, legalName, slogan, shortDescription, description,
        mission, vision, history, email, phone, whatsapp, website,
        address, city, country, logoUrl, logoDarkUrl, faviconUrl,
        heroImageUrl, primaryColor, secondaryColor, accentColor,
        foundedYear, seoTitle, seoDescription, isActive
      } = req.body;

      if (!name) throw new AppError('Name is required', 400);

      const existing = await prisma.company.findFirst();
      const data = {
        name, legalName, slogan, shortDescription, description,
        mission, vision, history, email, phone, whatsapp, website,
        address, city, country, logoUrl, logoDarkUrl, faviconUrl,
        heroImageUrl, primaryColor, secondaryColor, accentColor,
        foundedYear: foundedYear !== undefined ? Number(foundedYear) : undefined,
        seoTitle, seoDescription, isActive
      };

      const company = existing
        ? await prisma.company.update({ where: { id: existing.id }, data })
        : await prisma.company.create({
            data: { ...data, slug: slugify(name, { lower: true, strict: true }) }
          });

      await audit({
        userId: req.user?.id,
        action: existing ? 'UPDATE' : 'CREATE',
        entity: 'Company',
        entityId: company.id,
        description: existing ? 'Información corporativa actualizada' : 'Empresa creada',
        req
      });

      res.json({ company });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.company.findFirst();
      if (existing) {
        await prisma.company.delete({ where: { id: existing.id } });
      }
      res.json({ message: 'Company deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = companyController;

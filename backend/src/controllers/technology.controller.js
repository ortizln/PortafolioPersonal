const prisma = require('../config/database');

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const technologyController = {
  async getAll(req, res, next) {
    try {
      const technologies = await prisma.technology.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { projects: true, skills: true } } }
      });
      res.json(technologies);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description, icon, color, category, website } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }
      const slug = req.body.slug || slugify(name);
      const technology = await prisma.technology.create({
        data: { name: name.trim(), slug, description, icon, color, category, website }
      });
      res.status(201).json(technology);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe una tecnología con ese nombre o slug' });
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, slug, description, icon, color, category, website } = req.body;
      const data = {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(category !== undefined && { category }),
        ...(website !== undefined && { website })
      };
      const technology = await prisma.technology.update({
        where: { id },
        data,
        include: { _count: { select: { projects: true, skills: true } } }
      });
      res.json(technology);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe una tecnología con ese nombre o slug' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Tecnología no encontrada' });
      }
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.technology.delete({ where: { id } });
      res.json({ message: 'Tecnología eliminada' });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Tecnología no encontrada' });
      }
      next(error);
    }
  },
};

module.exports = technologyController;

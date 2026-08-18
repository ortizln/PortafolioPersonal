const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const slugify = require('slugify');
const { audit } = require('../helpers/audit');

const postInclude = {
  author: { select: { id: true, name: true, email: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } }
};

function toSlug(value) {
  return slugify(value, { lower: true, strict: true });
}

function buildListWhere(req) {
  const where = { deletedAt: null };
  const { search, status, category, tag } = req.query;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) where.status = status.toUpperCase();
  if (category) where.categories = { some: { category: { slug: category } } };
  if (tag) where.tags = { some: { tag: { slug: tag } } };
  return where;
}

function mapPost(post) {
  return {
    ...post,
    categories: (post.categories || []).map((c) => c.category),
    tags: (post.tags || []).map((t) => t.tag)
  };
}

const postController = {
  // ===== Posts =====
  async getAll(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const where = buildListWhere(req);
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: postInclude,
          orderBy: [{ status: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.post.count({ where })
      ]);
      res.json({ posts: posts.map(mapPost), total, page, limit });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: req.params.id },
        include: postInclude
      });
      if (!post || post.deletedAt) throw new AppError('Post no encontrado', 404);
      res.json({ post: mapPost(post) });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const post = await prisma.post.findUnique({
        where: { slug: req.params.slug },
        include: postInclude
      });
      if (!post || post.deletedAt) throw new AppError('Post no encontrado', 404);
      res.json({ post: mapPost(post) });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        status,
        publishedAt,
        seoTitle,
        seoDescription,
        categoryIds,
        tagIds
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'El título es obligatorio' });
      }

      const data = {
        title: title.trim(),
        slug: slug || toSlug(title),
        excerpt: excerpt || null,
        content: content || null,
        coverImage: coverImage || null,
        status: (status || 'DRAFT').toUpperCase(),
        publishedAt: status === 'PUBLISHED' ? (publishedAt ? new Date(publishedAt) : new Date()) : publishedAt ? new Date(publishedAt) : null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        authorId: req.user.id,
        categories: categoryIds && categoryIds.length ? { create: categoryIds.map((id) => ({ categoryId: id })) } : undefined,
        tags: tagIds && tagIds.length ? { create: tagIds.map((id) => ({ tagId: id })) } : undefined
      };

      const post = await prisma.post.create({ data });
      await audit(req, 'CREATE', 'Post', post.id, `Post "${post.title}" creado`);
      const created = await prisma.post.findUnique({ where: { id: post.id }, include: postInclude });
      res.status(201).json({ post: mapPost(created) });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe un post con ese slug' });
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) throw new AppError('Post no encontrado', 404);

      const isOwner = existing.authorId === req.user.id;
      const hasManage = req.user.permissions?.includes('posts.manage');
      if (!isOwner && !hasManage) {
        throw new AppError('No tienes permiso para editar este post', 403);
      }

      const {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        status,
        publishedAt,
        seoTitle,
        seoDescription,
        categoryIds,
        tagIds,
        clearCategories,
        clearTags
      } = req.body;

      const data = {};
      if (title !== undefined) data.title = title.trim();
      if (slug !== undefined) data.slug = slug || toSlug(data.title || existing.title);
      if (excerpt !== undefined) data.excerpt = excerpt || null;
      if (content !== undefined) data.content = content || null;
      if (coverImage !== undefined) data.coverImage = coverImage || null;
      if (seoTitle !== undefined) data.seoTitle = seoTitle || null;
      if (seoDescription !== undefined) data.seoDescription = seoDescription || null;

      if (status !== undefined) {
        data.status = status.toUpperCase();
        if (data.status === 'PUBLISHED' && !existing.publishedAt) {
          data.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
        }
      }
      if (publishedAt !== undefined) data.publishedAt = new Date(publishedAt);

      if (categoryIds !== undefined) {
        await prisma.postCategoryPost.deleteMany({ where: { postId: existing.id } });
        if (categoryIds.length) {
          await prisma.postCategoryPost.createMany({
            data: categoryIds.map((id) => ({ postId: existing.id, categoryId: id }))
          });
        }
      }
      if (tagIds !== undefined) {
        await prisma.postTagPost.deleteMany({ where: { postId: existing.id } });
        if (tagIds.length) {
          await prisma.postTagPost.createMany({
            data: tagIds.map((id) => ({ postId: existing.id, tagId: id }))
          });
        }
      }

      const post = await prisma.post.update({ where: { id: existing.id }, data });
      await audit(req, 'UPDATE', 'Post', post.id, `Post "${post.title}" actualizado`);
      const updated = await prisma.post.findUnique({ where: { id: post.id }, include: postInclude });
      res.json({ post: mapPost(updated) });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe un post con ese slug' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Post no encontrado' });
      }
      next(error);
    }
  },

  async publish(req, res, next) {
    try {
      const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) throw new AppError('Post no encontrado', 404);

      const isOwner = existing.authorId === req.user.id;
      const hasPublish = req.user.permissions?.includes('posts.publish');
      if (!isOwner && !hasPublish) {
        throw new AppError('No tienes permiso para publicar este post', 403);
      }

      const post = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() }
      });
      await audit(req, 'UPDATE', 'Post', post.id, `Post "${post.title}" publicado`);
      const updated = await prisma.post.findUnique({ where: { id: post.id }, include: postInclude });
      res.json({ post: mapPost(updated) });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Post no encontrado' });
      }
      next(error);
    }
  },

  async archive(req, res, next) {
    try {
      const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) throw new AppError('Post no encontrado', 404);

      const isOwner = existing.authorId === req.user.id;
      const hasManage = req.user.permissions?.includes('posts.manage');
      if (!isOwner && !hasManage) {
        throw new AppError('No tienes permiso para archivar este post', 403);
      }

      const post = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: 'ARCHIVED' }
      });
      await audit(req, 'UPDATE', 'Post', post.id, `Post "${post.title}" archivado`);
      res.json({ post: mapPost({ ...post, categories: [], tags: [] }) });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Post no encontrado' });
      }
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const post = await prisma.post.findUnique({ where: { id: req.params.id } });
      if (!post || post.deletedAt) throw new AppError('Post no encontrado', 404);

      const isOwner = post.authorId === req.user.id;
      const hasManage = req.user.permissions?.includes('posts.manage');
      if (!isOwner && !hasManage) {
        throw new AppError('No tienes permiso para eliminar este post', 403);
      }

      await prisma.post.update({
        where: { id: post.id },
        data: { deletedAt: new Date() }
      });
      await audit(req, 'DELETE', 'Post', post.id, `Post "${post.title}" eliminado`);
      res.json({ message: 'Post eliminado' });
    } catch (error) {
      next(error);
    }
  },

  // ===== Categorías =====
  async getCategories(req, res, next) {
    try {
      const categories = await prisma.postCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } }
      });
      res.json(categories);
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
      const category = await prisma.postCategory.create({
        data: { name: name.trim(), slug: toSlug(name), description: description || null }
      });
      await audit(req, 'CREATE', 'PostCategory', category.id, `Categoría "${category.name}" creada`);
      res.status(201).json(category);
    } catch (error) {
      if (error.code === 'P2002') return res.status(409).json({ error: 'Ya existe una categoría con ese slug' });
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { name, description } = req.body;
      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (description !== undefined) data.description = description || null;
      const category = await prisma.postCategory.update({ where: { id: req.params.id }, data });
      await audit(req, 'UPDATE', 'PostCategory', category.id, `Categoría "${category.name}" actualizada`);
      res.json(category);
    } catch (error) {
      if (error.code === 'P2002') return res.status(409).json({ error: 'Ya existe una categoría con ese slug' });
      if (error.code === 'P2025') return res.status(404).json({ error: 'Categoría no encontrada' });
      next(error);
    }
  },

  async removeCategory(req, res, next) {
    try {
      const category = await prisma.postCategory.delete({ where: { id: req.params.id } });
      await audit(req, 'DELETE', 'PostCategory', category.id, `Categoría "${category.name}" eliminada`);
      res.json({ message: 'Categoría eliminada' });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Categoría no encontrada' });
      next(error);
    }
  },

  // ===== Tags =====
  async getTags(req, res, next) {
    try {
      const tags = await prisma.postTag.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } }
      });
      res.json(tags);
    } catch (error) {
      next(error);
    }
  },

  async createTag(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
      const tag = await prisma.postTag.create({
        data: { name: name.trim(), slug: toSlug(name) }
      });
      await audit(req, 'CREATE', 'PostTag', tag.id, `Tag "${tag.name}" creado`);
      res.status(201).json(tag);
    } catch (error) {
      if (error.code === 'P2002') return res.status(409).json({ error: 'Ya existe un tag con ese slug' });
      next(error);
    }
  },

  async removeTag(req, res, next) {
    try {
      const tag = await prisma.postTag.delete({ where: { id: req.params.id } });
      await audit(req, 'DELETE', 'PostTag', tag.id, `Tag "${tag.name}" eliminado`);
      res.json({ message: 'Tag eliminado' });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Tag no encontrado' });
      next(error);
    }
  }
};

module.exports = postController;

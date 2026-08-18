const { Router } = require('express');
const postController = require('../controllers/post.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/categories', requirePermission('posts.read', 'posts.manage'), postController.getCategories);
router.post('/categories', requirePermission('posts.manage'), postController.createCategory);
router.put('/categories/:id', requirePermission('posts.manage'), postController.updateCategory);
router.delete('/categories/:id', requirePermission('posts.manage'), postController.removeCategory);

router.get('/tags', requirePermission('posts.read', 'posts.manage'), postController.getTags);
router.post('/tags', requirePermission('posts.manage'), postController.createTag);
router.delete('/tags/:id', requirePermission('posts.manage'), postController.removeTag);

router.get('/', requirePermission('posts.read', 'posts.manage'), postController.getAll);
router.get('/slug/:slug', postController.getBySlug);
router.get('/:id', postController.getById);
router.post('/', requirePermission('posts.manage'), postController.create);
router.put('/:id', requirePermission('posts.manage'), postController.update);
router.put('/:id/publish', requirePermission('posts.publish'), postController.publish);
router.put('/:id/archive', requirePermission('posts.manage'), postController.archive);
router.delete('/:id', requirePermission('posts.manage'), postController.remove);

module.exports = router;

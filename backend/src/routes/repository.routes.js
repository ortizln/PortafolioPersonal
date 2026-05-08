const { Router } = require('express');
const repositoryController = require('../controllers/repository.controller');
const { authenticate } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/sync/github', repositoryController.syncFromGithub);
router.get('/sync/gitlab', repositoryController.syncFromGitlab);
router.get('/', repositoryController.getAll);
router.get('/:id', idParam, repositoryController.getById);
router.post('/', repositoryController.create);
router.put('/:id', idParam, repositoryController.update);
router.delete('/:id', idParam, repositoryController.delete);

module.exports = router;

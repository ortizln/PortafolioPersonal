const { Router } = require('express');
const quoteController = require('../controllers/quote.controller');
const { quoteValidation } = require('../validations');

const router = Router();

router.post('/', quoteValidation, quoteController.create);

module.exports = router;

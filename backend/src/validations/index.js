const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate
];

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and a number'),
  body('name').trim().escape().notEmpty().withMessage('Name required'),
  validate
];

const profileValidation = [
  body('fullName').trim().escape().notEmpty().withMessage('Full name required'),
  body('professionalTitle').trim().escape().notEmpty().withMessage('Professional title required'),
  validate
];

const experienceValidation = [
  body('company').trim().escape().notEmpty().withMessage('Company required'),
  body('position').trim().escape().notEmpty().withMessage('Position required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  validate
];

const educationValidation = [
  body('institution').trim().escape().notEmpty().withMessage('Institution required'),
  body('degree').trim().escape().notEmpty().withMessage('Degree required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  validate
];

const certificationValidation = [
  body('name').trim().escape().notEmpty().withMessage('Name required'),
  body('issuingOrganization').trim().escape().notEmpty().withMessage('Issuing organization required'),
  body('issueDate').isISO8601().withMessage('Valid issue date required'),
  validate
];

const projectValidation = [
  body('title').trim().escape().notEmpty().withMessage('Title required'),
  validate
];

const skillValidation = [
  body('name').trim().escape().notEmpty().withMessage('Name required'),
  body('percentage').isInt({ min: 0, max: 100 }).withMessage('Percentage must be 0-100'),
  validate
];

const languageValidation = [
  body('name').trim().escape().notEmpty().withMessage('Language name required'),
  body('level').trim().escape().notEmpty().withMessage('Level required'),
  body('percentage').isInt({ min: 0, max: 100 }).withMessage('Percentage must be 0-100'),
  validate
];

const contactValidation = [
  body('name').trim().escape().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('subject').trim().escape().notEmpty().isLength({ max: 200 }).withMessage('Subject required (max 200 chars)'),
  body('message').trim().escape().notEmpty().isLength({ max: 2000 }).withMessage('Message must be under 2000 characters'),
  validate
];

const idParam = [
  param('id').isUUID().withMessage('Invalid ID format'),
  validate
];

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  profileValidation,
  experienceValidation,
  educationValidation,
  certificationValidation,
  projectValidation,
  skillValidation,
  languageValidation,
  contactValidation,
  idParam
};

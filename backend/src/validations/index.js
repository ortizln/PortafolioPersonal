const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate
];

const registerValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name required'),
  validate
];

const profileValidation = [
  body('fullName').notEmpty().withMessage('Full name required'),
  body('professionalTitle').notEmpty().withMessage('Professional title required'),
  validate
];

const experienceValidation = [
  body('company').notEmpty().withMessage('Company required'),
  body('position').notEmpty().withMessage('Position required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  validate
];

const educationValidation = [
  body('institution').notEmpty().withMessage('Institution required'),
  body('degree').notEmpty().withMessage('Degree required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  validate
];

const certificationValidation = [
  body('name').notEmpty().withMessage('Name required'),
  body('issuingOrganization').notEmpty().withMessage('Issuing organization required'),
  body('issueDate').isISO8601().withMessage('Valid issue date required'),
  validate
];

const projectValidation = [
  body('title').notEmpty().withMessage('Title required'),
  validate
];

const skillValidation = [
  body('name').notEmpty().withMessage('Name required'),
  body('percentage').isInt({ min: 0, max: 100 }).withMessage('Percentage must be 0-100'),
  validate
];

const languageValidation = [
  body('name').notEmpty().withMessage('Language name required'),
  body('level').notEmpty().withMessage('Level required'),
  body('percentage').isInt({ min: 0, max: 100 }).withMessage('Percentage must be 0-100'),
  validate
];

const contactValidation = [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('message').notEmpty().withMessage('Message required'),
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

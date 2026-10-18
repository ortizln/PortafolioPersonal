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
  body('email').isEmail().withMessage('Valid email required'),
  body('subject').trim().escape().notEmpty().isLength({ max: 200 }).withMessage('Subject required (max 200 chars)'),
  body('message').trim().escape().notEmpty().isLength({ max: 2000 }).withMessage('Message must be under 2000 characters'),
  validate
];

const idParam = [
  param('id').isUUID().withMessage('Invalid ID format'),
  validate
];

const chatSessionValidation = [
  body('channel').optional().isIn(['WEB', 'WHATSAPP']).withMessage('Invalid channel'),
  body('consent').optional().isBoolean().withMessage('Consent must be boolean'),
  validate
];

const chatMessageValidation = [
  body('body').trim().notEmpty().isLength({ max: 4000 }).withMessage('Message required (max 4000 chars)'),
  body('senderType').optional().isIn(['VISITOR', 'BOT', 'AGENT', 'SYSTEM']).withMessage('Invalid sender type'),
  body('clientMessageId').optional().isLength({ max: 100 }),
  validate
];

const handoffValidation = [
  body('reason').optional().trim().isLength({ max: 2000 }),
  body('contactName').optional().trim().escape().isLength({ max: 150 }),
  body('contactEmail').optional().isEmail().withMessage('Valid email required'),
  body('contactPhone').optional().trim().isLength({ max: 40 }),
  validate
];

const quoteValidation = [
  body('type').trim().notEmpty().isLength({ max: 120 }).withMessage('Quote type required'),
  body('serviceId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid service id'),
  body('description').trim().notEmpty().isLength({ max: 4000 }).withMessage('Description required (max 4000 chars)'),
  body('features').optional().isArray({ max: 50 }).withMessage('Features must be an array'),
  body('budget').optional().trim().isLength({ max: 120 }),
  body('deadline').optional().trim().isLength({ max: 120 }),
  body('name').trim().escape().notEmpty().isLength({ max: 150 }).withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').optional().trim().isLength({ max: 40 }),
  body('sessionId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid session id'),
  validate
];

const quoteUpdateValidation = [
  body('status').optional().isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'SPAM']).withMessage('Invalid quote status'),
  body('budgetRange').optional().trim().isLength({ max: 120 }),
  body('deadline').optional().trim().isLength({ max: 120 }),
  body('contactName').optional().trim().escape().isLength({ max: 150 }),
  body('contactEmail').optional().isEmail().withMessage('Valid email required'),
  body('contactPhone').optional().trim().isLength({ max: 40 }),
  body('projectDescription').optional().trim().isLength({ max: 4000 }),
  validate
];

const handoffUpdateValidation = [
  body('status').optional().isIn(['REQUESTED', 'ACCEPTED', 'CLOSED', 'CANCELLED']).withMessage('Invalid handoff status'),
  body('assignedToId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid assignee id'),
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
  idParam,
  chatSessionValidation,
  chatMessageValidation,
  handoffValidation,
  quoteValidation,
  quoteUpdateValidation,
  handoffUpdateValidation
};

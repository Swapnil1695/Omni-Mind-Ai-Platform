const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    logger.warn('Validation errors:', { 
      errors: errors.array(),
      path: req.path,
      method: req.method 
    });

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  };
};

// Common validators
const commonValidators = {
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .optional(),
  
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  title: body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  
  description: body('description')
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters')
    .optional(),
  
  uuid: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  date: body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)'),
  
  priority: body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  
  status: body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .withMessage('Invalid status'),
};

// Validation schemas
const validationSchemas = {
  register: validate([
    commonValidators.email,
    commonValidators.name,
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('timezone')
      .optional()
      .isIn(Intl.supportedValuesOf('timeZone'))
      .withMessage('Invalid timezone'),
  ]),

  login: validate([
    commonValidators.email,
    body('password').notEmpty().withMessage('Password is required'),
  ]),

  createProject: validate([
    commonValidators.title,
    commonValidators.description,
    commonValidators.priority.optional(),
    commonValidators.date.optional(),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Invalid color format. Use hex format (#RRGGBB)'),
    body('icon')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Icon cannot exceed 50 characters'),
  ]),

  updateProject: validate([
    commonValidators.uuid,
    commonValidators.title.optional(),
    commonValidators.description.optional(),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Invalid color format. Use hex format (#RRGGBB)'),
  ]),

  createTask: validate([
    commonValidators.title,
    commonValidators.description,
    commonValidators.priority,
    commonValidators.status.optional(),
    commonValidators.date.optional(),
    body('project_id')
      .optional()
      .isUUID()
      .withMessage('Invalid project ID format'),
    body('estimated_duration')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('Estimated duration must be between 1 and 1440 minutes'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
  ]),

  updateTask: validate([
    commonValidators.uuid,
    commonValidators.title.optional(),
    commonValidators.description.optional(),
    commonValidators.priority.optional(),
    commonValidators.status.optional(),
    commonValidators.date.optional(),
  ]),

  createNotification: validate([
    body('type')
      .isIn(['info', 'warning', 'error', 'reminder', 'achievement', 'system'])
      .withMessage('Invalid notification type'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    commonValidators.priority,
    body('action_url')
      .optional()
      .isURL()
      .withMessage('Invalid URL format'),
    body('scheduled_for')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format for scheduled notification'),
  ]),

  updateProfile: validate([
    commonValidators.name.optional(),
    body('avatar_url')
      .optional()
      .isURL()
      .withMessage('Invalid avatar URL'),
    body('timezone')
      .optional()
      .isIn(Intl.supportedValuesOf('timeZone'))
      .withMessage('Invalid timezone'),
  ]),

  extractTasks: validate([
    body('text')
      .trim()
      .isLength({ min: 10, max: 10000 })
      .withMessage('Text must be between 10 and 10000 characters'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
  ]),

  summarizeMeeting: validate([
    body('transcript')
      .trim()
      .isLength({ min: 50, max: 50000 })
      .withMessage('Transcript must be between 50 and 50000 characters'),
    body('duration')
      .isInt({ min: 1, max: 480 })
      .withMessage('Duration must be between 1 and 480 minutes'),
    body('participants')
      .optional()
      .isArray()
      .withMessage('Participants must be an array'),
  ]),

  // Query parameter validators
  pagination: validate([
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isIn(['created_at', 'updated_at', 'due_date', 'title', 'priority'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc'),
  ]),
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Recursive sanitization function
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize body, query, and params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https: wss:"
    );
  }

  next();
};

// Rate limiting helper (to be used with express-rate-limit)
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  validate,
  commonValidators,
  validationSchemas,
  sanitizeInput,
  xssProtection,
  rateLimitConfig,
};
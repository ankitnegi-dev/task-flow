/**
 * src/middleware/validate.js
 *
 * Input validation layer using express-validator.
 *
 * Exports:
 *  - validationRules  - object of named rule arrays to apply per route
 *  - validate         - middleware that checks the validation result and
 *                       short-circuits with 422 if any rule failed
 */

const { body, validationResult } = require('express-validator');

// ─── Rule sets ────────────────────────────────────────────────────────────────

const validationRules = {
  /**
   * POST /api/auth/register
   * Requires a non-empty name, a valid email, and a password of at least 6 chars.
   */
  register: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),

    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required')
      .normalizeEmail(),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],

  /**
   * POST /api/auth/login
   * Requires a valid email and a non-empty password.
   */
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  /**
   * POST /api/tasks
   * Title is required; priority and status are optional enum values.
   */
  createTask: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must not exceed 200 characters'),

    body('description')
      .optional({ nullable: true })
      .isString()
      .withMessage('Description must be a string'),

    body('dueDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Due date must be a valid ISO 8601 date string'),

    body('priority')
      .optional()
      .isIn(['High', 'Medium', 'Low'])
      .withMessage('Priority must be one of: High, Medium, Low'),

    body('status')
      .optional()
      .isIn(['Pending', 'Completed'])
      .withMessage('Status must be one of: Pending, Completed'),

    body('tagIds')
      .optional()
      .isArray()
      .withMessage('tagIds must be an array'),

    body('tagIds.*')
      .optional()
      .isString()
      .withMessage('Each tag ID must be a string'),
  ],

  /**
   * PUT /api/tasks/:id
   * Same rules as createTask but every field is optional (partial update).
   */
  updateTask: [
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title must not be empty when provided')
      .isLength({ max: 200 })
      .withMessage('Title must not exceed 200 characters'),

    body('description')
      .optional({ nullable: true })
      .isString()
      .withMessage('Description must be a string'),

    body('dueDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Due date must be a valid ISO 8601 date string'),

    body('priority')
      .optional()
      .isIn(['High', 'Medium', 'Low'])
      .withMessage('Priority must be one of: High, Medium, Low'),

    body('status')
      .optional()
      .isIn(['Pending', 'Completed'])
      .withMessage('Status must be one of: Pending, Completed'),

    body('tagIds')
      .optional()
      .isArray()
      .withMessage('tagIds must be an array'),

    body('tagIds.*')
      .optional()
      .isString()
      .withMessage('Each tag ID must be a string'),
  ],
};

// ─── Validate middleware ──────────────────────────────────────────────────────

/**
 * Run after a validationRules array in a route definition.
 * Collects any validation errors and returns a structured 422 response.
 * If no errors are found, calls next() to continue processing.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validate(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    // Map errors to a simple { field, message } shape for easy client consumption
    const errors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
}

module.exports = { validationRules, validate };

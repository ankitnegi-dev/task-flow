/**
 * src/routes/taskRoutes.js
 *
 * Task routes mounted at /api/tasks.
 * All routes require a valid JWT session (auth middleware applied globally).
 *
 * Route ordering note:
 *   Express matches routes in definition order.
 *   The /bulk and /stats static paths MUST be defined before /:id so they
 *   are not accidentally captured as ID parameters.
 *
 * GET    /           - list tasks (with filtering, pagination, sorting)
 * POST   /           - create a new task
 * POST   /bulk       - bulk complete or delete
 * GET    /stats      - aggregated statistics
 * PUT    /:id        - update a task
 * DELETE /:id        - delete a task
 * PATCH  /:id/status - toggle task status
 */

const express = require('express');
const router = express.Router();

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleStatus,
  getStats,
  bulkAction,
} = require('../controllers/taskController');

const auth = require('../middleware/auth');
const { validationRules, validate } = require('../middleware/validate');

// Apply auth to every route in this router
router.use(auth);

/**
 * GET /api/tasks
 * Returns a paginated, filtered list of the user's tasks.
 * Supported query params: status, priority, search, tagIds, page, limit, sort
 */
router.get('/', getTasks);

/**
 * POST /api/tasks
 * Creates a new task. Title is required; other fields are optional.
 */
router.post(
  '/',
  validationRules.createTask,
  validate,
  createTask
);

/**
 * POST /api/tasks/bulk
 * Applies 'complete' or 'delete' to an array of task IDs.
 * Static path - must appear before /:id.
 */
router.post('/bulk', bulkAction);

/**
 * GET /api/tasks/stats
 * Returns task counts by status/priority, completion rate, and overdue count.
 * Static path - must appear before /:id.
 */
router.get('/stats', getStats);

/**
 * PUT /api/tasks/:id
 * Updates a task owned by the authenticated user.
 * All fields optional (partial update).
 */
router.put(
  '/:id',
  validationRules.updateTask,
  validate,
  updateTask
);

/**
 * DELETE /api/tasks/:id
 * Permanently deletes a task owned by the authenticated user.
 */
router.delete('/:id', deleteTask);

/**
 * PATCH /api/tasks/:id/status
 * Toggles task status between Pending and Completed.
 */
router.patch('/:id/status', toggleStatus);

module.exports = router;

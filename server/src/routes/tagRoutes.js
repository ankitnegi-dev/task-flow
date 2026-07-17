/**
 * src/routes/tagRoutes.js
 *
 * Tag routes mounted at /api/tags.
 * All routes require a valid JWT session.
 *
 * GET    /     - retrieve all tags (with task counts)
 * POST   /     - create a new tag
 * DELETE /:id  - delete a tag (cascades to task associations)
 */

const express = require('express');
const router = express.Router();

const { getTags, createTag, deleteTag } = require('../controllers/tagController');
const auth = require('../middleware/auth');

// Apply auth to every route in this router
router.use(auth);

/**
 * GET /api/tags
 * Returns all tags ordered alphabetically, each with a task count.
 */
router.get('/', getTags);

/**
 * POST /api/tags
 * Creates a new tag.
 * Body: { name: string, color?: string (hex) }
 */
router.post('/', createTag);

/**
 * DELETE /api/tags/:id
 * Deletes a tag and removes all its task associations.
 */
router.delete('/:id', deleteTag);

module.exports = router;

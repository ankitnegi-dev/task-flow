/**
 * src/controllers/tagController.js
 *
 * Tag management controller for TaskFlow.
 *
 * Tags are global entities (not per-user) that can be attached to tasks.
 * All tag routes require authentication so that anonymous access is prevented,
 * but the tag data itself is shared across the system.
 *
 * Exports: getTags, createTag, deleteTag
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate that a string is a well-formed CSS hex colour code.
 * Accepts 3- and 6-digit hex values with a leading '#'.
 *
 * @param {string} color
 * @returns {boolean}
 */
function isValidHexColor(color) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/tags
 *
 * Returns all tags, ordered alphabetically by name.
 * Each tag includes the number of tasks it is associated with via _count.
 */
async function getTags(req, res, next) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        // Include the count of tasks using each tag for informational purposes
        _count: {
          select: { taskTags: true },
        },
      },
    });

    // Reshape to a flat structure with a taskCount field
    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      taskCount: tag._count.taskTags,
    }));

    return res.status(200).json({
      success: true,
      data: formattedTags,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tags
 *
 * Creates a new tag.
 *
 * Body:
 *   name  {string}  - required, label for the tag
 *   color {string}  - optional hex colour code (default: "#6366f1")
 */
async function createTag(req, res, next) {
  try {
    const { name, color } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required',
      });
    }

    const trimmedName = name.trim();

    // Validate colour when provided
    const tagColor = color || '#6366f1';
    if (!isValidHexColor(tagColor)) {
      return res.status(400).json({
        success: false,
        message: 'Color must be a valid hex code (e.g. #ff0000 or #f00)',
      });
    }

    // Prevent duplicate tag names (case-insensitive check)
    const existing = await prisma.tag.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A tag with that name already exists',
      });
    }

    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
        color: tagColor,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Tag created',
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        taskCount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tags/:id
 *
 * Deletes a tag by ID.
 * The onDelete: Cascade on TaskTag in the schema ensures all TaskTag
 * join records referencing this tag are removed automatically.
 */
async function deleteTag(req, res, next) {
  try {
    const { id } = req.params;

    // Verify the tag exists before attempting deletion
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    await prisma.tag.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Tag deleted',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTags, createTag, deleteTag };

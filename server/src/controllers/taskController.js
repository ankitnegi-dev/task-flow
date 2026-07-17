/**
 * src/controllers/taskController.js
 *
 * Task management controller for TaskFlow.
 *
 * All routes are protected - req.user.userId is set by the auth middleware
 * and used to scope every query so users can only access their own tasks.
 *
 * Exports: getTasks, createTask, updateTask, deleteTask,
 *          toggleStatus, getStats, bulkAction
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * The standard Prisma include block for fetching a task with its tags.
 * Re-used across multiple queries for consistency.
 */
const TASK_WITH_TAGS = {
  taskTags: {
    include: {
      tag: true,
    },
  },
};

/**
 * Map a raw Prisma task record to the API response shape.
 * Adds the computed `isOverdue` field and flattens tags for convenience.
 *
 * @param {object} task - Prisma task with taskTags included
 * @returns {object}
 */
function formatTask(task) {
  const now = new Date();
  const isOverdue =
    task.dueDate !== null &&
    task.dueDate < now &&
    task.status !== 'Completed';

  return {
    ...task,
    // Flatten tags from the join table into a plain array
    tags: task.taskTags ? task.taskTags.map((tt) => tt.tag) : [],
    isOverdue,
  };
}

/**
 * Build a Prisma `orderBy` clause from a sort query parameter.
 *
 * Supported values: dueDate_asc, dueDate_desc, priority_asc,
 *                   priority_desc, createdAt_desc (default)
 *
 * @param {string|undefined} sort
 * @returns {object|object[]}
 */
function buildOrderBy(sort) {
  // Priority is an enum (High > Medium > Low); Prisma sorts enums
  // lexicographically by default, which doesn't match business logic.
  // We use a raw sort with the enum index workaround only if truly needed;
  // for now, simple field sorts are provided as supported options.
  const map = {
    dueDate_asc: { dueDate: 'asc' },
    dueDate_desc: { dueDate: 'desc' },
    priority_asc: { priority: 'asc' },
    priority_desc: { priority: 'desc' },
    createdAt_desc: { createdAt: 'desc' },
    createdAt_asc: { createdAt: 'asc' },
  };

  return map[sort] || { createdAt: 'desc' };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/tasks
 *
 * Returns a paginated, filtered, and sorted list of the user's tasks.
 *
 * Query params:
 *   status      - Pending | Completed
 *   priority    - High | Medium | Low
 *   search      - string matched against title and description (case-insensitive)
 *   tagIds      - comma-separated tag UUIDs; tasks must have ALL provided tags
 *   page        - page number (default 1)
 *   limit       - items per page (default 10, max 100)
 *   sort        - dueDate_asc | dueDate_desc | priority_asc | priority_desc | createdAt_desc
 */
async function getTasks(req, res, next) {
  try {
    const userId = req.user.userId;

    // ── Parse query parameters ─────────────────────────────────────────────
    const status = req.query.status;
    const priority = req.query.priority;
    const search = req.query.search;
    const sort = req.query.sort;

    // Pagination - clamp limit between 1 and 100
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Tag filter - comma-separated list of tag UUIDs
    const tagIdsRaw = req.query.tagIds;
    const tagIds =
      tagIdsRaw && tagIdsRaw.trim()
        ? tagIdsRaw.split(',').map((id) => id.trim()).filter(Boolean)
        : [];

    // ── Build where clause ────────────────────────────────────────────────
    const where = { userId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Tag filter: tasks must have ALL specified tags
    // Implemented as nested every/some checks on the join table
    if (tagIds.length > 0) {
      // For each required tag, add an AND condition that the task has it
      where.AND = tagIds.map((tagId) => ({
        taskTags: {
          some: { tagId },
        },
      }));
    }

    // ── Execute count + fetch in parallel ─────────────────────────────────
    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: TASK_WITH_TAGS,
        orderBy: buildOrderBy(sort),
        skip,
        take: limit,
      }),
    ]);

    const formattedTasks = tasks.map(formatTask);

    return res.status(200).json({
      success: true,
      data: {
        tasks: formattedTasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks
 *
 * Creates a new task for the authenticated user.
 * Optionally associates the task with existing tags via tagIds array.
 */
async function createTask(req, res, next) {
  try {
    const userId = req.user.userId;
    const { title, description, dueDate, priority, status, tagIds } = req.body;

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'Medium',
        status: status || 'Pending',
        // Create TaskTag join records for every provided tag ID
        taskTags:
          tagIds && tagIds.length > 0
            ? {
                create: tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
      },
      include: TASK_WITH_TAGS,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created',
      data: formatTask(task),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id
 *
 * Updates an existing task owned by the authenticated user.
 * When tagIds is supplied the existing tag associations are replaced.
 */
async function updateTask(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, description, dueDate, priority, status, tagIds } = req.body;

    // Verify ownership before updating
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Build the update payload - only include fields that were sent
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;

    // Replace tag associations when tagIds is explicitly provided
    if (tagIds !== undefined) {
      // Remove all existing TaskTag rows for this task first
      await prisma.taskTag.deleteMany({ where: { taskId: id } });

      // Then create the new set
      if (tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tagId) => ({ taskId: id, tagId })),
          skipDuplicates: true,
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: TASK_WITH_TAGS,
    });

    return res.status(200).json({
      success: true,
      message: 'Task updated',
      data: formatTask(updatedTask),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id
 *
 * Permanently deletes a task owned by the authenticated user.
 * Cascade rules in the schema handle TaskTag cleanup automatically.
 */
async function deleteTask(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify ownership before deleting
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await prisma.task.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Task deleted',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/tasks/:id/status
 *
 * Toggles a task's status between Pending and Completed.
 */
async function toggleStatus(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const newStatus = existing.status === 'Pending' ? 'Completed' : 'Pending';

    const updated = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
      include: TASK_WITH_TAGS,
    });

    return res.status(200).json({
      success: true,
      message: 'Status updated',
      data: formatTask(updated),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/stats
 *
 * Returns aggregate statistics for the authenticated user's tasks:
 *   - Count by status
 *   - Count by priority
 *   - Total tasks
 *   - Completion rate (%)
 *   - Overdue count
 */
async function getStats(req, res, next) {
  try {
    const userId = req.user.userId;
    const now = new Date();

    // Run all aggregation queries in parallel for performance
    const [byStatusRaw, byPriorityRaw, overdueCount] = await Promise.all([
      // Group by status
      prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),

      // Group by priority
      prisma.task.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { _all: true },
      }),

      // Overdue: dueDate in the past and still Pending
      prisma.task.count({
        where: {
          userId,
          status: 'Pending',
          dueDate: { lt: now },
        },
      }),
    ]);

    // Build friendly objects from the groupBy results
    const byStatus = { Pending: 0, Completed: 0 };
    byStatusRaw.forEach(({ status, _count }) => {
      byStatus[status] = _count._all;
    });

    const byPriority = { High: 0, Medium: 0, Low: 0 };
    byPriorityRaw.forEach(({ priority, _count }) => {
      byPriority[priority] = _count._all;
    });

    const total = byStatus.Pending + byStatus.Completed;
    const completionRate =
      total > 0 ? Math.round((byStatus.Completed / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        byStatus,
        byPriority,
        total,
        completionRate,
        overdueCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks/bulk
 *
 * Applies a single action to multiple tasks at once.
 *
 * Body:
 *   taskIds  - string[]        - IDs of tasks to act on
 *   action   - 'complete' | 'delete'
 *
 * Only tasks owned by the authenticated user are affected.
 */
async function bulkAction(req, res, next) {
  try {
    const userId = req.user.userId;
    const { taskIds, action } = req.body;

    // Validate input
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'taskIds must be a non-empty array',
      });
    }

    const allowedActions = ['complete', 'delete'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `action must be one of: ${allowedActions.join(', ')}`,
      });
    }

    // Security: ensure all supplied IDs belong to the requesting user
    // by scoping the where clause with userId - Prisma will silently skip
    // IDs that don't match, so the count will reflect only owned tasks.
    const ownedWhere = { userId, id: { in: taskIds } };

    let affected;

    if (action === 'complete') {
      const result = await prisma.task.updateMany({
        where: ownedWhere,
        data: { status: 'Completed' },
      });
      affected = result.count;
    } else if (action === 'delete') {
      const result = await prisma.task.deleteMany({ where: ownedWhere });
      affected = result.count;
    }

    return res.status(200).json({
      success: true,
      message: 'Bulk action completed',
      data: { affected },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleStatus,
  getStats,
  bulkAction,
};

import React from 'react'
import { motion } from 'framer-motion'
import { format, isValid } from 'date-fns'
import { useTaskStore } from '../../store/taskStore'
import { toggleStatus } from '../../api/tasks'
import toast from 'react-hot-toast'

/**
 * Returns Tailwind border and text color classes for a given priority level.
 */
const PRIORITY_STYLES = {
  High: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  Medium: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  Low: {
    border: 'border-l-green-500',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
}

/**
 * Compute whether a task is overdue.
 * A task is overdue if it has a due date in the past and is not yet Completed.
 */
const isOverdue = (task) =>
  task.dueDate &&
  isValid(new Date(task.dueDate)) &&
  new Date(task.dueDate) < new Date() &&
  task.status !== 'Completed'

/**
 * TaskCard - renders a single task as a card.
 *
 * Props:
 *   task         - the task object
 *   onEdit       - callback(task) to open edit modal
 *   onDelete     - callback(task) to delete task
 *   isSelected   - whether the task is checked for bulk actions
 *   onSelect     - callback(id) to toggle selection
 *   isDragging   - optional: true when card is being dragged (used in Kanban)
 */
function TaskCard({ task, onEdit, onDelete, isSelected, onSelect, isDragging = false }) {
  const { optimisticToggleStatus, rollbackTasks } = useTaskStore()

  const taskId = task._id || task.id
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Low
  const overdue = isOverdue(task)

  /** Toggle status with optimistic update and rollback on error */
  const handleToggleStatus = async (e) => {
    e.stopPropagation()
    const previousTasks = useTaskStore.getState().tasks
    optimisticToggleStatus(taskId)
    try {
      await toggleStatus(taskId)
    } catch {
      rollbackTasks(previousTasks)
      toast.error('Failed to update status')
    }
  }

  /** Format due date for display */
  const formatDue = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (!isValid(d)) return null
    return format(d, 'MMM d, yyyy')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.6 : 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`
        relative bg-white dark:bg-gray-900 rounded-xl border border-l-4
        ${priorityStyle.border}
        border-gray-200 dark:border-gray-800
        shadow-sm hover:shadow-md
        transition-shadow duration-200
        ${isDragging ? 'shadow-lg ring-2 ring-indigo-400' : ''}
        ${isSelected ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}
      `}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <div className="p-4">
        {/* ── Top row: checkbox + title + status toggle ── */}
        <div className="flex items-start gap-3">
          {/* Bulk select checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(taskId)}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 cursor-pointer"
            aria-label={`Select task: ${task.title}`}
          />

          {/* Task title - animated strike-through when completed */}
          <div className="flex-1 min-w-0">
            <motion.span
              animate={{
                textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                opacity: task.status === 'Completed' ? 0.6 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug block"
            >
              {task.title}
            </motion.span>

            {/* Description preview */}
            {task.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Quick complete toggle */}
          <button
            onClick={handleToggleStatus}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              task.status === 'Completed'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'
            }`}
            aria-label={task.status === 'Completed' ? 'Mark as pending' : 'Mark as completed'}
            title={task.status === 'Completed' ? 'Mark as pending' : 'Mark as completed'}
          >
            {task.status === 'Completed' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Middle row: badges ── */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 ml-7">
          {/* Priority badge */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyle.badge}`}>
            {task.priority}
          </span>

          {/* Status badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              task.status === 'Completed'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {task.status}
          </span>

          {/* OVERDUE badge */}
          {overdue && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              OVERDUE
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDue(task.dueDate)}
            </span>
          )}
        </div>

        {/* ── Tags row ── */}
        {Array.isArray(task.tags) && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 ml-7">
            {task.tags.map((tag) => {
              const tagId = typeof tag === 'object' ? tag._id || tag.id : tag
              const tagName = typeof tag === 'object' ? tag.name : tag
              const tagColor = typeof tag === 'object' ? tag.color : '#6366f1'
              return (
                <span
                  key={tagId}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${tagColor}20`,
                    color: tagColor,
                    border: `1px solid ${tagColor}40`,
                  }}
                >
                  {tagName}
                </span>
              )
            })}
          </div>
        )}

        {/* ── Bottom row: action buttons ── */}
        <div className="flex items-center justify-end gap-1 mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800">
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(task)
            }}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            aria-label={`Edit task: ${task.title}`}
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(task)
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            aria-label={`Delete task: ${task.title}`}
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default TaskCard

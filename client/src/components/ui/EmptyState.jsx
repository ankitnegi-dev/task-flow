import React from 'react'
import { motion } from 'framer-motion'

/**
 * EmptyState - shown in TaskList when no tasks match the current query.
 *
 * Props:
 *   hasFilters     - true: "no matches" copy; false: "get started" copy
 *   onClearFilters - callback to clear active filters (shown only when hasFilters)
 *   onAddTask      - optional callback to open the add task modal
 */
function EmptyState({ hasFilters = false, onClearFilters, onAddTask }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 text-center px-4"
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {hasFilters ? (
        // Filter / search empty state icon
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-9 h-9 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
          </svg>
        </div>
      ) : (
        // Clipboard "no tasks" icon
        <div className="w-16 h-16 mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
          <svg
            className="w-9 h-9 text-indigo-400 dark:text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
      )}

      {/* Heading */}
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
        {hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
      </h3>

      {/* Subtitle */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        {hasFilters
          ? 'Try adjusting or clearing your filters to see more tasks.'
          : 'Create your first task to get organized and stay on track.'}
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mt-5">
        {hasFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-lg transition-colors font-medium"
          >
            Clear filters
          </button>
        )}
        {!hasFilters && onAddTask && (
          <button
            onClick={onAddTask}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add your first task
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default EmptyState

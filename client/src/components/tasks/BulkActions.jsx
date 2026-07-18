import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import { bulkAction } from '../../api/tasks'

/**
 * BulkActions - a slide-down action bar shown when tasks are selected.
 *
 * Props:
 *   onSuccess - called after a successful bulk operation so the parent can refetch
 */
function BulkActions({ onSuccess }) {
  const { selectedTaskIds, clearSelection } = useTaskStore()
  const [isLoading, setIsLoading] = useState(false)

  const count = selectedTaskIds.length

  /** Execute a bulk action and handle UI feedback */
  const execute = async (action) => {
    if (isLoading || count === 0) return

    if (action === 'delete') {
      const confirmed = window.confirm(
        `Delete ${count} selected task${count !== 1 ? 's' : ''}? This cannot be undone.`
      )
      if (!confirmed) return
    }

    setIsLoading(true)
    try {
      await bulkAction({ taskIds: selectedTaskIds, action })
      const verb = action === 'complete' ? 'marked as complete' : 'deleted'
      toast.success(`${count} task${count !== 1 ? 's' : ''} ${verb}`)
      clearSelection()
      onSuccess?.()
    } catch (err) {
      const message = err.response?.data?.message || `Bulk ${action} failed`
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 flex-wrap px-4 py-2.5 mb-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
      role="toolbar"
      aria-label="Bulk actions for selected tasks"
    >
      {/* Selected count */}
      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mr-2">
        {count} task{count !== 1 ? 's' : ''} selected
      </span>

      {/* Mark complete button */}
      <button
        onClick={() => execute('complete')}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-medium rounded-lg transition-colors"
        aria-label={`Mark ${count} tasks as complete`}
      >
        {isLoading ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        Mark Complete
      </button>

      {/* Delete button */}
      <button
        onClick={() => execute('delete')}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium rounded-lg transition-colors"
        aria-label={`Delete ${count} selected tasks`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Deselect all */}
      <button
        onClick={clearSelection}
        disabled={isLoading}
        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-label="Deselect all tasks"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Deselect all
      </button>
    </motion.div>
  )
}

export default BulkActions

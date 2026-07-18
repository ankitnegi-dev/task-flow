import React, { useState, useEffect, useCallback } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTaskStore } from '../../store/taskStore'
import { exportTasksToCSV } from '../../api/tasks'
import toast from 'react-hot-toast'

/**
 * CommandPalette - keyboard-driven command palette (Cmd/Ctrl+K).
 *
 * Props:
 *   onAddTask - opens the add task modal
 *   tasks     - current tasks array (used for CSV export)
 *   refetch   - refetches task list after filter changes
 *   onSelectTask - handles task selection
 */
function CommandPalette({ onAddTask, tasks, refetch, onSelectTask }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { setFilters } = useTaskStore()

  // Register the Cmd/Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const run = useCallback(
    (fn) => {
      fn()
      close()
    },
    [close]
  )

  const handleExportCSV = () => {
    if (!tasks || tasks.length === 0) {
      toast.error('No tasks to export')
      return
    }
    exportTasksToCSV(tasks)
    toast.success(`Exported ${tasks.length} task${tasks.length !== 1 ? 's' : ''} to CSV`)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            onClick={close}
            aria-hidden="true"
          />

          {/* Palette container */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <Command
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              label="Command palette"
            >
              {/* Search input */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
                <Command.Input
                  autoFocus
                  placeholder="Type a command…"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                />
                <kbd className="hidden sm:flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                  Esc
                </kbd>
              </div>

              {/* Command list */}
              <Command.List className="max-h-80 overflow-y-auto py-2">
                <Command.Empty className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  No commands found
                </Command.Empty>

                {/* Actions group */}
                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400 dark:[&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  <Command.Item
                    onSelect={() => run(onAddTask)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    <span className="flex-1">Add Task</span>
                    <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">N</kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => run(handleExportCSV)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </span>
                    <span className="flex-1">Export to CSV</span>
                  </Command.Item>
                </Command.Group>

                {/* Navigate group */}
                <Command.Group
                  heading="Navigate"
                  className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400 dark:[&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  <Command.Item
                    onSelect={() => run(() => navigate('/dashboard'))}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </span>
                    Go to Dashboard
                  </Command.Item>
                </Command.Group>

                {/* Filters group */}
                <Command.Group
                  heading="Filters"
                  className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400 dark:[&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  <Command.Item
                    onSelect={() => run(() => { setFilters({ priority: 'High' }); refetch?.() })}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                    </span>
                    Filter: High Priority
                  </Command.Item>

                  <Command.Item
                    onSelect={() => run(() => { setFilters({ status: 'Completed' }); refetch?.() })}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Show Completed
                  </Command.Item>

                  <Command.Item
                    onSelect={() => run(() => { setFilters({ status: 'Pending' }); refetch?.() })}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Show Pending
                  </Command.Item>

                  <Command.Item
                    onSelect={() => run(() => { setFilters({ status: '', priority: '', search: '', tagIds: [] }); refetch?.() })}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    Clear All Filters
                  </Command.Item>
                </Command.Group>
                {/* Tasks group - searchable by title via cmdk's built-in fuzzy matching */}
                {tasks && tasks.length > 0 && (
                <Command.Group
                  heading="Tasks"
                  className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400 dark:[&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  {tasks.slice(0, 8).map((task) => {
                    const id = task._id || task.id
                    return (
                      <Command.Item
                        key={id}
                        value={task.title}
                        onSelect={() => run(() => onSelectTask?.(task))}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            task.priority === 'High'
                              ? 'bg-red-500'
                              : task.priority === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="flex-1 truncate">{task.title}</span>
                        {task.status === 'Completed' && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                            Done
                          </span>
                        )}
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              )}
              </Command.List>

              {/* Footer hint */}
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-100 dark:bg-gray-800 rounded px-1 font-mono">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-100 dark:bg-gray-800 rounded px-1 font-mono">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-100 dark:bg-gray-800 rounded px-1 font-mono">Esc</kbd>
                  close
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette

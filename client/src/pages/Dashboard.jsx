import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/layout/Navbar'
import TaskList from '../components/tasks/TaskList'
import KanbanBoard from '../components/tasks/KanbanBoard'
import TaskModal from '../components/tasks/TaskModal'
import TaskFilters from '../components/tasks/TaskFilters'
import BulkActions from '../components/tasks/BulkActions'
import Analytics from '../components/analytics/Analytics'
import CommandPalette from '../components/ui/CommandPalette'
import SkeletonCard from '../components/ui/SkeletonCard'
import { useTaskStore } from '../store/taskStore'
import useTasks from '../hooks/useTasks'
import useDebounce from '../hooks/useDebounce'
import { deleteTask, getStats } from '../api/tasks'

/**
 * Main dashboard page.
 * Orchestrates the task list, filters, analytics, modals, and command palette.
 */
function Dashboard() {
  const {
    tasks,
    pagination,
    filters,
    viewMode,
    selectedTaskIds,
    setFilters,
    setPage,
    setViewMode,
    setStats,
    optimisticDeleteTask,
    rollbackTasks,
  } = useTaskStore()

  const { isLoading, error, refetch } = useTasks()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // Search input - debounced before being set as filter
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const debouncedSearch = useDebounce(searchInput, 400)

  // Propagate debounced search to store
  useEffect(() => {
    setFilters({ search: debouncedSearch })
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch stats on mount and after task mutations
  const fetchStats = useCallback(async () => {
  try {
    const res = await getStats()
    const raw = res.data
    setStats({
      total: raw.total ?? 0,
      completed: raw.byStatus?.Completed ?? 0,
      pending: raw.byStatus?.Pending ?? 0,
      overdue: raw.overdueCount ?? 0,
      byPriority: raw.byPriority ?? { High: 0, Medium: 0, Low: 0 },
      completionRate: raw.completionRate ?? 0,
    })
  } catch {
    // Non-critical - analytics panel will show zeros
  }
}, [setStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // --- Modal helpers ---
  const openAddModal = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
  }

  const handleModalSuccess = () => {
    closeModal()
    refetch()
    fetchStats()
  }

  // --- Delete handler with confirmation ---
  const handleDelete = async (task) => {
    const id = task._id || task.id
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return

    const previousTasks = useTaskStore.getState().tasks
    optimisticDeleteTask(id)

    try {
      await deleteTask(id)
      toast.success('Task deleted')
      fetchStats()
    } catch {
      rollbackTasks(previousTasks)
      toast.error('Failed to delete task')
    }
  }

  // After bulk actions complete - refetch to sync
  const handleBulkSuccess = () => {
    refetch()
    fetchStats()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar onSearch={setSearchInput} searchValue={searchInput} />

      {/* Command palette - triggered via Cmd/Ctrl+K */}
      <CommandPalette onAddTask={openAddModal} tasks={tasks} refetch={refetch} onSelectTask={openEditModal} />

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">
            {/* Page title */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pagination.totalTasks ?? 0} task{pagination.totalTasks !== 1 ? 's' : ''}
                </p>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  {/* List icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  aria-label="Kanban view"
                  title="Kanban view"
                >
                  {/* Columns icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <TaskFilters />

            {/* Bulk actions bar */}
            <AnimatePresence>
              {selectedTaskIds.length > 0 && (
                <BulkActions onSuccess={handleBulkSuccess} />
              )}
            </AnimatePresence>

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={refetch} className="ml-2 underline hover:no-underline">Retry</button>
              </div>
            )}

            {/* Task content - skeleton, kanban, or list */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ) : (
              <TaskList
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            )}

            {/* Pagination */}
            {!isLoading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Previous
                </button>

                {/* Page number buttons */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPage(page)}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                      page === pagination.currentPage
                        ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setPage(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </main>

          {/* ── Sidebar analytics (md+ only) ── */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Analytics onRefresh={fetchStats} />
          </aside>
        </div>
      </div>

      {/* Floating action button - Add Task */}
      <motion.button
        onClick={openAddModal}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 z-40"
        aria-label="Add new task"
        title="Add new task (or press Ctrl+K)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>

      {/* Task add/edit modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        task={editingTask}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default Dashboard

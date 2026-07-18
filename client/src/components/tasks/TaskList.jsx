import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTaskStore } from '../../store/taskStore'
import TaskCard from './TaskCard'
import EmptyState from '../ui/EmptyState'

/**
 * TaskList - renders the list view of tasks.
 *
 * Uses AnimatePresence so cards animate out when removed.
 *
 * Props:
 *   onEdit   - callback(task) to open edit modal
 *   onDelete - callback(task) to handle deletion
 */
function TaskList({ onEdit, onDelete }) {
  const tasks = useTaskStore((state) => state.tasks)
  const filters = useTaskStore((state) => state.filters)
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds)
  const toggleSelectTask = useTaskStore((state) => state.toggleSelectTask)

  // Determine whether any filter is active (to customize the empty state message)
  const hasActiveFilters =
    filters.status || filters.priority || filters.search || (filters.tagIds?.length > 0)

  if (tasks.length === 0) {
    return (
      <EmptyState
        hasFilters={!!hasActiveFilters}
        onClearFilters={hasActiveFilters ? () => useTaskStore.getState().setFilters({ status: '', priority: '', search: '', tagIds: [] }) : undefined}
      />
    )
  }

  return (
    <div className="space-y-3" role="list" aria-label="Task list">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <div key={task._id || task.id} role="listitem">
            <TaskCard
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              isSelected={selectedTaskIds.includes(task._id || task.id)}
              onSelect={toggleSelectTask}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default TaskList

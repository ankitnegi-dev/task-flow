import React, { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '../../store/taskStore'
import TaskCard from './TaskCard'
import { toggleStatus } from '../../api/tasks'
import toast from 'react-hot-toast'
import EmptyState from '../ui/EmptyState'
import { useState } from 'react'

/**
 * SortableTaskCard - wraps TaskCard with dnd-kit sortable behaviour.
 */
function SortableTaskCard({ task, onEdit, onDelete, isSelected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id || task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        isSelected={isSelected}
        onSelect={onSelect}
        isDragging={isDragging}
      />
    </div>
  )
}

/**
 * KanbanColumn - a droppable column containing sortable task cards.
 */
function KanbanColumn({ id, title, tasks, badgeColor, onEdit, onDelete, selectedTaskIds, onSelect, isOver }) {
  const taskIds = tasks.map((t) => t._id || t.id)

  return (
    <div
      className={`flex-1 min-w-0 rounded-xl border transition-colors duration-150 ${
        isOver
          ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
          : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
      }`}
      data-column-id={id}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${badgeColor}`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Scrollable task list */}
      <div className="p-3 space-y-2.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '120px' }}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-xs">Drop tasks here</p>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task._id || task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                isSelected={selectedTaskIds.includes(task._id || task.id)}
                onSelect={onSelect}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

/**
 * KanbanBoard - drag-and-drop board with two columns: Pending and Completed.
 *
 * Dragging a card to the opposite column calls toggleStatus (optimistic update).
 *
 * Props:
 *   onEdit   - callback(task) to open edit modal
 *   onDelete - callback(task) to handle deletion
 */
function KanbanBoard({ onEdit, onDelete }) {
  const { tasks, selectedTaskIds, toggleSelectTask, optimisticToggleStatus, rollbackTasks } = useTaskStore()
  const [activeId, setActiveId] = useState(null)
  const [overColumn, setOverColumn] = useState(null)

  // Split tasks into two columns
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === 'Pending'), [tasks])
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'Completed'), [tasks])

  const allIds = tasks.map((t) => t._id || t.id)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /** Find which column a task belongs to */
  const getColumn = (taskId) => {
    const task = tasks.find((t) => (t._id || t.id) === taskId)
    return task?.status === 'Completed' ? 'Completed' : 'Pending'
  }

  const handleDragStart = ({ active }) => {
    setActiveId(active.id)
  }

  const handleDragOver = ({ over }) => {
    if (!over) {
      setOverColumn(null)
      return
    }
    // Determine if dragging over the opposite column's header or an item in it
    const overId = over.id
    const overTask = tasks.find((t) => (t._id || t.id) === overId)
    if (overTask) {
      setOverColumn(overTask.status === 'Completed' ? 'Completed' : 'Pending')
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    setOverColumn(null)

    if (!over) return

    const activeTaskId = active.id
    const overTaskId = over.id

    const sourceColumn = getColumn(activeTaskId)
    const destinationColumn = getColumn(overTaskId)

    // Only act if dropped into a different column
    if (sourceColumn === destinationColumn) return

    const previousTasks = useTaskStore.getState().tasks
    optimisticToggleStatus(activeTaskId)

    try {
      await toggleStatus(activeTaskId)
      toast.success(destinationColumn === 'Completed' ? 'Task completed!' : 'Task set to pending')
    } catch {
      rollbackTasks(previousTasks)
      toast.error('Failed to update task status')
    }
  }

  // Find the active task for the drag overlay
  const activeTask = activeId ? tasks.find((t) => (t._id || t.id) === activeId) : null

  if (tasks.length === 0) {
    return <EmptyState hasFilters={false} />
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        <KanbanColumn
          id="Pending"
          title="Pending"
          tasks={pendingTasks}
          badgeColor="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          onEdit={onEdit}
          onDelete={onDelete}
          selectedTaskIds={selectedTaskIds}
          onSelect={toggleSelectTask}
          isOver={overColumn === 'Pending' && activeTask?.status === 'Completed'}
        />
        <KanbanColumn
          id="Completed"
          title="Completed"
          tasks={completedTasks}
          badgeColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          onEdit={onEdit}
          onDelete={onDelete}
          selectedTaskIds={selectedTaskIds}
          onSelect={toggleSelectTask}
          isOver={overColumn === 'Completed' && activeTask?.status === 'Pending'}
        />
      </div>

      {/* Drag overlay - shows a "ghost" card while dragging */}
      <DragOverlay>
        {activeTask && (
          <div className="opacity-90 rotate-1 pointer-events-none">
            <TaskCard
              task={activeTask}
              isDragging={true}
              isSelected={false}
              onSelect={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default KanbanBoard

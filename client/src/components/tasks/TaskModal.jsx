import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { createTask, updateTask } from '../../api/tasks'
import { getTags, createTag } from '../../api/tags'
import { useTaskStore } from '../../store/taskStore'
import { format } from 'date-fns'

/** Preset color options for quick new-tag creation */
const TAG_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6']

/**
 * TaskModal - add or edit a task.
 *
 * Props:
 *   isOpen    - controls visibility
 *   onClose   - called when user dismisses the modal
 *   task      - null = add mode, task object = edit mode
 *   onSuccess - called after a successful API operation
 */
function TaskModal({ isOpen, onClose, task, onSuccess }) {
  const { optimisticUpdateTask, rollbackTasks } = useTaskStore()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Pending',
    tagIds: [],
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tags
  const [availableTags, setAvailableTags] = useState([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [showNewTagForm, setShowNewTagForm] = useState(false)
  const [isCreatingTag, setIsCreatingTag] = useState(false)

  const titleRef = useRef(null)
  const isEdit = !!task

  // Populate form when task changes (edit mode) or reset (add mode)
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
          priority: task.priority || 'Medium',
          status: task.status || 'Pending',
          tagIds: (task.tags || []).map((t) => (typeof t === 'object' ? t._id || t.id : t)),
        })
      } else {
        setFormData({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'Pending', tagIds: [] })
      }
      setFieldErrors({})
    }
  }, [isOpen, task])

  // Fetch available tags when modal opens
  useEffect(() => {
    if (!isOpen) return
    setTagsLoading(true)
    getTags()
      .then((res) => setAvailableTags(res.data.tags || res.data || []))
      .catch(() => setAvailableTags([]))
      .finally(() => setTagsLoading(false))
  }, [isOpen])

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  /** Toggle a tag in the selected tagIds list */
  const toggleTag = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  /** Create a new tag inline */
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    setIsCreatingTag(true)
    try {
      const res = await createTag({ name: newTagName.trim(), color: newTagColor })
      const created = res.data.tag || res.data
      setAvailableTags((prev) => [...prev, created])
      setFormData((prev) => ({ ...prev, tagIds: [...prev.tagIds, created._id || created.id] }))
      setNewTagName('')
      setShowNewTagForm(false)
      toast.success(`Tag "${created.name}" created`)
    } catch {
      toast.error('Failed to create tag')
    } finally {
      setIsCreatingTag(false)
    }
  }

  const validate = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: formData.dueDate || null,
      priority: formData.priority,
      status: formData.status,
      tagIds: formData.tagIds,
    }

    try {
      if (isEdit) {
        const taskId = task._id || task.id
        const previousTasks = useTaskStore.getState().tasks
        // Optimistic update
        optimisticUpdateTask(taskId, { ...payload, tags: availableTags.filter((t) => payload.tagIds.includes(t._id || t.id)) })
        try {
          await updateTask(taskId, payload)
          toast.success('Task updated')
          onSuccess?.()
        } catch (err) {
          rollbackTasks(previousTasks)
          throw err
        }
      } else {
        await createTask(payload)
        toast.success('Task created')
        onSuccess?.()
      }
    } catch (err) {
      const message = err.response?.data?.message || (isEdit ? 'Failed to update task' : 'Failed to create task')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-label={isEdit ? 'Edit task' : 'Add new task'}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEdit ? 'Edit Task' : 'Add New Task'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="task-title"
                    ref={titleRef}
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="What needs to be done?"
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      fieldErrors.title ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-700'
                    }`}
                    aria-invalid={!!fieldErrors.title}
                    aria-required="true"
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="task-description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add more details…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-colors"
                  />
                </div>

                {/* Due Date + Priority row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="task-due" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      id="task-due"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    id="task-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                    <button
                      type="button"
                      onClick={() => setShowNewTagForm((v) => !v)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                    >
                      {showNewTagForm ? 'Cancel' : '+ New tag'}
                    </button>
                  </div>

                  {/* New tag form */}
                  <AnimatePresence>
                    {showNewTagForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="Tag name"
                            className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreateTag()
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleCreateTag}
                            disabled={isCreatingTag || !newTagName.trim()}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                          >
                            {isCreatingTag ? '…' : 'Add'}
                          </button>
                        </div>
                        {/* Color swatches */}
                        <div className="flex gap-1.5 flex-wrap">
                          {TAG_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewTagColor(c)}
                              className={`w-5 h-5 rounded-full transition-transform ${newTagColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                              style={{ backgroundColor: c }}
                              aria-label={`Tag color ${c}`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Existing tags */}
                  {tagsLoading ? (
                    <p className="text-xs text-gray-400">Loading tags…</p>
                  ) : availableTags.length === 0 ? (
                    <p className="text-xs text-gray-400">No tags yet. Create one above.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((tag) => {
                        const tagId = tag._id || tag.id
                        const selected = formData.tagIds.includes(tagId)
                        return (
                          <button
                            key={tagId}
                            type="button"
                            onClick={() => toggleTag(tagId)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              selected ? 'opacity-100 shadow-sm' : 'opacity-60 hover:opacity-80'
                            }`}
                            style={{
                              backgroundColor: selected ? `${tag.color}25` : 'transparent',
                              color: tag.color,
                              borderColor: `${tag.color}60`,
                            }}
                          >
                            {selected && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {isEdit ? 'Saving…' : 'Creating…'}
                      </>
                    ) : (
                      isEdit ? 'Save changes' : 'Create task'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default TaskModal

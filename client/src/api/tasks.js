import api from './axios'
import { format } from 'date-fns'

/**
 * Tasks API functions.
 */

/**
 * Fetch paginated, filtered, sorted tasks.
 * @param {{ status?: string, priority?: string, search?: string, page?: number, limit?: number, sort?: string, tagIds?: string[] }} params
 */
export const getTasks = (params = {}) => {
  // Flatten tagIds array into a comma-separated string for query param
  const queryParams = { ...params }
  if (Array.isArray(queryParams.tagIds) && queryParams.tagIds.length > 0) {
    queryParams.tagIds = queryParams.tagIds.join(',')
  } else if (Array.isArray(queryParams.tagIds)) {
    delete queryParams.tagIds
  }
  // Remove empty string filters to keep the URL clean
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] === '' || queryParams[key] === undefined || queryParams[key] === null) {
      delete queryParams[key]
    }
  })
  return api.get('/tasks', { params: queryParams })
}

/**
 * Create a new task.
 * @param {{ title: string, description?: string, dueDate?: string, priority?: string, status?: string, tagIds?: string[] }} data
 */
export const createTask = (data) => api.post('/tasks', data)

/**
 * Update an existing task by ID.
 * @param {string} id
 * @param {Partial<Task>} data
 */
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)

/**
 * Delete a task by ID.
 * @param {string} id
 */
export const deleteTask = (id) => api.delete(`/tasks/${id}`)

/**
 * Toggle a task's status between Pending and Completed.
 * @param {string} id
 */
export const toggleStatus = (id) => api.patch(`/tasks/${id}/status`)

/**
 * Fetch aggregated stats for the analytics panel.
 * Returns totals, completion rate, overdue count, tasks by priority, etc.
 */
export const getStats = () => api.get('/tasks/stats')

/**
 * Perform a bulk action on multiple tasks.
 * @param {{ taskIds: string[], action: 'complete' | 'delete' }} data
 */
export const bulkAction = (data) => api.post('/tasks/bulk', data)

/**
 * Client-side CSV export.
 * Converts the provided tasks array to a CSV file and triggers a browser download.
 * @param {Array<Object>} tasks - Task objects to export
 */
export const exportTasksToCSV = (tasks) => {
  const headers = ['ID', 'Title', 'Description', 'Priority', 'Status', 'DueDate', 'Tags', 'CreatedAt']

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = tasks.map((task) => [
    escapeCSV(task._id || task.id || ''),
    escapeCSV(task.title || ''),
    escapeCSV(task.description || ''),
    escapeCSV(task.priority || ''),
    escapeCSV(task.status || ''),
    escapeCSV(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''),
    escapeCSV(
      Array.isArray(task.tags)
        ? task.tags.map((t) => (typeof t === 'object' ? t.name : t)).join('; ')
        : ''
    ),
    escapeCSV(task.createdAt ? format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm:ss') : ''),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  link.href = url
  link.setAttribute('download', `taskflow-export-${dateStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

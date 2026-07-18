import api from './axios'

/**
 * Tags API functions.
 * Tags are used to categorize tasks; each tag has a name and a hex color.
 */

/**
 * Fetch all tags belonging to the authenticated user.
 */
export const getTags = () => api.get('/tags')

/**
 * Create a new tag.
 * @param {{ name: string, color: string }} data - name and hex color (e.g., '#6366f1')
 */
export const createTag = (data) => api.post('/tags', data)

/**
 * Delete a tag by ID.
 * Associated tasks will have this tag removed automatically (server-side).
 * @param {string} id
 */
export const deleteTag = (id) => api.delete(`/tags/${id}`)

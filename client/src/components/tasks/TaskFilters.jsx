import React, { useState, useEffect, useRef } from 'react'
import { useTaskStore } from '../../store/taskStore'
import { getTags } from '../../api/tags'

/** Priority chip option config */
const PRIORITY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'High', value: 'High', className: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  { label: 'Medium', value: 'Medium', className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { label: 'Low', value: 'Low', className: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
]

/** Status chip option config */
const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Completed', value: 'Completed' },
]

/** Sort options */
const SORT_OPTIONS = [
  { label: 'Newest first', value: 'createdAt_desc' },
  { label: 'Oldest first', value: 'createdAt_asc' },
  { label: 'Due date ↑', value: 'dueDate_asc' },
  { label: 'Due date ↓', value: 'dueDate_desc' },
  { label: 'Priority: High → Low', value: 'priority_desc' },
  { label: 'Priority: Low → High', value: 'priority_asc' },
]

/**
 * FilterChip - a pill button for filter selection.
 */
function FilterChip({ label, isActive, onClick, activeClassName, defaultClassName }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
        isActive
          ? activeClassName || 'bg-indigo-600 border-indigo-600 text-white'
          : defaultClassName || 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * TaskFilters - filter bar component.
 * Manages priority, status, tag, and sort filters; all sync to the task store.
 */
function TaskFilters() {
  const { filters, setFilters } = useTaskStore()
  const [tags, setTags] = useState([])
  const [tagsOpen, setTagsOpen] = useState(false)
  const tagDropdownRef = useRef(null)

  // Fetch tags for the tag filter dropdown
  useEffect(() => {
    getTags()
      .then((res) => setTags(res.data.tags || res.data || []))
      .catch(() => setTags([]))
  }, [])

  // Close tag dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setTagsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasActiveFilters =
    filters.status || filters.priority || (filters.tagIds?.length > 0)

  const clearFilters = () => {
    setFilters({ status: '', priority: '', tagIds: [] })
  }

  const toggleTagFilter = (tagId) => {
    const current = filters.tagIds || []
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId]
    setFilters({ tagIds: updated })
  }

  return (
    <div className="mb-4 space-y-2.5">
      {/* Row 1: priority + status chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Priority filters */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Filter by priority">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-0.5">Priority:</span>
          {PRIORITY_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value || 'all-priority'}
              label={opt.label}
              isActive={filters.priority === opt.value}
              onClick={() => setFilters({ priority: opt.value })}
              activeClassName={opt.value ? opt.className + ' font-semibold' : 'bg-indigo-600 border-indigo-600 text-white'}
            />
          ))}
        </div>

        {/* Separator */}
        <span className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-700" />

        {/* Status filters */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Filter by status">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-0.5">Status:</span>
          {STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value || 'all-status'}
              label={opt.label}
              isActive={filters.status === opt.value}
              onClick={() => setFilters({ status: opt.value })}
            />
          ))}
        </div>
      </div>

      {/* Row 2: tag filter + sort + clear */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tag filter dropdown */}
        {tags.length > 0 && (
          <div className="relative" ref={tagDropdownRef}>
            <button
              onClick={() => setTagsOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                (filters.tagIds?.length ?? 0) > 0
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
              aria-haspopup="listbox"
              aria-expanded={tagsOpen}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Tags
              {(filters.tagIds?.length ?? 0) > 0 && (
                <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {filters.tagIds.length}
                </span>
              )}
              <svg className={`w-3 h-3 transition-transform ${tagsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tagsOpen && (
              <div
                className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 min-w-[180px] py-1.5"
                role="listbox"
                aria-multiselectable="true"
              >
                {tags.map((tag) => {
                  const tagId = tag._id || tag.id
                  const selected = (filters.tagIds || []).includes(tagId)
                  return (
                    <button
                      key={tagId}
                      onClick={() => toggleTagFilter(tagId)}
                      role="option"
                      aria-selected={selected}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-gray-700 dark:text-gray-300 flex-1 text-left">{tag.name}</span>
                      {selected && (
                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="sort-select" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Sort:
          </label>
          <select
            id="sort-select"
            value={filters.sort}
            onChange={(e) => setFilters({ sort: e.target.value })}
            className="text-xs px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export default TaskFilters

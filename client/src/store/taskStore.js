import { create } from 'zustand'

/**
 * Task management store.
 * Holds all task data, filter state, selection state, and view mode.
 * Supports optimistic updates with rollback capability.
 *
 * NOT persisted to localStorage - tasks are always fetched fresh from the API.
 */
export const useTaskStore = create((set, get) => ({
  // --- State ---

  /** Array of task objects from the most recent API fetch */
  tasks: [],

  /** Pagination metadata returned by the API */
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  /** Current filter/sort/pagination settings */
  filters: {
    status: '',
    priority: '',
    search: '',
    sort: 'createdAt_desc',
    page: 1,
    limit: 10,
    tagIds: [],
  },

  /** True while the tasks API call is in flight */
  isLoading: false,

  /** Aggregated stats from /api/tasks/stats */
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    byPriority: { High: 0, Medium: 0, Low: 0 },
    completionRate: 0,
  },

  /** IDs of tasks currently selected for bulk actions */
  selectedTaskIds: [],

  /** 'list' | 'kanban' */
  viewMode: 'list',

  // --- Actions ---

  /**
   * Replace the tasks array and pagination metadata after a successful fetch.
   * @param {Array} tasks
   * @param {Object} pagination
   */
  setTasks: (tasks, pagination) =>
    set({ tasks, pagination: pagination || get().pagination }),

  /**
   * Update filters and reset to page 1 so results are always fresh.
   * Partial update - only the provided keys are changed.
   * @param {Partial<filters>} filters
   */
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters, page: 1 },
      // Clear selection when filters change
      selectedTaskIds: [],
    })),

  /**
   * Navigate to a specific page without changing other filters.
   * @param {number} page
   */
  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),

  /**
   * Set the loading flag.
   * @param {boolean} isLoading
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Store aggregated stats from /api/tasks/stats.
   * @param {Object} stats
   */
  setStats: (stats) => set({ stats }),

  /**
   * Switch between list and kanban view.
   * @param {'list'|'kanban'} mode
   */
  setViewMode: (mode) => set({ viewMode: mode }),

  // --- Selection actions ---

  /**
   * Toggle a single task's selection state.
   * @param {string} id
   */
  toggleSelectTask: (id) =>
    set((state) => ({
      selectedTaskIds: state.selectedTaskIds.includes(id)
        ? state.selectedTaskIds.filter((tid) => tid !== id)
        : [...state.selectedTaskIds, id],
    })),

  /**
   * Select all currently loaded tasks.
   */
  selectAllTasks: () =>
    set((state) => ({
      selectedTaskIds: state.tasks.map((t) => t._id || t.id),
    })),

  /**
   * Deselect all tasks.
   */
  clearSelection: () => set({ selectedTaskIds: [] }),

  // --- Optimistic update actions ---

  /**
   * Immediately apply updates to a task in the store (before API call resolves).
   * Call rollbackTasks() if the API call subsequently fails.
   * @param {string} id
   * @param {Partial<Task>} updates
   */
  optimisticUpdateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        (t._id || t.id) === id ? { ...t, ...updates } : t
      ),
    })),

  /**
   * Immediately remove a task from the store (before API call resolves).
   * @param {string} id
   */
  optimisticDeleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => (t._id || t.id) !== id),
      selectedTaskIds: state.selectedTaskIds.filter((tid) => tid !== id),
    })),

  /**
   * Restore tasks to a previous snapshot - used when an optimistic update fails.
   * @param {Array} previousTasks
   */
  rollbackTasks: (previousTasks) => set({ tasks: previousTasks }),

  /**
   * Toggle a task's status between 'Pending' and 'Completed' in the local store.
   * @param {string} id
   */
  optimisticToggleStatus: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if ((t._id || t.id) !== id) return t
        return {
          ...t,
          status: t.status === 'Completed' ? 'Pending' : 'Completed',
        }
      }),
    })),
}))

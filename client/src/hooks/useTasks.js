import { useState, useEffect, useCallback, useRef } from 'react'
import { useTaskStore } from '../store/taskStore'
import { getTasks } from '../api/tasks'

/**
 * useTasks - single source of truth for loading tasks from the API.
 *
 * Reads current filters from the task store, fetches matching tasks,
 * and populates the store with results. Automatically re-fetches
 * whenever filters change. Uses an AbortController to cancel in-flight
 * requests when the component unmounts or filters change before the
 * previous request completes.
 *
 * @returns {{ isLoading: boolean, error: string|null, refetch: function }}
 */
function useTasks() {
  const filters = useTaskStore((state) => state.filters)
  const setTasks = useTaskStore((state) => state.setTasks)
  const setLoading = useTaskStore((state) => state.setLoading)

  const [error, setError] = useState(null)
  // Keep a ref to the current abort controller so we can cancel inflight requests
  const abortControllerRef = useRef(null)

  /**
   * Perform the actual fetch. Wrapped in useCallback so the identity
   * is stable unless filters change, preventing infinite effect loops.
   */
  const fetchTasks = useCallback(
    async (signal) => {
      setLoading(true)
      setError(null)

      try {
        const response = await getTasks({ ...filters }, { signal })
        // Only update store if this request wasn't cancelled
        if (!signal?.aborted) {
          const { tasks, pagination } = response.data
          setTasks(tasks || [], pagination || {})
        }
      } catch (err) {
        // Ignore abort errors - they're expected on cleanup
        if (err.name === 'CanceledError' || err.name === 'AbortError') return
        const message = err.response?.data?.message || 'Failed to load tasks'
        setError(message)
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    // Re-create fetchTasks whenever any filter value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filters.status,
      filters.priority,
      filters.search,
      filters.sort,
      filters.page,
      filters.limit,
      // Stringify tagIds for stable comparison since arrays are reference-equal
      JSON.stringify(filters.tagIds),
    ]
  )

  // Auto-fetch on mount and whenever fetchTasks identity changes (i.e., filters change)
  useEffect(() => {
    // Cancel the previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create a new abort controller for this fetch
    const controller = new AbortController()
    abortControllerRef.current = controller

    fetchTasks(controller.signal)

    // Cleanup: abort the request if the component unmounts or effect re-runs
    return () => {
      controller.abort()
    }
  }, [fetchTasks])

  /**
   * Expose a stable refetch function that always uses the latest filters.
   * Components can call this after mutations (create, update, delete).
   */
  const refetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller
    fetchTasks(controller.signal)
  }, [fetchTasks])

  // Read isLoading directly from the store for consistency
  const isLoading = useTaskStore((state) => state.isLoading)

  return { isLoading, error, refetch }
}

export default useTasks

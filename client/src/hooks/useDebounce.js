import { useState, useEffect } from 'react'

/**
 * useDebounce - delays propagation of a rapidly-changing value.
 *
 * Typical usage: debounce a search input so the API isn't called
 * on every keystroke, only after the user pauses typing.
 *
 * @param {any} value  - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} The debounced value - only updates after `delay` ms of no changes
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 400)
 * useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // If value changes before the delay expires, cancel the previous timer
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce

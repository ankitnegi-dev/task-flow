import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Theme store.
 * Persists the user's dark/light mode preference to localStorage.
 * The toggleTheme action also updates the DOM class so Tailwind's
 * `dark:` variants take effect immediately.
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      // --- State ---

      /** true = dark mode, false = light mode */
      isDark: false,

      // --- Actions ---

      /**
       * Toggle between dark and light mode.
       * Updates both the store state and the document class list so
       * Tailwind's class-strategy dark mode responds immediately.
       */
      toggleTheme: () => {
        const next = !get().isDark
        if (next) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ isDark: next })
      },
    }),
    {
      name: 'taskflow-theme',
    }
  )
)

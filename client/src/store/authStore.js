import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Authentication store.
 * Persists user info and auth status to localStorage so the session
 * survives page refreshes. The isLoading flag is NOT persisted.
 *
 * Shape:
 *   user          - the authenticated user object (name, email, _id, etc.) or null
 *   isAuthenticated - true when a valid session exists
 *   isLoading     - true while an auth check is in flight
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // --- State ---
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // --- Actions ---

      /**
       * Store the user after a successful login or getMe() call.
       * @param {Object} user - User profile from the API
       */
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      /**
       * Clear user state after logout or auth failure.
       */
      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      /**
       * Set the loading flag - used during auth verification on route mount.
       * @param {boolean} isLoading
       */
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'taskflow-auth',
      // Only persist user and isAuthenticated - loading state is transient
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

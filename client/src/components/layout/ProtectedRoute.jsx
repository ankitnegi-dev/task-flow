import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getMe } from '../../api/auth'

/**
 * ProtectedRoute - guards pages that require authentication.
 *
 * On mount, calls GET /auth/me to verify the HTTP-only cookie is still valid.
 * If the server confirms the session, the user object is refreshed in the store.
 * If not authenticated (no local state or server rejects), redirect to /login.
 *
 * Shows a full-screen loading spinner while the check is in flight.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, setUser, clearUser } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    let cancelled = false

    const verifySession = async () => {
  try {
    const res = await getMe()
    if (!cancelled) {
      setUser(res.data)
      setVerified(true)
    }
  } catch {
    if (!cancelled) {
      clearUser()
      setVerified(false)
    }
  } finally {
    if (!cancelled) {
      setIsChecking(false)
    }
  }
}

    // Skip the network call if we already know the user isn't authenticated
    if (!isAuthenticated) {
      setIsChecking(false)
      setVerified(false)
      return
    }

    verifySession()

    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show spinner while verifying
  if (isChecking) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950"
        aria-label="Verifying authentication"
      >
        <svg
          className="w-10 h-10 text-indigo-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Verifying session…</p>
      </div>
    )
  }

  // Redirect unauthenticated users to login
  if (!verified && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

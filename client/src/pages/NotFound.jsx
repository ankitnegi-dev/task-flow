import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * NotFound page.
 * Shown for any route that doesn't match a known path.
 * Matches the visual language of Login/Register (centered card, indigo accent).
 */
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md text-center"
      >
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-3xl">⚡</span>
          <span className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-10">
          <p className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            404
          </p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Page not found
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or may have moved.
          </p>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFound
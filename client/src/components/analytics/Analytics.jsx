import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTaskStore } from '../../store/taskStore'
import DonutChart from './DonutChart'
import PriorityBarChart from './PriorityBarChart'

/**
 * Stat card - a small summary number tile.
 */
function StatCard({ label, value, color, icon }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

/**
 * Analytics - sidebar panel showing aggregated task statistics.
 *
 * On mobile (<lg), the content below the header is collapsible - tap the
 * header to expand/collapse. On desktop (lg+), it's always fully visible
 * and the toggle has no effect (hidden lg:block on the content wrapper).
 *
 * Props:
 *   onRefresh - callback to re-fetch stats from the server
 */
function Analytics({ onRefresh }) {
  const stats = useTaskStore((state) => state.stats)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  const total = stats.total ?? 0
  const completed = stats.completed ?? 0
  const pending = stats.pending ?? 0
  const overdue = stats.overdue ?? 0
  const byPriority = stats.byPriority ?? { High: 0, Medium: 0, Low: 0 }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-5"
      aria-label="Analytics panel"
    >
      {/* Header - clickable on mobile to expand/collapse; inert on desktop */}
      <button
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full flex items-center justify-between lg:pointer-events-none lg:cursor-default"
        aria-expanded={!isCollapsed}
        aria-controls="analytics-content"
      >
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Analytics</h2>
        <div className="flex items-center gap-1">
          <span
            onClick={(e) => {
              e.stopPropagation()
              handleRefresh()
            }}
            role="button"
            tabIndex={0}
            aria-label="Refresh analytics"
            title="Refresh statistics"
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors pointer-events-auto"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </span>

          {/* Chevron - mobile only, indicates expand/collapse */}
          <svg
            className={`w-4 h-4 text-gray-400 lg:hidden transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible content - hidden on mobile when collapsed, always visible on desktop */}
      <div
        id="analytics-content"
        className={isCollapsed ? 'hidden lg:block space-y-5' : 'block space-y-5'}
      >
        {/* Summary stat cards */}
        <div className="space-y-2">
          <StatCard
            label="Total tasks"
            value={total}
            color="bg-indigo-100 dark:bg-indigo-900/30"
            icon={
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label="Completed"
            value={completed}
            color="bg-emerald-100 dark:bg-emerald-900/30"
            icon={
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Overdue"
            value={overdue}
            color={overdue > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}
            icon={
              <svg
                className={`w-5 h-5 ${overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Completion donut */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Completion Rate
          </h3>
          <DonutChart pending={pending} completed={completed} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Priority breakdown bar chart */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            By Priority
          </h3>
          <PriorityBarChart byPriority={byPriority} />
        </div>
      </div>
    </motion.aside>
  )
}

export default Analytics
import React from 'react'

/**
 * SkeletonCard - animated placeholder matching TaskCard dimensions.
 * Shown in TaskList while the API is loading.
 *
 * Uses the custom `animate-skeleton` keyframe (opacity pulse) defined
 * in tailwind.config.js to signal loading state without layout shifts.
 */
function SkeletonCard() {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-l-4 border-gray-200 dark:border-gray-800 border-l-gray-200 dark:border-l-gray-700 p-4"
      aria-hidden="true"
      role="presentation"
    >
      {/* Top row: fake checkbox + title bar */}
      <div className="flex items-start gap-3">
        {/* Checkbox placeholder */}
        <div className="skeleton w-4 h-4 mt-0.5 rounded flex-shrink-0" />

        {/* Title bar - two lines to mimic a wrapped title */}
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>

        {/* Status toggle placeholder */}
        <div className="skeleton w-6 h-6 rounded-full flex-shrink-0" />
      </div>

      {/* Badge row */}
      <div className="flex items-center gap-2 mt-3 ml-7">
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full ml-2" />
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 mt-2 ml-7">
        <div className="skeleton h-5 w-12 rounded" />
        <div className="skeleton h-5 w-16 rounded" />
      </div>

      {/* Footer: edit + delete buttons */}
      <div className="flex items-center justify-end gap-1 mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800">
        <div className="skeleton w-7 h-7 rounded-lg" />
        <div className="skeleton w-7 h-7 rounded-lg" />
      </div>
    </div>
  )
}

export default SkeletonCard

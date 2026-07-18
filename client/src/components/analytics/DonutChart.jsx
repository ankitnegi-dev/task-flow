import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  Pending: '#6366f1',    // indigo
  Completed: '#10b981',  // emerald
}

/**
 * Custom center label rendered inside the donut hole.
 * Shows the completion percentage.
 */
const CenterLabel = ({ cx, cy, completionRate }) => (
  <>
    <text
      x={cx}
      y={cy - 6}
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-gray-900 dark:fill-gray-100"
      style={{ fontSize: 22, fontWeight: 700, fill: 'currentColor' }}
    >
      {completionRate}%
    </text>
    <text
      x={cx}
      y={cy + 14}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontSize: 11, fill: '#9ca3af' }}
    >
      Complete
    </text>
  </>
)

/**
 * Custom tooltip shown on slice hover.
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <span style={{ color: COLORS[name] }} className="font-semibold">{name}:</span>
      <span className="ml-1 text-gray-700 dark:text-gray-300">{value} task{value !== 1 ? 's' : ''}</span>
    </div>
  )
}

/**
 * DonutChart - shows Pending vs Completed task distribution.
 *
 * Props:
 *   pending   - number of pending tasks
 *   completed - number of completed tasks
 */
function DonutChart({ pending = 0, completed = 0 }) {
  const total = pending + completed
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const data = [
    { name: 'Pending', value: pending },
    { name: 'Completed', value: completed },
  ]

  // When there are no tasks show a placeholder ring
  const displayData = total === 0
    ? [{ name: 'No tasks', value: 1 }]
    : data

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={total > 0 ? 3 : 0}
            dataKey="value"
            strokeWidth={0}
            isAnimationActive
            animationBegin={0}
            animationDuration={700}
          >
            {total === 0 ? (
              <Cell fill="#e5e7eb" />
            ) : (
              data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))
            )}
          </Pie>

          {/* Center percentage label */}
          {total > 0 && (
            <text>
              <CenterLabel cx={200 / 2} cy={100} completionRate={completionRate} />
            </text>
          )}

          {total > 0 && <Tooltip content={<CustomTooltip />} />}

          {total > 0 && (
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center label workaround - recharts Pie label prop */}
      {total === 0 && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 -mt-4">No data yet</p>
      )}
    </div>
  )
}

export default DonutChart

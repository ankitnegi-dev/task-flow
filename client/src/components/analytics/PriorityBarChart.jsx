import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

/** Colors for each priority level */
const PRIORITY_COLORS = {
  High: '#ef4444',    // red
  Medium: '#f59e0b',  // amber
  Low: '#10b981',     // emerald
}

/**
 * Custom tooltip for the bar chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const color = PRIORITY_COLORS[label] || '#6366f1'
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <span style={{ color }} className="font-semibold">{label}:</span>
      <span className="ml-1 text-gray-700 dark:text-gray-300">{value} task{value !== 1 ? 's' : ''}</span>
    </div>
  )
}

/**
 * PriorityBarChart - bar chart showing task count by priority.
 *
 * Props:
 *   byPriority - object: { High: number, Medium: number, Low: number }
 */
function PriorityBarChart({ byPriority = {} }) {
  const data = [
    { priority: 'High', count: byPriority.High ?? 0 },
    { priority: 'Medium', count: byPriority.Medium ?? 0 },
    { priority: 'Low', count: byPriority.Low ?? 0 },
  ]

  // Compute integer y-axis ticks
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" vertical={false} />
        <XAxis
          dataKey="priority"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          domain={[0, maxCount + 1]}
          tickCount={Math.min(maxCount + 2, 6)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Bar
          dataKey="count"
          radius={[4, 4, 0, 0]}
          isAnimationActive
          animationBegin={0}
          animationDuration={700}
        >
          {data.map((entry) => (
            <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default PriorityBarChart

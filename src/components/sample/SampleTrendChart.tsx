import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import { historicalSampleData } from '@/data/mock'

const INDICATORS = [
  { key: '蛋白质', color: '#f97316' },
  { key: '水分', color: '#3b82f6' },
  { key: '灰分', color: '#8b5cf6' },
  { key: '粗脂肪', color: '#22c55e' },
] as const

interface SampleTrendChartProps {
  indicator?: string
}

export default function SampleTrendChart({ indicator }: SampleTrendChartProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
    if (indicator) return new Set([indicator])
    return new Set(INDICATORS.map((i) => i.key))
  })

  const toggleKey = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {INDICATORS.map(({ key, color }) => (
          <button
            key={key}
            onClick={() => toggleKey(key)}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium transition-colors border',
              visibleKeys.has(key)
                ? 'text-white border-transparent'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            )}
            style={visibleKeys.has(key) ? { backgroundColor: color } : undefined}
          >
            {key}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={historicalSampleData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            itemStyle={{ padding: '2px 0' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconType="circle"
            iconSize={8}
          />
          {visibleKeys.has('蛋白质') && (
            <ReferenceLine y={17} stroke="#f97316" strokeDasharray="4 4" label={{ value: '标准线', position: 'right', fontSize: 10, fill: '#f97316' }} />
          )}
          {INDICATORS.map(({ key, color }) =>
            visibleKeys.has(key) ? (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

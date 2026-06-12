import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface FilterOption {
  label: string
  value: string
}

interface FilterField {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'daterange'
  options?: FilterOption[]
}

interface FilterPanelProps {
  fields: FilterField[]
  values: Record<string, string | string[]>
  onChange: (key: string, value: string | string[]) => void
  onClear: () => void
  onApply?: () => void
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export default function FilterPanel({
  fields,
  values,
  onChange,
  onClear,
  onApply,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const activeFiltersCount = Object.values(values).filter(
    (v) => v && (typeof v === 'string' ? v !== '' : v.length > 0)
  ).length

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b border-gray-200',
          collapsible && 'cursor-pointer hover:bg-gray-50'
        )}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">筛选条件</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清除
            </button>
          )}
          {collapsible && (
            <button className="p-1 rounded hover:bg-gray-100">
              {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {field.type === 'select' && field.options && (
                  <select
                    value={(values[field.key] as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={(values[field.key] as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
          {onApply && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onApply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                应用筛选
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
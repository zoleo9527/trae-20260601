import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface TableColumn {
  key: string
  title: string
  render?: (value: unknown, record: Record<string, unknown>) => ReactNode
}

interface TableProps {
  columns: TableColumn[]
  data: Record<string, unknown>[]
  onRowClick?: (record: Record<string, unknown>) => void
  loading?: boolean
}

export function Table({ columns, data, onRowClick, loading }: TableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 border-t border-gray-200">
              <div className="flex items-center h-full px-4 gap-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th 
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => (
            <tr 
              key={index}
              className={clsx(
                'border-t border-gray-100 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-blue-50'
              )}
              onClick={() => onRowClick?.(record)}
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render 
                    ? col.render(record[col.key], record)
                    : String(record[col.key] || '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暂无数据
        </div>
      )}
    </div>
  )
}
import { ReactNode } from 'react'
import clsx from 'clsx'

interface Column<T> {
  key: keyof T | string
  title: string
  width?: string
  render?: (row: T, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
}

interface DenseTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: keyof T | ((row: T) => string)
  onRowClick?: (row: T) => void
  className?: string
  headerClassName?: string
  rowClassName?: string | ((row: T) => string)
  emptyText?: string
  stickyHeader?: boolean
}

export function DenseTable<T extends object>({
  columns,
  data,
  rowKey,
  onRowClick,
  className,
  headerClassName,
  rowClassName,
  emptyText = '暂无数据',
  stickyHeader = false,
}: DenseTableProps<T>) {
  const getKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row)
    }
    return String(row[rowKey] ?? index)
  }

  return (
    <div className={clsx('overflow-auto scrollbar-thin', className)}>
      <table className="w-full border-collapse">
        <thead className={clsx(stickyHeader && 'sticky top-0 z-10', headerClassName)}>
          <tr className="bg-neutral-50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx(
                  'table-header whitespace-nowrap',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.width && `w-[${col.width}]`
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="table-cell text-center text-neutral-400 py-12"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = getKey(row, index)
              const rc =
                typeof rowClassName === 'function' ? rowClassName(row) : rowClassName

              return (
                <tr
                  key={key}
                  className={clsx(
                    'hover:bg-neutral-50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    rc
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => {
                    const value = col.key in row ? (row as any)[col.key] : undefined
                    return (
                      <td
                        key={String(col.key)}
                        className={clsx(
                          'table-cell',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right'
                        )}
                      >
                        {col.render ? col.render(row, index) : value}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

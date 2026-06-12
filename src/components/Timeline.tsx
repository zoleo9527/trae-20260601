import { type ReactNode } from 'react'
import { cn } from '@/utils/helpers'

interface TimelineItem {
  id: string
  date: string
  title: string
  content?: string
  icon?: ReactNode
  type?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export default function Timeline({ items, className }: TimelineProps) {
  const typeColors = {
    default: 'bg-gray-200',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      {items.map((item, index) => (
        <div key={item.id} className={cn('relative pl-12 pb-8', index === items.length - 1 && 'pb-0')}>
          <div
            className={cn(
              'absolute left-2 w-4 h-4 rounded-full border-2 border-white',
              typeColors[item.type || 'default']
            )}
          />
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <span className="text-sm text-gray-500">{item.date}</span>
            </div>
            {item.content && <p className="text-sm text-gray-600">{item.content}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
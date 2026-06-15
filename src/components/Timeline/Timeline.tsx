import { CheckCircle2, Circle, Clock } from 'lucide-react'
import type { TimelineItem } from '@/types'
import { clsx } from 'clsx'

interface TimelineProps {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            {index === items.length - 1 ? (
              <Clock className="w-5 h-5 text-blue-500" />
            ) : item.status.includes('完成') ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
            {index < items.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.status}</p>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                {item.handler && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {item.handler.role === 'customer_service' ? '客服' :
                       item.handler.role === 'housekeeper' ? '家政员' :
                       item.handler.role === 'quality_supervisor' ? '质检主管' : ''}
                    </div>
                    <span className="text-sm text-gray-600">{item.handler.name}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(item.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
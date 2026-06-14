
import { MonitorCog, Plus } from 'lucide-react'

interface EmptyStateProps {
  onCreateClick?: () => void
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <MonitorCog className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无故障单</h3>
      <p className="text-sm text-gray-500 mb-6">当前没有符合条件的终端故障记录</p>
      {onCreateClick && (
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          提交故障单
        </button>
      )}
    </div>
  )
}

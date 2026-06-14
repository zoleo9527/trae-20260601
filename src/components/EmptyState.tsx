
import { MonitorCog, Plus, RefreshCcw, Gift, AlertTriangle } from 'lucide-react'

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
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 max-w-md">
        <h4 className="text-sm font-medium text-gray-700 mb-3">快速提交故障单</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5" />
            <span>日常使用时发现设备故障</span>
          </div>
          <div className="flex items-start gap-2">
            <RefreshCcw className="w-4 h-4 text-gray-400 mt-0.5" />
            <span>销售班结时发现设备异常</span>
          </div>
          <div className="flex items-start gap-2">
            <Gift className="w-4 h-4 text-gray-400 mt-0.5" />
            <span>兑奖登记时设备无法使用</span>
          </div>
        </div>
      </div>
      
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

import { Search, RotateCcw } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import type { OrderStatus, Stage, AnomalyType } from '@/types'

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'blocked', label: '已阻塞' },
]

const stageOptions: { value: Stage; label: string }[] = [
  { value: 'reception', label: '接单' },
  { value: 'design', label: '设计' },
  { value: 'qc', label: '质检' },
  { value: 'production', label: '排产' },
]

const anomalyOptions: { value: AnomalyType; label: string }[] = [
  { value: 'missing_material', label: '缺材料' },
  { value: 'timeout', label: '超时' },
  { value: 'qc_failed', label: '复核不通过' },
]

export default function FilterPanel() {
  const filters = useAppStore((s) => s.filters)
  const setFilter = useAppStore((s) => s.setFilter)
  const resetFilters = useAppStore((s) => s.resetFilters)

  const selectClass =
    'w-full bg-factory-bg border border-factory-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-factory-amber transition'

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">筛选条件</h3>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-factory-muted" />
        <input
          type="text"
          placeholder="客户名称"
          value={filters.customerName ?? ''}
          onChange={(e) => setFilter({ customerName: e.target.value || undefined })}
          className="w-full bg-factory-bg border border-factory-border rounded-md pl-9 pr-3 py-2 text-sm text-gray-200 placeholder:text-factory-muted focus:outline-none focus:border-factory-amber transition"
        />
      </div>

      <div>
        <label className="block text-xs text-factory-muted mb-1">订单状态</label>
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilter({ status: (e.target.value as OrderStatus) || undefined })}
          className={selectClass}
        >
          <option value="">全部状态</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-factory-muted mb-1">当前阶段</label>
        <select
          value={filters.stage ?? ''}
          onChange={(e) => setFilter({ stage: (e.target.value as Stage) || undefined })}
          className={selectClass}
        >
          <option value="">全部阶段</option>
          {stageOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-factory-muted mb-1">异常类型</label>
        <select
          value={filters.anomalyType ?? ''}
          onChange={(e) => setFilter({ anomalyType: (e.target.value as AnomalyType) || undefined })}
          className={selectClass}
        >
          <option value="">全部异常</option>
          {anomalyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-auto">
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-factory-muted border border-factory-border rounded-md hover:border-factory-amber hover:text-factory-amber transition"
        >
          <RotateCcw className="w-4 h-4" />
          重置筛选
        </button>
      </div>
    </div>
  )
}

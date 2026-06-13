import { useMemo } from 'react'
import { Search, Filter, RotateCcw } from 'lucide-react'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import { STATUS_LABELS, ROLE_LABELS } from '@/types'
import type { RecordStatus } from '@/types'

export default function FilterBar() {
  const filters = useWorkbenchStore((s) => s.filters)
  const setFilters = useWorkbenchStore((s) => s.setFilters)
  const resetFilters = useWorkbenchStore((s) => s.resetFilters)
  const currentRole = useWorkbenchStore((s) => s.currentRole)
  const records = useWorkbenchStore((s) => s.records)
  const todos = useWorkbenchStore((s) => s.todos)

  const roleRecordIds = useMemo(() => {
    const fromRole = new Set(records.filter((r) => r.role === currentRole).map((r) => r.id))
    const fromTodo = new Set(todos.filter((t) => t.role === currentRole).map((t) => t.recordId))
    return new Set([...fromRole, ...fromTodo])
  }, [records, todos, currentRole])

  const roleRecords = useMemo(() => records.filter((r) => roleRecordIds.has(r.id)), [records, roleRecordIds])

  const statusOptions: { value: RecordStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k as RecordStatus, label: v })),
  ]

  const periods = useMemo(() => Array.from(new Set(roleRecords.map((r) => r.settlement.period))).sort().reverse(), [roleRecords])
  const clients = useMemo(() => Array.from(new Set(roleRecords.map((r) => r.clientName))).sort(), [roleRecords])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {ROLE_LABELS[currentRole]}视角筛选
        </span>
        <button
          onClick={resetFilters}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索批次号、员工、客户..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filters.period}
          onChange={(e) => setFilters({ period: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">全部周期</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.clientName}
          onChange={(e) => setFilters({ clientName: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">全部客户</option>
          {clients.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

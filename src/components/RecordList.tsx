import { useMemo } from 'react'
import {
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Scale,
  Clock,
} from 'lucide-react'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import { STATUS_LABELS, SETTLEMENT_STATUS_LABELS, RECONCILIATION_STATUS_LABELS, ROLE_LABELS } from '@/types'
import type { RecordStatus } from '@/types'
import StatusTag from './StatusTag'
import { formatMoney } from '@/utils/cn'

const quickFilters: { status: RecordStatus; label: string; icon: typeof RotateCcw; color: string; activeColor: string }[] = [
  { status: 'returned', label: '退回补充', icon: RotateCcw, color: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100', activeColor: 'border-amber-500 bg-amber-100 text-amber-800 ring-1 ring-amber-300' },
  { status: 'disputed', label: '责任争议', icon: Scale, color: 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100', activeColor: 'border-purple-500 bg-purple-100 text-purple-800 ring-1 ring-purple-300' },
  { status: 'overdue', label: '逾期未处理', icon: Clock, color: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100', activeColor: 'border-red-500 bg-red-100 text-red-800 ring-1 ring-red-300' },
]

export default function RecordList() {
  const records = useWorkbenchStore((s) => s.records)
  const filters = useWorkbenchStore((s) => s.filters)
  const currentRole = useWorkbenchStore((s) => s.currentRole)
  const todos = useWorkbenchStore((s) => s.todos)
  const selectedRecordId = useWorkbenchStore((s) => s.selectedRecordId)
  const selectRecord = useWorkbenchStore((s) => s.selectRecord)
  const setFilters = useWorkbenchStore((s) => s.setFilters)

  const roleRecordIds = useMemo(() => {
    const fromRole = new Set(records.filter((r) => r.role === currentRole).map((r) => r.id))
    const fromTodo = new Set(todos.filter((t) => t.role === currentRole).map((t) => t.recordId))
    return new Set([...fromRole, ...fromTodo])
  }, [records, todos, currentRole])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (!roleRecordIds.has(r.id)) return false
      if (filters.status !== 'all' && r.recordStatus !== filters.status) return false
      if (filters.period && r.settlement.period !== filters.period) return false
      if (filters.clientName && !r.clientName.includes(filters.clientName)) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const searchable = `${r.batchNo} ${r.employeeName} ${r.clientName} ${r.projectName} ${r.id}`.toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })
  }, [records, filters, roleRecordIds])

  const quickCounts = useMemo(() => ({
    returned: records.filter((r) => roleRecordIds.has(r.id) && r.recordStatus === 'returned').length,
    disputed: records.filter((r) => roleRecordIds.has(r.id) && r.recordStatus === 'disputed').length,
    overdue: records.filter((r) => roleRecordIds.has(r.id) && r.recordStatus === 'overdue').length,
  }), [records, roleRecordIds])

  const handleQuickFilter = (status: RecordStatus) => {
    if (filters.status === status) {
      setFilters({ status: 'all' })
    } else {
      setFilters({ status })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">
          {ROLE_LABELS[currentRole]}视角 · 共 {filteredRecords.length} 条
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {quickFilters.map((qf) => {
          const Icon = qf.icon
          const isActive = filters.status === qf.status
          const count = quickCounts[qf.status as keyof typeof quickCounts]
          return (
            <button
              key={qf.status}
              onClick={() => handleQuickFilter(qf.status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                isActive ? qf.activeColor : qf.color
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {qf.label}
              <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-white/60' : 'bg-black/5'}`}>
                {count}
              </span>
            </button>
          )
        })}
        {filters.status !== 'all' && (
          <button
            onClick={() => setFilters({ status: 'all' })}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors ml-1"
          >
            清除筛选
          </button>
        )}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">暂无匹配记录</div>
      )}
      <div className="space-y-2 max-h-[calc(100vh-310px)] overflow-y-auto pr-1">
        {filteredRecords.map((r) => {
          const isSelected = selectedRecordId === r.id
          const hasWarning = r.recordStatus === 'returned' || r.recordStatus === 'overdue' || r.recordStatus === 'disputed'
          return (
            <div
              key={r.id}
              onClick={() => selectRecord(r.id)}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">{r.id}</span>
                  <StatusTag type="record" status={r.recordStatus} label={STATUS_LABELS[r.recordStatus]} />
                  {hasWarning && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
              <div className="mb-2">
                <div className="text-sm font-medium text-gray-800 truncate">{r.employeeName}</div>
                <div className="text-xs text-gray-500 truncate">{r.clientName} · {r.projectName}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-400">周期</span>
                  <p className="font-medium text-gray-600">{r.settlement.period}</p>
                </div>
                <div>
                  <span className="text-gray-400">实发工资</span>
                  <p className="font-medium text-gray-600">{formatMoney(r.settlement.totalNet)}</p>
                </div>
                <div>
                  <span className="text-gray-400">对账金额</span>
                  <p className="font-medium text-gray-600">{formatMoney(r.reconciliation.billedAmount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <StatusTag type="settlement" status={r.settlement.status} label={`结算: ${SETTLEMENT_STATUS_LABELS[r.settlement.status]}`} />
                <StatusTag type="reconciliation" status={r.reconciliation.status} label={`对账: ${RECONCILIATION_STATUS_LABELS[r.reconciliation.status]}`} />
                <span className="ml-auto text-[10px] text-gray-400">{ROLE_LABELS[r.role]} · {r.updatedAt}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

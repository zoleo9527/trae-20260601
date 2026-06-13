import { useMemo } from 'react'
import {
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import { STATUS_LABELS, SETTLEMENT_STATUS_LABELS, RECONCILIATION_STATUS_LABELS, ROLE_LABELS } from '@/types'
import StatusTag from './StatusTag'
import { formatMoney } from '@/utils/cn'

export default function RecordList() {
  const records = useWorkbenchStore((s) => s.records)
  const filters = useWorkbenchStore((s) => s.filters)
  const selectedRecordId = useWorkbenchStore((s) => s.selectedRecordId)
  const selectRecord = useWorkbenchStore((s) => s.selectRecord)

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
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
  }, [records, filters])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">共 {filteredRecords.length} 条记录</span>
      </div>
      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">暂无匹配记录</div>
      )}
      <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
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

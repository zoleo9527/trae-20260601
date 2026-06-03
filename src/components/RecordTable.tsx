import { useSampleStore } from '@/store/sampleStore'
import { useShallow } from 'zustand/shallow'
import { useMemo } from 'react'
import type { RecordStatus, SampleRecord, FilterState } from '@/types'
import { Zap, AlertOctagon, HelpCircle, ChevronRight } from 'lucide-react'

const statusConfig: Record<RecordStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: '待处理', bg: 'bg-slate-500/20', text: 'text-slate-300', dot: 'bg-slate-400' },
  sampling: { label: '留样中', bg: 'bg-sky-500/20', text: 'text-sky-300', dot: 'bg-sky-400' },
  completed: { label: '已完成', bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  abnormal: { label: '异常', bg: 'bg-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400' },
}

function filterRecords(records: SampleRecord[], filters: FilterState) {
  return records.filter((r) => {
    if (filters.status !== 'all' && r.status !== filters.status) return false
    if (filters.store && r.store !== filters.store) return false
    if (filters.exceptionType === 'rush' && !r.isRushOrder) return false
    if (filters.exceptionType === 'allergen' && !r.allergenMissing) return false
    if (filters.exceptionType === 'receiving' && !r.receivingUnclear) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      return (
        r.id.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.batchNo.toLowerCase().includes(q) ||
        r.store.toLowerCase().includes(q)
      )
    }
    return true
  })
}

export default function RecordTable() {
  const { records, filters, selectedIds, toggleSelect, toggleSelectAll, openDetail } = useSampleStore(
    useShallow((s) => ({
      records: s.records,
      filters: s.filters,
      selectedIds: s.selectedIds,
      toggleSelect: s.toggleSelect,
      toggleSelectAll: s.toggleSelectAll,
      openDetail: s.openDetail,
    }))
  )
  const filteredRecords = useMemo(() => filterRecords(records, filters), [records, filters])

  const allIds = filteredRecords.map((r) => r.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/40">
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => toggleSelectAll(allIds)}
                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-500 focus:ring-sky-500/30"
              />
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">编号</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">产品</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">批次号</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">门店</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">留样克数</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">留样时间</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">状态</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">异常标记</th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((r) => {
            const sc = statusConfig[r.status]
            const hasException = r.isRushOrder || r.allergenMissing || r.receivingUnclear
            return (
              <tr
                key={r.id}
                onClick={() => openDetail(r.id)}
                className={`group relative cursor-pointer border-b border-slate-700/30 transition-colors hover:bg-slate-700/30 ${
                  selectedIds.includes(r.id) ? 'bg-sky-900/20' : ''
                }`}
              >
                {hasException && (
                  <td className="absolute left-0 top-0 h-full w-1 rounded-l bg-amber-500 animate-pulse" />
                )}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-500 focus:ring-sky-500/30"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-sky-400">{r.id}</td>
                <td className="px-4 py-3 font-medium text-slate-200">{r.productName}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.batchNo}</td>
                <td className="px-4 py-3 text-slate-300">{r.store}</td>
                <td className="px-4 py-3 font-mono text-slate-300">{r.sampleWeight}g</td>
                <td className="px-4 py-3 text-xs text-slate-400">{r.sampleTime.slice(5)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {r.isRushOrder && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400" title="临时加单">
                        <Zap className="h-3 w-3" />
                        加单
                      </span>
                    )}
                    {r.allergenMissing && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400" title="过敏原漏标">
                        <AlertOctagon className="h-3 w-3" />
                        过敏原
                      </span>
                    )}
                    {r.receivingUnclear && (
                      <span className="inline-flex items-center gap-1 rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400" title="收货不清">
                        <HelpCircle className="h-3 w-3" />
                        收货
                      </span>
                    )}
                    {!hasException && <span className="text-slate-600">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-sky-400" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {filteredRecords.length === 0 && (
        <div className="py-16 text-center text-slate-500">暂无匹配记录</div>
      )}
    </div>
  )
}

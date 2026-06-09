import StatusBadge from '@/components/StatusBadge'
import { useParcelStore } from '@/store/parcelStore'
import { ROLE_LABELS, STATUS_LABELS, type ParcelStatus } from '@shared/types'
import { ChevronDown, ChevronUp, History, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'arrived_pending', label: STATUS_LABELS.arrived_pending },
  { value: 'dispatched_pending', label: STATUS_LABELS.dispatched_pending },
  { value: 'delivering', label: STATUS_LABELS.delivering },
  { value: 'signed', label: STATUS_LABELS.signed },
  { value: 'problem_pending', label: STATUS_LABELS.problem_pending },
  { value: 'closed', label: STATUS_LABELS.closed },
]

export default function ReviewPage() {
  const { parcels, auditLogs, fetchParcels, fetchAuditLog } = useParcelStore()
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [trackingNo, setTrackingNo] = useState('')
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null)

  const pageSize = 10

  useEffect(() => {
    fetchParcels()
  }, [])

  const handleSearch = () => {
    const filters: Record<string, string> = {}
    if (trackingNo) filters.tracking_no = trackingNo
    if (status) filters.status = status
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    setPage(1)
    fetchParcels(filters)
  }

  const handleViewLog = (parcelId: number) => {
    setSelectedParcelId(parcelId)
    setDrawerOpen(true)
    fetchAuditLog(parcelId)
  }

  const filteredParcels = parcels.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(parcels.length / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-800">派件回看</h1>
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span>筛选条件</span>
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {filtersOpen && (
          <div className="grid grid-cols-1 gap-3 border-t px-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
            <input
              type="text"
              placeholder="运单号搜索"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-1 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Search className="h-4 w-4" />
              搜索
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-medium">运单号</th>
              <th className="px-4 py-3 font-medium">到件时间</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">当前责任人</th>
              <th className="px-4 py-3 font-medium">分配时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredParcels.map((parcel: any) => (
              <tr key={parcel.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-800">{parcel.tracking_no}</td>
                <td className="px-4 py-3 text-slate-600">{parcel.arrived_at ?? parcel.created_at}</td>
                <td className="px-4 py-3"><StatusBadge status={parcel.status} /></td>
                <td className="px-4 py-3">
                  <span className="text-slate-800">{parcel.responsible_name ?? parcel.assignee_name ?? parcel.scanned_by_name ?? '-'}</span>
                  {parcel.responsible_type && (
                    <span className="ml-1 text-xs text-slate-400">({ROLE_LABELS[parcel.responsible_type] ?? parcel.responsible_type})</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{parcel.dispatched_at ?? '-'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleViewLog(parcel.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50"
                  >
                    查看日志
                  </button>
                </td>
              </tr>
            ))}
            {filteredParcels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-800">操作日志</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 56px)' }}>
              {auditLogs.length === 0 && (
                <p className="text-center text-slate-400">暂无日志</p>
              )}
              <div className="relative ml-3">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
                {auditLogs.map((log: any, idx: number) => (
                  <div key={idx} className="relative pb-6 pl-6">
                    <div className="absolute left-0 top-1 h-2.5 w-2.5 -translate-x-[4.5px] rounded-full bg-orange-400" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-slate-800">
                        {STATUS_LABELS[log.from_status as ParcelStatus] ?? log.from_status} → {STATUS_LABELS[log.to_status as ParcelStatus] ?? log.to_status}
                      </div>
                      <div className="text-xs text-slate-500">
                        操作人：{log.operator_name}（{ROLE_LABELS[log.operator_role] ?? log.operator_role}）
                      </div>
                      <div className="text-xs text-slate-500">
                        责任人：{log.responsible_name}（{ROLE_LABELS[log.responsible_type] ?? log.responsible_type}）
                      </div>
                      <div className="text-xs text-slate-400">{log.created_at}</div>
                      {log.note && (
                        <div className="text-xs text-slate-500 italic">备注：{log.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle } from 'lucide-react'
import { getComplaints, getUsers, batchOperation } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import BatchActions from '@/components/BatchActions'
import { COMPLAINT_TYPE_LABELS, COMPLAINT_STATUS_LABELS, STUCK_POINT_LABELS, EVIDENCE_REVIEW_STATUS_LABELS } from '../../shared/types'
import type { Complaint, ComplaintStatus, ComplaintType, User } from '../../shared/types'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const evidenceReviewStatusColors: Record<string, string> = {
  pending: 'text-gray-400',
  in_progress: 'text-cyan-400',
  completed: 'text-emerald-400',
  blocked: 'text-red-400',
}

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  ...Object.entries(COMPLAINT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const typeOptions: { value: string; label: string }[] = [
  { value: '', label: '全部类型' },
  ...Object.entries(COMPLAINT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

export default function Complaints() {
  const [items, setItems] = useState<Complaint[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [plateSearch, setPlateSearch] = useState('')

  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      if (assigneeFilter) params.assignee = assigneeFilter
      const res = await getComplaints(params)
      const filtered = plateSearch
        ? res.items.filter((i: any) => i.plate_number?.includes(plateSearch))
        : res.items
      setItems(filtered)
      setTotal(plateSearch ? filtered.length : res.total)
      setTotalPages(plateSearch ? 1 : res.totalPages)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, typeFilter, assigneeFilter, plateSearch])

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map((i) => i.id))
    }
  }

  const handleBatchAction = async (action: 'assign' | 'process' | 'close', assigneeId?: number) => {
    try {
      await batchOperation({ ids: selectedIds, action, assigneeId })
      setSelectedIds([])
      fetchData()
    } catch {
      // ignore
    }
  }

  return (
    <div className="pb-16">
      <div className="bg-park-card rounded-lg border border-park-border p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1) }}
            className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
          >
            <option value="">全部负责人</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-park-muted" />
            <input
              type="text"
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value)}
              placeholder="搜索车牌号"
              className="w-full bg-park-bg border border-park-border rounded pl-10 pr-4 py-1.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber"
            />
          </div>
        </div>
      </div>

      <div className="bg-park-card rounded-lg border border-park-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-park-muted text-left border-b border-park-border">
                <th className="py-3 px-4 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length && items.length > 0}
                    onChange={toggleAll}
                    className="rounded border-park-border bg-park-bg accent-park-amber"
                  />
                </th>
                <th className="py-3 px-4 font-medium">工单号</th>
                <th className="py-3 px-4 font-medium">类型</th>
                <th className="py-3 px-4 font-medium">状态</th>
                <th className="py-3 px-4 font-medium">车牌号</th>
                <th className="py-3 px-4 font-medium">负责人</th>
                <th className="py-3 px-4 font-medium">回查</th>
                <th className="py-3 px-4 font-medium">卡点</th>
                <th className="py-3 px-4 font-medium">截止时间</th>
                <th className="py-3 px-4 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr
                  key={item.id}
                  className={`border-b border-park-border/50 hover:bg-park-hover/50 cursor-pointer transition-colors ${item.stuck_point ? 'bg-red-500/5' : ''}`}
                  onClick={() => navigate(`/complaints/${item.id}`)}
                >
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-park-border bg-park-bg accent-park-amber"
                    />
                  </td>
                  <td className="py-3 px-4 text-park-text font-medium">{item.complaint_no}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-park-hover text-park-text text-xs">
                      {COMPLAINT_TYPE_LABELS[item.type as ComplaintType]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status as ComplaintStatus} />
                  </td>
                  <td className="py-3 px-4 text-park-muted">{item.plate_number || '-'}</td>
                  <td className="py-3 px-4">
                    {item.assignee_name ? (
                      <span className="text-park-text">{item.assignee_name}</span>
                    ) : (
                      <span className="text-red-400 text-xs">未分配</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.evidence_review_status ? (
                      <span className={`text-xs ${evidenceReviewStatusColors[item.evidence_review_status] || 'text-park-muted'}`}>
                        {EVIDENCE_REVIEW_STATUS_LABELS[item.evidence_review_status] || item.evidence_review_status}
                      </span>
                    ) : (
                      <span className="text-park-muted text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.stuck_point ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        {STUCK_POINT_LABELS[item.stuck_point] || item.stuck_point}
                      </span>
                    ) : (
                      <span className="text-park-muted text-xs">-</span>
                    )}
                  </td>
                  <td className={`py-3 px-4 ${item.is_overdue ? 'text-red-400 font-medium' : 'text-park-muted'}`}>
                    {formatTime(item.deadline)}
                  </td>
                  <td className="py-3 px-4 text-park-muted">{formatTime(item.created_at)}</td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-park-muted">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-park-border">
            <span className="text-xs text-park-muted">共 {total} 条</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm rounded bg-park-hover text-park-muted hover:text-park-text disabled:opacity-50 transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-park-muted">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded bg-park-hover text-park-muted hover:text-park-text disabled:opacity-50 transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      <BatchActions
        selectedIds={selectedIds}
        users={users}
        onBatchAction={handleBatchAction}
        onClear={() => setSelectedIds([])}
      />
    </div>
  )
}

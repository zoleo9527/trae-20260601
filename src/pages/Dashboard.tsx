import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, AlertTriangle, RotateCcw, Users, AlertOctagon } from 'lucide-react'
import { getComplaints, getUsers, batchOperation } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import BatchActions from '@/components/BatchActions'
import { COMPLAINT_TYPE_LABELS, USER_ROLE_LABELS, STUCK_POINT_LABELS, EVIDENCE_REVIEW_STATUS_LABELS } from '../../shared/types'
import type { Complaint, User, UserRole } from '../../shared/types'

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

export default function Dashboard() {
  const [todayItems, setTodayItems] = useState<Complaint[]>([])
  const [overdueItems, setOverdueItems] = useState<Complaint[]>([])
  const [rejectedItems, setRejectedItems] = useState<Complaint[]>([])
  const [allItems, setAllItems] = useState<Complaint[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [todayRes, overdueRes, rejectedRes, dashboardRes, usersRes] = await Promise.all([
        getComplaints({ group: 'today', limit: 50 }),
        getComplaints({ group: 'overdue', limit: 50 }),
        getComplaints({ group: 'rejected', limit: 50 }),
        getComplaints({ group: 'dashboard', limit: 100 }),
        getUsers(),
      ])
      setTodayItems(todayRes.items)
      setOverdueItems(overdueRes.items)
      setRejectedItems(rejectedRes.items)
      setAllItems(dashboardRes.items)
      setUsers(usersRes)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
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
    if (selectedIds.length === allItems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(allItems.map((i) => i.id))
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

  const stuckCount = allItems.filter((i: any) => i.stuck_point).length
  const blockedEvidenceCount = allItems.filter((i: any) => i.evidence_review_status === 'blocked').length

  const assigneeSummary = users.map((u) => {
    const items = allItems.filter((i) => i.assignee_id === u.id && i.status !== 'closed')
    return { user: u, count: items.length, items }
  }).filter((s) => s.count > 0)

  const statCards = [
    {
      label: '今日待办',
      count: todayItems.length,
      icon: ClipboardList,
      iconColor: 'text-park-amber',
      bgColor: 'bg-amber-500/10',
      items: todayItems.slice(0, 3),
    },
    {
      label: '已拖延',
      count: overdueItems.length,
      icon: AlertTriangle,
      iconColor: 'text-park-red',
      bgColor: 'bg-red-500/10',
      items: overdueItems.slice(0, 3),
    },
    {
      label: '刚被退回',
      count: rejectedItems.length,
      icon: RotateCcw,
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      items: rejectedItems.slice(0, 3),
    },
  ]

  if (loading) {
    return <div className="text-park-muted text-center py-20">加载中...</div>
  }

  return (
    <div className="pb-16">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-park-card rounded-lg border border-park-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-sm text-park-muted">{card.label}</span>
              </div>
              <span className="text-3xl font-bold text-park-text">{card.count}</span>
            </div>
            <div className="space-y-1.5">
              {card.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-park-hover rounded px-2 py-1 -mx-2 transition-colors"
                  onClick={() => navigate(`/complaints/${item.id}`)}
                >
                  <span className="text-park-text truncate">{item.complaint_no}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
              {card.items.length === 0 && (
                <div className="text-xs text-park-muted">暂无数据</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(stuckCount > 0 || blockedEvidenceCount > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {stuckCount > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertOctagon className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-red-400">卡点提醒</span>
                <span className="text-lg font-bold text-red-400 ml-auto">{stuckCount}</span>
              </div>
              <div className="space-y-1.5">
                {allItems.filter((i: any) => i.stuck_point).slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-red-500/10 rounded px-2 py-1 -mx-2 transition-colors"
                    onClick={() => navigate(`/complaints/${item.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-park-text truncate">{item.complaint_no}</span>
                      <span className="text-red-300">{STUCK_POINT_LABELS[item.stuck_point] || item.stuck_point}</span>
                    </div>
                    <span className="text-park-muted">{item.assignee_name || '未分配'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {blockedEvidenceCount > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertOctagon className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">证据回查受阻</span>
                <span className="text-lg font-bold text-orange-400 ml-auto">{blockedEvidenceCount}</span>
              </div>
              <div className="space-y-1.5">
                {allItems.filter((i: any) => i.evidence_review_status === 'blocked').slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-orange-500/10 rounded px-2 py-1 -mx-2 transition-colors"
                    onClick={() => navigate(`/complaints/${item.id}`)}
                  >
                    <span className="text-park-text truncate">{item.complaint_no}</span>
                    <span className="text-orange-300">{COMPLAINT_TYPE_LABELS[item.type]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {assigneeSummary.length > 0 && (
        <div className="bg-park-card rounded-lg border border-park-border p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-park-amber" />
            <span className="text-sm font-medium text-park-text">责任人工作负载</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {assigneeSummary.map(({ user: u, count, items }) => (
              <div key={u.id} className="bg-park-hover/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-park-text font-medium">{u.name}</div>
                    <div className="text-xs text-park-muted">{USER_ROLE_LABELS[u.role as UserRole]}</div>
                  </div>
                  <span className="text-xl font-bold text-park-amber">{count}</span>
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs cursor-pointer hover:bg-park-hover rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
                      onClick={() => navigate(`/complaints/${item.id}`)}
                    >
                      <span className="text-park-text truncate max-w-[120px]">{item.complaint_no}</span>
                      <div className="flex items-center gap-1.5">
                        {(item as any).stuck_point && (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        )}
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-park-card rounded-lg border border-park-border">
        <div className="px-5 py-3 border-b border-park-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-park-text">全部工单</h2>
          <div className="flex items-center gap-3 text-xs text-park-muted">
            <span>卡点 <span className="text-red-400 font-medium">{stuckCount}</span></span>
            <span>回查受阻 <span className="text-orange-400 font-medium">{blockedEvidenceCount}</span></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-park-muted text-left border-b border-park-border">
                <th className="py-3 px-4 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === allItems.length && allItems.length > 0}
                    onChange={toggleAll}
                    className="rounded border-park-border bg-park-bg accent-park-amber"
                  />
                </th>
                <th className="py-3 px-4 font-medium">工单号</th>
                <th className="py-3 px-4 font-medium">类型</th>
                <th className="py-3 px-4 font-medium">状态</th>
                <th className="py-3 px-4 font-medium">负责人</th>
                <th className="py-3 px-4 font-medium">回查</th>
                <th className="py-3 px-4 font-medium">卡点</th>
                <th className="py-3 px-4 font-medium">截止时间</th>
                <th className="py-3 px-4 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item: any) => (
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
                      {COMPLAINT_TYPE_LABELS[item.type]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} />
                  </td>
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
              {allItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-park-muted">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

import { useEffect, useState, useCallback } from 'react'
import { History, Filter, History as HistoryIcon, XCircle, Check } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'closed', label: '已闭环' },
  { value: 'submitted', label: '待下发' },
  { value: 'pending_confirm', label: '待确认' },
  { value: 'pending_review', label: '待复核' },
  { value: 'pending_brand_confirm', label: '待品牌确认' },
  { value: 'review_rejected', label: '复核退回' },
  { value: 'pending_material', label: '待补材料' },
  { value: 'timeout_escalated', label: '超时升级' },
]

const STATUS_LABELS: Record<string, string> = {
  submitted: '待下发',
  pending_confirm: '待确认',
  pending_material: '待补材料',
  timeout_escalated: '超时升级',
  pending_review: '待复核',
  review_rejected: '复核退回',
  pending_brand_confirm: '待品牌确认',
  closed: '已闭环',
}

const ROLE_LABELS: Record<string, string> = {
  floor_supervisor: '楼层主管',
  brand_supervisor: '品牌督导',
  counter_manager: '柜长',
  guide: '导购',
}

const ACTION_STYLES: Record<string, { label: string; cls: string }> = {
  approve: { label: '通过', cls: 'badge-success' },
  reject: { label: '退回', cls: 'badge-danger' },
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-ops-info/20 text-ops-info',
  pending_confirm: 'bg-ops-info/20 text-ops-info',
  pending_material: 'bg-amber-600/20 text-amber-500',
  timeout_escalated: 'bg-ops-danger/20 text-ops-danger',
  pending_review: 'bg-ops-info/20 text-ops-info',
  review_rejected: 'bg-ops-danger/20 text-ops-danger',
  pending_brand_confirm: 'bg-emerald-600/20 text-emerald-400',
  closed: 'badge-success',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '晚班',
  fullday: '全天',
}

const EXCEPTION_STATUSES = new Set([
  'timeout_escalated',
  'review_rejected',
  'pending_material',
  'submitted',
])

const EXCEPTION_BORDER_COLORS: Record<string, string> = {
  timeout_escalated: 'border-l-ops-danger',
  review_rejected: 'border-l-ops-danger',
  pending_material: 'border-l-amber-500',
  submitted: 'border-l-ops-info',
}

interface AttendanceRecord {
  id: number
  date: string
  shift: string
  counterName: string
  staffName: string
  status: string
  confirmedAt: string | null
  exceptionNote: string | null
  rejectedReason: string | null
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

export default function HistoryPage() {
  const { attendance, loading, trails, fetchAttendance, fetchTrail } = useDataStore()
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const list = attendance as AttendanceRecord[]

  const loadData = useCallback(() => {
    const filters: Record<string, unknown> = {}
    if (statusFilter) filters.status = statusFilter
    if (dateFilter) filters.date = dateFilter
    fetchAttendance(filters)
  }, [fetchAttendance, statusFilter, dateFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleReset = () => {
    setStatusFilter('')
    setDateFilter('')
  }

  const totalCount = list.length
  const normalCount = list.filter((a) => a.status === 'closed').length
  const exceptionCount = list.filter((a) => EXCEPTION_STATUSES.has(a.status)).length

  const renderHistory = (attendanceId: number) => {
    const trail = trails[attendanceId]
    if (!trail || ((!trail.logs || trail.logs.length === 0) && (!trail.reviews || trail.reviews.length === 0))) {
      return (
        <button
          onClick={() => fetchTrail(attendanceId)}
          className="text-[10px] text-gray-500 hover:text-ops-accent transition-colors flex items-center gap-1"
        >
          <HistoryIcon size={10} />
          查看流转轨迹
        </button>
      )
    }

    const allItems: Array<{
      id: string
      fromStatus?: string
      toStatus?: string
      operatorRole?: string
      operatorName?: string
      action?: string
      reason?: string
      createdAt?: string
      type: 'log' | 'review'
    }> = []

    trail.logs?.forEach((log: any, idx: number) => {
      allItems.push({
        id: `log-${idx}`,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        operatorRole: log.operatorRole,
        operatorName: log.operatorName,
        reason: log.detail,
        createdAt: log.createdAt,
        type: 'log',
      })
    })

    trail.reviews?.forEach((review: any, idx: number) => {
      allItems.push({
        id: `review-${idx}`,
        action: review.action,
        operatorRole: review.reviewerRole || review.operatorRole,
        operatorName: review.reviewerName || review.operatorName,
        reason: review.reason,
        createdAt: review.reviewCreatedAt || review.createdAt,
        type: 'review',
      })
    })

    allItems.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return ta - tb
    })

    if (allItems.length === 0) return null

    return (
      <div className="mt-3 pt-3 border-t border-ops-border/50 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
          <HistoryIcon size={10} />
          <span>流转轨迹 ({allItems.length}步)</span>
        </div>
        <div className="space-y-1.5">
          {allItems.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-xs">
              {item.type === 'review' && item.action ? (
                <span className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5',
                  ACTION_STYLES[item.action]?.cls || 'badge-warning'
                )}>
                  {item.action === 'approve' && <Check size={9} />}
                  {item.action === 'reject' && <XCircle size={9} />}
                  {ACTION_STYLES[item.action]?.label || item.action}
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 bg-blue-600/20 text-blue-400">
                  流转
                </span>
              )}
              <div className="flex-1 min-w-0">
                {(item.fromStatus || item.toStatus) && (
                  <span className="text-gray-300 font-mono text-[11px]">
                    <span className="text-gray-500">{STATUS_LABELS[item.fromStatus!] || item.fromStatus || '新建'}</span>
                    <span className="mx-1 text-gray-600">→</span>
                    <span className="text-ops-accent">{STATUS_LABELS[item.toStatus!] || item.toStatus}</span>
                  </span>
                )}
                {item.operatorRole && (
                  <span className="text-gray-400 ml-2">
                    {ROLE_LABELS[item.operatorRole] || item.operatorRole}
                    {item.operatorName ? `(${item.operatorName})` : ''}
                  </span>
                )}
                {item.reason && (
                  <div className="text-gray-500 break-all mt-0.5">: {item.reason.slice(0, 50)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <History className="text-ops-accent" size={20} />
        <h2 className="text-lg font-bold">考勤回看</h2>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter size={14} className="text-gray-500" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-ops-card border border-ops-border rounded px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-ops-accent transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-ops-card border border-ops-border rounded px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-ops-accent transition-colors font-mono"
        />
        <button
          onClick={loadData}
          className="px-4 py-1.5 rounded text-sm font-medium bg-ops-accent text-ops-dark hover:bg-ops-accent/90 transition-colors"
        >
          查询
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 rounded text-sm font-medium bg-ops-card border border-ops-border text-gray-400 hover:text-gray-200 transition-colors"
        >
          重置
        </button>
      </div>

      <div className="flex items-center gap-6 mb-5 text-sm">
        <span className="text-gray-400">总计 <span className="font-mono font-bold text-gray-200">{totalCount}</span></span>
        <span className="text-gray-400">正常 <span className="font-mono font-bold text-ops-success">{normalCount}</span></span>
        <span className="text-gray-400">异常 <span className="font-mono font-bold text-ops-danger">{exceptionCount}</span></span>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-12">暂无历史数据</div>
      ) : (
        <div className="bg-ops-card border border-ops-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ops-border text-gray-500 text-xs">
                <th className="text-left px-4 py-2.5 font-medium">日期</th>
                <th className="text-left px-4 py-2.5 font-medium">班次</th>
                <th className="text-left px-4 py-2.5 font-medium">专柜</th>
                <th className="text-left px-4 py-2.5 font-medium">导购</th>
                <th className="text-left px-4 py-2.5 font-medium">状态</th>
                <th className="text-left px-4 py-2.5 font-medium">确认时间</th>
                <th className="text-left px-4 py-2.5 font-medium">异常说明</th>
                <th className="text-left px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a, idx) => {
                const isClosed = a.status === 'closed'
                const isException = EXCEPTION_STATUSES.has(a.status)
                const isExpanded = expandedId === a.id

                return (
                  <>
                    <tr
                      key={a.id}
                      className={cn(
                        'border-b border-ops-border/50 transition-colors hover:bg-ops-border/20',
                        idx % 2 === 1 && 'bg-ops-dark/30',
                        isClosed && 'opacity-60',
                        isException && 'border-l-4',
                        isException && EXCEPTION_BORDER_COLORS[a.status],
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-300 whitespace-nowrap">
                        {a.date}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                          a.shift === 'morning' ? 'bg-blue-900/40 text-blue-300' :
                          a.shift === 'afternoon' ? 'bg-orange-900/40 text-orange-300' :
                          'bg-purple-900/40 text-purple-300',
                        )}>
                          {SHIFT_LABELS[a.shift] || a.shift}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{a.counterName}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-ops-border flex items-center justify-center text-[9px] font-bold text-gray-300">
                            {a.staffName?.[0]}
                          </span>
                          <span className="text-gray-300">{a.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium',
                          STATUS_COLORS[a.status] || 'badge-warning',
                        )}>
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-400 whitespace-nowrap">
                        {a.confirmedAt ? formatDateTime(a.confirmedAt) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 max-w-[200px] truncate">
                        {a.rejectedReason || a.exceptionNote || '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (!isExpanded) {
                              fetchTrail(a.id)
                            }
                            setExpandedId(isExpanded ? null : a.id)
                          }}
                          className="text-[11px] text-gray-400 hover:text-ops-accent transition-colors flex items-center gap-1"
                        >
                          <HistoryIcon size={11} />
                          {isExpanded ? '收起轨迹' : '查看轨迹'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${a.id}-expanded`} className="bg-ops-dark/40 border-b border-ops-border/30">
                        <td colSpan={8} className="px-8 py-3">
                          {renderHistory(a.id)}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

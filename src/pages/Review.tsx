import { useEffect, useState, useCallback } from 'react'
import { CheckSquare, XCircle, Check, AlertCircle, RefreshCcw, History as HistoryIcon, ShieldAlert } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
  id: number
  staffName: string
  counterName: string
  counterId: number
  date: string
  shift: string
  status: string
  rejectedReason: string | null
  currentResponsible: number | null
  deadline: string | null
}

interface ReviewRecord {
  attendanceId: number
  date: string
  shift: string
  staffName: string
  counterName: string
  counterId: number
  reviewId: number
  reviewerId: number
  reviewerRole: string
  action: string
  reason: string
  reviewCreatedAt: string
}

const SHIFT_LABELS: Record<string, string> = { morning: '早班', afternoon: '晚班' }

const ROLE_LABELS: Record<string, string> = {
  floor_supervisor: '楼层主管',
  brand_supervisor: '品牌督导',
  counter_manager: '柜长',
  guide: '导购',
}

const STATUS_LABELS: Record<string, string> = {
  submitted: '已提交',
  pending_confirm: '待确认',
  pending_material: '待补材料',
  timeout_escalated: '超时升级',
  pending_review: '待复核',
  review_rejected: '复核不通过',
  pending_brand_confirm: '待品牌确认',
  closed: '已闭环',
}

const ACTION_STYLES: Record<string, { label: string; cls: string }> = {
  approve: { label: '通过', cls: 'badge-success' },
  reject: { label: '退回', cls: 'badge-danger' },
}

const RESPONSIBLE_NAMES: Record<number, string> = {
  2: '张明(楼层)', 3: '李红(品牌)', 10: '郑伟(品牌)',
}

export default function Review() {
  const user = useAuthStore((s) => s.user)
  const { attendance, reviews, loading, trails, fetchAttendance, fetchReviews, approveReview, rejectReview, fetchTrail } = useDataStore()
  const [tab, setTab] = useState<'pending' | 'processed'>('pending')
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actioningId, setActioningId] = useState<number | null>(null)

  const isFloorSupervisor = user?.role === 'floor_supervisor'
  const isBrandSupervisor = user?.role === 'brand_supervisor'
  const pendingStatus = isFloorSupervisor ? 'pending_review' : 'pending_brand_confirm'
  const reviewLevelLabel = isFloorSupervisor ? '楼层复核' : '品牌确认'

  const loadData = useCallback(() => {
    const filters: Record<string, unknown> = { status: pendingStatus }
    if (user?.role === 'brand_supervisor' && user.counterId) {
      filters.counterId = user.counterId
    }
    fetchAttendance(filters)
    const reviewFilters: Record<string, unknown> = {}
    if (user?.role === 'counter_manager' && user.counterId) {
      reviewFilters.counterId = user.counterId
    }
    if (user?.role === 'brand_supervisor' && user.brandId) {
      reviewFilters.brandId = user.brandId
    }
    fetchReviews(reviewFilters)
  }, [pendingStatus, user, fetchAttendance, fetchReviews])

  useEffect(() => { loadData() }, [loadData])

  const attendanceList = (attendance as AttendanceRecord[]) || []
  const reviewList = (reviews as ReviewRecord[]) || []

  const reviewsByAttendance = reviewList.reduce<Record<number, ReviewRecord[]>>((acc, r) => {
    if (!acc[r.attendanceId]) acc[r.attendanceId] = []
    acc[r.attendanceId].push(r)
    return acc
  }, {})

  const myApprovedIds = new Set(
    reviewList
      .filter((r) => r.reviewerRole === user?.role && r.action === 'approve')
      .map((r) => r.attendanceId)
  )
  const myRejectedIds = new Set(
    reviewList
      .filter((r) => r.reviewerRole === user?.role && r.action === 'reject')
      .map((r) => r.attendanceId)
  )

  const filteredForBrand = (items: ReviewRecord[]) =>
    items.filter((r) => {
      if (user?.role !== 'brand_supervisor' || !user.counterId) return true
      return r.counterId === user.counterId
    })

  const pendingCount = attendanceList.length
  const myApprovedFiltered = filteredForBrand(
    reviewList.filter((r) => r.reviewerRole === user?.role && r.action === 'approve')
  ).length
  const myRejectedFiltered = filteredForBrand(
    reviewList.filter((r) => r.reviewerRole === user?.role && r.action === 'reject')
  ).length

  const processedMap = new Map<number, ReviewRecord>()
  filteredForBrand(
    reviewList.filter((r) => r.reviewerRole === user?.role && (r.action === 'approve' || r.action === 'reject'))
  ).forEach((r) => {
    if (!processedMap.has(r.attendanceId)) processedMap.set(r.attendanceId, r)
  })
  const processedItems = Array.from(processedMap.values())

  const handleApprove = async (attendanceId: number) => {
    if (!user) return
    setActioningId(attendanceId)
    try {
      await approveReview(attendanceId, user.id, user.role)
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (attendanceId: number) => {
    if (!user || !rejectReason.trim()) return
    setActioningId(attendanceId)
    try {
      await rejectReview(attendanceId, user.id, user.role, rejectReason.trim())
      setRejectingId(null)
      setRejectReason('')
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
  }

  const getRejectionCount = (attendanceId: number) =>
    (reviewsByAttendance[attendanceId] || []).filter((r) => r.action === 'reject').length

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
        reason: log.reason,
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
      <div className="mb-3 border-t border-ops-border pt-2.5 space-y-2">
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
                    <span className="text-gray-500">{STATUS_LABELS[item.fromStatus!] || item.fromStatus}</span>
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
                  <div className="text-gray-500 break-all mt-0.5">: {item.reason}</div>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckSquare className={cn(isBrandSupervisor ? 'text-emerald-400' : 'text-ops-accent')} size={20} />
          <h2 className="text-lg font-bold">复核中心 · {reviewLevelLabel}</h2>
          {isBrandSupervisor && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
              品牌督导视角
            </span>
          )}
          {isFloorSupervisor && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-600/30">
              楼层主管视角 · 全楼层
            </span>
          )}
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-gray-400 border border-ops-border hover:text-gray-200 hover:border-gray-500 transition-colors"
        >
          <RefreshCcw size={12} />
          刷新
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3 transition-all border shadow-[0_0_30px_rgba(245,158,11,0.08)] bg-ops-accent/8 border-ops-accent/30">
          <div className="w-9 h-9 rounded-lg bg-ops-accent/15 flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-ops-accent" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-ops-accent mb-0.5">
              ⏱ 有 {pendingCount} 条考勤等待{reviewLevelLabel}
            </p>
            <p className="text-[10px] text-gray-500">
              时效: {isFloorSupervisor ? 'T+2 18:00前需完成楼层复核' : 'T+3 18:00前需完成品牌确认'}，请及时处理以免影响工资核算。
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-mono font-bold text-ops-accent">{pendingCount}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">待我处理</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-ops-card border border-ops-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('pending')}
            className={cn(
              'px-4 py-1.5 rounded text-xs font-medium transition-colors',
              tab === 'pending'
                ? isBrandSupervisor
                  ? 'bg-emerald-500 text-white'
                  : 'bg-ops-accent text-ops-dark'
                : 'text-gray-400 hover:text-gray-200'
            )}
          >
            待{isFloorSupervisor ? '复核' : '确认'}
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-white/20 text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('processed')}
            className={cn(
              'px-4 py-1.5 rounded text-xs font-medium transition-colors',
              tab === 'processed'
                ? isBrandSupervisor
                  ? 'bg-emerald-500 text-white'
                  : 'bg-ops-accent text-ops-dark'
                : 'text-gray-400 hover:text-gray-200'
            )}
          >
            已处理
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-gray-500">
            通过 <span className="font-mono font-bold text-ops-success">{myApprovedFiltered}</span>
          </span>
          <span className="text-gray-500">
            退回 <span className="font-mono font-bold text-ops-danger">{myRejectedFiltered}</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : tab === 'pending' ? (
        attendanceList.length === 0 ? (
          <div className="text-sm text-gray-500 py-16 text-center border border-dashed border-ops-border rounded-xl">
            ✅ 暂无待{isFloorSupervisor ? '复核' : '确认'}记录
          </div>
        ) : (
          <div className="space-y-3">
            {attendanceList.map((a) => {
              const rejCount = getRejectionCount(a.id)
              const hasRejectionHistory = rejCount > 0
              return (
                <div
                  key={a.id}
                  className={cn(
                    'bg-ops-card border border-ops-border rounded-xl p-4 animate-fade-slide-in transition-all',
                    hasRejectionHistory && 'border-l-4 border-l-ops-danger bg-ops-danger/[0.03]'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-100 font-medium">{formatDate(a.date)}</span>
                      <span className={cn(
                        'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                        a.shift === 'morning' ? 'bg-blue-900/40 text-blue-300' : 'bg-orange-900/40 text-orange-300'
                      )}>
                        {SHIFT_LABELS[a.shift] || a.shift}
                      </span>
                      <span className="text-xs text-gray-500">{a.counterName}</span>
                      {hasRejectionHistory && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-ops-danger/15 text-ops-danger border border-ops-danger/30">
                          <ShieldAlert size={9} />
                          历史退回{rejCount}次
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
                      isBrandSupervisor ? 'bg-emerald-600/20 text-emerald-400' : 'badge-warning'
                    )}>
                      {isFloorSupervisor ? '待楼层复核' : '待品牌确认'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-ops-border flex items-center justify-center text-[10px] font-bold text-gray-300">
                      {a.staffName?.[0]}
                    </span>
                    <span className="text-sm text-gray-300">{a.staffName}</span>
                    {a.currentResponsible != null && RESPONSIBLE_NAMES[a.currentResponsible] && (
                      <span className="text-[10px] text-gray-500 ml-auto">
                        当前经手: {RESPONSIBLE_NAMES[a.currentResponsible]}
                      </span>
                    )}
                  </div>

                  {a.rejectedReason && (
                    <div className="text-xs text-ops-danger bg-ops-danger/10 rounded-lg px-2.5 py-1.5 mb-2 border border-ops-danger/20">
                      <span className="font-bold">上次退回原因: </span>
                      {a.rejectedReason}
                    </div>
                  )}

                  {renderHistory(a.id)}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleApprove(a.id)}
                      disabled={actioningId === a.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50',
                        isBrandSupervisor
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-ops-success/20 text-ops-success hover:bg-ops-success/30'
                      )}
                    >
                      <Check size={12} />
                      {actioningId === a.id ? '处理中...' : (isBrandSupervisor ? '确认通过' : '复核通过')}
                    </button>
                    {rejectingId !== a.id && (
                      <button
                        onClick={() => setRejectingId(a.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium bg-ops-danger/20 text-ops-danger hover:bg-ops-danger/30 transition-colors"
                      >
                        <XCircle size={12} />
                        退回
                      </button>
                    )}
                  </div>

                  {rejectingId === a.id && (
                    <div className="mt-3 p-3 bg-ops-dark border border-ops-danger/30 rounded-lg space-y-2">
                      <p className="text-[10px] text-ops-danger font-bold flex items-center gap-1">
                        <XCircle size={10} />
                        退回复核 - 请填写原因（必填，将通知柜长修正）
                      </p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="例如：考勤打卡时间与排班班次不符 / 缺少当日销售小票 / 签到时间异常(凌晨打卡)等..."
                        rows={2}
                        className="w-full bg-ops-card border border-ops-border rounded-lg px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-ops-danger/50 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(a.id)}
                          disabled={actioningId === a.id || !rejectReason.trim()}
                          className="px-4 py-1 rounded text-xs font-medium bg-ops-danger text-white hover:bg-ops-danger/90 transition-colors disabled:opacity-50"
                        >
                          {actioningId === a.id ? '提交中...' : '确认退回'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason('') }}
                          className="px-4 py-1 rounded text-xs font-medium bg-ops-border/50 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : processedItems.length === 0 ? (
        <div className="text-sm text-gray-500 py-16 text-center border border-dashed border-ops-border rounded-xl">
          暂无已处理记录
        </div>
      ) : (
        <div className="space-y-3">
          {processedItems.map((r) => (
            <div key={r.attendanceId} className={cn(
              'bg-ops-card border border-ops-border rounded-xl p-4 animate-fade-slide-in',
              r.action === 'reject' && 'border-l-4 border-l-ops-danger'
            )}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-100 font-medium">{formatDate(r.date)}</span>
                  <span className={cn(
                    'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                    r.shift === 'morning' ? 'bg-blue-900/40 text-blue-300' : 'bg-orange-900/40 text-orange-300'
                  )}>
                    {SHIFT_LABELS[r.shift] || r.shift}
                  </span>
                  <span className="text-xs text-gray-500">{r.counterName}</span>
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium',
                  r.action === 'approve' ? 'badge-success' : 'badge-danger'
                )}>
                  {r.action === 'approve' ? (isBrandSupervisor ? '已品牌确认' : '已复核通过') : '已退回'}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-ops-border flex items-center justify-center text-[10px] font-bold text-gray-300">
                  {r.staffName?.[0]}
                </span>
                <span className="text-sm text-gray-300">{r.staffName}</span>
              </div>

              {r.action === 'reject' && r.reason && (
                <div className="text-xs text-ops-danger bg-ops-danger/10 rounded-lg px-2.5 py-1.5 mb-2 border border-ops-danger/20">
                  <span className="font-bold">退回原因: </span>{r.reason}
                </div>
              )}

              {renderHistory(r.attendanceId)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

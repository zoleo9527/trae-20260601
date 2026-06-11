import { useEffect, useState, useCallback } from 'react'
import { Clock, AlertTriangle, CheckCircle, FileWarning, ArrowUpCircle, Filter, RefreshCcw, UserCheck, History as HistoryIcon } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
  id: number
  scheduleItemId: number
  staffId: number
  staffName: string
  counterId: number
  counterName: string
  date: string
  shift: string
  status: string
  currentResponsible: number | null
  deadline: string | null
  confirmedAt: string | null
  exceptionType: string | null
  exceptionNote: string | null
  rejectedReason: string | null
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '晚班',
}

const STATUS_LABELS: Record<string, string> = {
  submitted: '待审核下发',
  pending_confirm: '待确认',
  pending_material: '待补材料',
  timeout_escalated: '超时升级',
  pending_review: '待复核',
  review_rejected: '复核不通过',
  pending_brand_confirm: '待品牌确认',
  closed: '已闭环',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-ops-info/20 text-ops-info',
  pending_confirm: 'badge-warning',
  pending_material: 'bg-amber-600/20 text-amber-500',
  timeout_escalated: 'badge-danger',
  pending_review: 'bg-blue-600/20 text-blue-400',
  review_rejected: 'badge-danger',
  pending_brand_confirm: 'bg-purple-600/20 text-purple-400',
  closed: 'badge-success',
}

const FILTER_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'submitted', label: '待审核下发' },
  { value: 'pending_confirm', label: '待确认' },
  { value: 'pending_material', label: '待补材料' },
  { value: 'timeout_escalated', label: '超时升级' },
  { value: 'pending_review', label: '待复核' },
  { value: 'review_rejected', label: '复核不通过' },
  { value: 'pending_brand_confirm', label: '待品牌确认' },
  { value: 'closed', label: '已闭环' },
]

const STATS_STATUSES = ['pending_confirm', 'pending_material', 'timeout_escalated', 'review_rejected'] as const

const EXCEPTION_TYPES = [
  { value: 'material', label: '缺材料' },
  { value: 'other', label: '其他异常' },
]

const RESPONSIBLE_NAMES: Record<number, string> = {
  1: '王芳(柜长)',
  2: '张明(楼层)',
  3: '李红(品牌)',
  4: '陈丽(导购)',
  5: '赵敏(导购)',
  6: '刘洋(导购)',
  7: '周强(柜长)',
  8: '孙悦(柜长)',
  9: '吴雪(导购)',
  10: '郑伟(品牌)',
}

function getCountdown(deadline: string, nowTick: number) {
  const now = new Date(nowTick)
  const dl = new Date(deadline)
  const diff = dl.getTime() - now.getTime()
  if (diff <= 0) {
    const overdue = Math.ceil(Math.abs(diff) / (1000 * 60 * 60))
    return { text: `超${overdue > 24 ? Math.ceil(overdue / 24) + '天' : overdue + '时'}`, overdue: true, critical: true }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const critical = diff < 1000 * 60 * 60 * 4
  if (days > 0) return { text: `${days}天${hours}时`, overdue: false, critical }
  if (hours > 0) return { text: `${hours}时${mins}分`, overdue: false, critical }
  return { text: `${mins}分钟`, overdue: false, critical: true }
}

const PRIORITY_ORDER: Record<string, number> = {
  timeout_escalated: 0,
  review_rejected: 1,
  pending_material: 2,
  submitted: 2.5,
  pending_confirm: 3,
  pending_review: 4,
  pending_brand_confirm: 5,
  closed: 6,
}

export default function Attendance() {
  const { attendance, loading, fetchAttendance, confirmAttendance, markException, submitMaterial, escalateTimeout, resubmitAttendance, approveAttendanceSubmitted } = useDataStore()
  const user = useAuthStore((s) => s.user)
  const [statusFilter, setStatusFilter] = useState('')
  const [actioningId, setActioningId] = useState<number | null>(null)
  const [exceptionFormId, setExceptionFormId] = useState<number | null>(null)
  const [exceptionType, setExceptionType] = useState('material')
  const [exceptionNote, setExceptionNote] = useState('')
  const [nowTick, setNowTick] = useState(Date.now())

  const list = (attendance as AttendanceRecord[]) || []

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const loadData = useCallback(() => {
    const filters: Record<string, unknown> = {}
    if (statusFilter) filters.status = statusFilter
    if (user?.role === 'counter_manager' && user.counterId) {
      filters.counterId = user.counterId
    }
    if (user?.role === 'guide') {
      filters.staffId = user.id
    }
    fetchAttendance(filters)
  }, [fetchAttendance, statusFilter, user])

  useEffect(() => { loadData() }, [loadData])

  const handleConfirm = async (id: number) => {
    if (!user) return
    setActioningId(id)
    try {
      await confirmAttendance(id, user.id)
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const handleMarkException = async (id: number) => {
    if (!user || !exceptionNote.trim()) return
    setActioningId(id)
    try {
      await markException(id, user.id, exceptionType, exceptionNote.trim())
      setExceptionFormId(null)
      setExceptionNote('')
      setExceptionType('material')
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const handleSubmitMaterial = async (id: number) => {
    if (!user) return
    setActioningId(id)
    try {
      await submitMaterial(id, user.id)
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const handleEscalate = async (id: number) => {
    if (!user) return
    setActioningId(id)
    try {
      await escalateTimeout(id, user.id)
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const handleResubmit = async (id: number) => {
    if (!user) return
    setActioningId(id)
    try {
      await resubmitAttendance(id, user.id)
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const handleApproveSubmitted = async (id: number) => {
    if (!user) return
    setActioningId(id)
    try {
      await approveAttendanceSubmitted(id, user.id)
      await loadData()
    } finally {
      setActioningId(null)
    }
  }

  const sortedAttendance = [...list].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.status] ?? 99
    const pb = PRIORITY_ORDER[b.status] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  const statsMap: Record<string, number> = {}
  STATS_STATUSES.forEach((s) => {
    statsMap[s] = list.filter((a) => a.status === s).length
  })

  const totalCritical = statsMap['timeout_escalated'] + statsMap['review_rejected']

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
  }

  const getResponsibleLabel = (a: AttendanceRecord) => {
    if (a.currentResponsible == null) return null
    if (RESPONSIBLE_NAMES[a.currentResponsible]) return RESPONSIBLE_NAMES[a.currentResponsible]
    return a.staffName + '(本人)'
  }

  const canConfirm = (a: AttendanceRecord) => a.status === 'pending_confirm' && user != null && (user.role === 'counter_manager' || user.role === 'guide')
  const canMarkException = (a: AttendanceRecord) => a.status === 'pending_confirm' && user != null && (user.role === 'counter_manager' || user.role === 'guide')
  const canSubmitMaterial = (a: AttendanceRecord) => a.status === 'pending_material' && user != null && (user.role === 'guide' || user.role === 'counter_manager')
  const canEscalate = (a: AttendanceRecord) => a.status === 'timeout_escalated' && user != null && user.role === 'floor_supervisor'
  const canResubmit = (a: AttendanceRecord) => a.status === 'review_rejected' && user != null && user.role === 'counter_manager' && (user.counterId === a.counterId)
  const canApproveSubmitted = (a: AttendanceRecord) => a.status === 'submitted' && user != null && user.role === 'counter_manager' && (user.counterId === a.counterId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="text-ops-accent" size={20} />
          <h2 className="text-lg font-bold">考勤确认台</h2>
          {user?.role === 'counter_manager' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
              仅本专柜数据
            </span>
          )}
          {user?.role === 'guide' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
              仅本人考勤
            </span>
          )}
          {user?.role === 'floor_supervisor' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-600/30">
              全楼层视图
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

      {totalCritical > 0 && (
        <div className="mb-5 p-3 rounded-lg bg-ops-danger/10 border border-ops-danger/30 flex items-center gap-3">
          <AlertTriangle size={16} className="text-ops-danger animate-pulse-red shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-ops-danger mb-0.5">
              ⚠ 有 {totalCritical} 项紧急事项待处理
            </p>
            <p className="text-[10px] text-gray-500">
              超时升级 {statsMap['timeout_escalated'] || 0} 项 · 复核不通过 {statsMap['review_rejected'] || 0} 项
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-gray-500" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-ops-card border border-ops-border rounded px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-ops-accent transition-colors"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-[10px] text-gray-500 ml-auto">
          共 {sortedAttendance.length} 条记录
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {STATS_STATUSES.map((s) => (
          <div key={s} className={cn(
            'rounded-lg px-3 py-2.5 text-center border transition-all',
            (s === 'timeout_escalated' || s === 'review_rejected') && statsMap[s] > 0
              ? 'bg-ops-danger/5 border-ops-danger/40 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
              : s === 'pending_material' && statsMap[s] > 0
                ? 'bg-ops-accent/5 border-ops-accent/30'
                : 'bg-ops-card border-ops-border'
          )}>
            <p className="text-[10px] text-gray-500 mb-1">{STATUS_LABELS[s]}</p>
            <p className={cn(
              'text-lg font-bold font-mono',
              s === 'timeout_escalated' || s === 'review_rejected'
                ? statsMap[s] > 0 ? 'text-ops-danger animate-pulse-red' : 'text-gray-400'
                : s === 'pending_material'
                  ? statsMap[s] > 0 ? 'text-ops-accent' : 'text-gray-400'
                  : 'text-gray-200'
            )}>
              {statsMap[s] || 0}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : sortedAttendance.length === 0 ? (
        <div className="text-sm text-gray-500 py-12 text-center border border-dashed border-ops-border rounded-lg">
          暂无考勤数据
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAttendance.map((a) => {
            const isTimeout = a.status === 'timeout_escalated'
            const isPendingMaterial = a.status === 'pending_material'
            const isRejected = a.status === 'review_rejected'
            const isSubmitted = a.status === 'submitted'
            const countdown = a.deadline ? getCountdown(a.deadline, nowTick) : null
            const responsible = getResponsibleLabel(a)
            const isMine = user?.role === 'counter_manager' && (a.currentResponsible === user.id || (isRejected && a.counterId === user.counterId) || (isSubmitted && a.counterId === user.counterId))

            return (
              <div
                key={a.id}
                className={cn(
                  'bg-ops-card border border-ops-border rounded-lg overflow-hidden animate-fade-slide-in transition-all',
                  isTimeout && 'border-ops-danger/60 shadow-[0_0_24px_rgba(239,68,68,0.1)]',
                  isRejected && 'border-l-4 border-l-ops-danger',
                  isSubmitted && 'border-l-4 border-l-ops-info',
                  isPendingMaterial && countdown?.critical && 'border-l-4 border-l-ops-accent',
                  isMine && (isTimeout || isRejected) && 'ring-1 ring-ops-danger/30',
                )}
              >
                <div className="p-4">
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
                    </div>
                    <div className="flex items-center gap-2">
                      {(isTimeout || (isRejected)) && <span className="w-2 h-2 rounded-full bg-ops-danger animate-pulse-red shrink-0" />}
                      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[a.status] || 'badge-warning')}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-ops-border flex items-center justify-center text-[10px] font-bold text-gray-300">
                      {a.staffName?.[0]}
                    </span>
                    <span className="text-sm text-gray-300">{a.staffName}</span>
                    {responsible && (
                      <div className="flex items-center gap-1 ml-auto">
                        <UserCheck size={10} className="text-gray-500" />
                        <span className={cn(
                          'text-[10px]',
                          isMine ? 'text-ops-danger font-bold' : 'text-gray-500'
                        )}>
                          责任人: {responsible}
                        </span>
                      </div>
                    )}
                  </div>

                  {countdown && (
                    <div className="flex items-center gap-2 mb-2">
                      <HistoryIcon size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500">时效:</span>
                      <span className={cn(
                        'text-xs font-mono font-bold',
                        countdown.overdue
                          ? 'text-ops-danger animate-pulse-red'
                          : countdown.critical
                            ? 'text-ops-accent'
                            : 'text-gray-300'
                      )}>
                        {countdown.text}
                      </span>
                    </div>
                  )}

                  {a.exceptionNote && (
                    <div className="text-xs text-ops-accent bg-ops-accent/10 rounded px-2 py-1 mb-2 flex items-start gap-1.5">
                      <FileWarning size={11} className="shrink-0 mt-0.5" />
                      <span>{a.exceptionNote}</span>
                    </div>
                  )}

                  {isRejected && a.rejectedReason && (
                    <div className="text-xs text-ops-danger bg-ops-danger/10 rounded px-2 py-1 mb-2 flex items-start gap-1.5">
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">退回原因: </span>
                        <span>{a.rejectedReason}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-ops-border/50">
                    {canApproveSubmitted(a) && (
                      <button
                        onClick={() => handleApproveSubmitted(a.id)}
                        disabled={actioningId === a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-ops-info/20 text-ops-info hover:bg-ops-info/30 transition-colors disabled:opacity-50 border border-ops-info/30"
                      >
                        <CheckCircle size={12} />
                        {actioningId === a.id ? '下发中...' : '审核下发'}
                      </button>
                    )}

                    {canConfirm(a) && (
                      <button
                        onClick={() => handleConfirm(a.id)}
                        disabled={actioningId === a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-ops-success/20 text-ops-success hover:bg-ops-success/30 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={12} />
                        {actioningId === a.id ? '确认中...' : '确认考勤'}
                      </button>
                    )}

                    {canMarkException(a) && exceptionFormId !== a.id && (
                      <button
                        onClick={() => setExceptionFormId(a.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-ops-accent/20 text-ops-accent hover:bg-ops-accent/30 transition-colors"
                      >
                        <AlertTriangle size={12} />
                        标记异常
                      </button>
                    )}

                    {canSubmitMaterial(a) && (
                      <button
                        onClick={() => handleSubmitMaterial(a.id)}
                        disabled={actioningId === a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-ops-info/20 text-ops-info hover:bg-ops-info/30 transition-colors disabled:opacity-50"
                      >
                        <FileWarning size={12} />
                        {actioningId === a.id ? '提交中...' : '补交材料'}
                      </button>
                    )}

                    {canEscalate(a) && (
                      <button
                        onClick={() => handleEscalate(a.id)}
                        disabled={actioningId === a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-ops-danger/20 text-ops-danger hover:bg-ops-danger/30 transition-colors disabled:opacity-50"
                      >
                        <ArrowUpCircle size={12} />
                        {actioningId === a.id ? '处理中...' : '代确认(解除超时)'}
                      </button>
                    )}

                    {canResubmit(a) && (
                      <button
                        onClick={() => handleResubmit(a.id)}
                        disabled={actioningId === a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-ops-accent/20 text-ops-accent hover:bg-ops-accent/30 transition-colors disabled:opacity-50 border border-ops-accent/30"
                      >
                        <RefreshCcw size={12} />
                        {actioningId === a.id ? '提交中...' : '修正重提'}
                      </button>
                    )}

                    {isRejected && !canResubmit(a) && user?.role === 'counter_manager' && (
                      <span className="text-[10px] text-gray-600 italic">非本专柜记录</span>
                    )}
                    {isRejected && user?.role === 'guide' && (
                      <span className="text-[10px] text-gray-600 italic">等待柜长修正重提</span>
                    )}
                    {isTimeout && user?.role !== 'floor_supervisor' && (
                      <span className="text-[10px] text-ops-danger italic">等待楼层主管处理</span>
                    )}
                    {isPendingMaterial && !canSubmitMaterial(a) && user?.role === 'counter_manager' && (
                      <span className="text-[10px] text-gray-600 italic">等待导购补交材料</span>
                    )}
                    {isSubmitted && user?.role === 'counter_manager' && !canApproveSubmitted(a) && (
                      <span className="text-[10px] text-gray-600 italic">非本专柜记录</span>
                    )}
                    {isSubmitted && user?.role === 'guide' && (
                      <span className="text-[10px] text-gray-600 italic">等待柜长审核下发</span>
                    )}
                  </div>

                  {exceptionFormId === a.id && (
                    <div className="mt-3 p-3 bg-ops-dark border border-ops-border rounded-lg space-y-2">
                      <p className="text-[10px] text-gray-500 font-bold mb-1">标记考勤异常</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={exceptionType}
                          onChange={(e) => setExceptionType(e.target.value)}
                          className="bg-ops-card border border-ops-border rounded px-2 py-1 text-xs text-gray-200 outline-none shrink-0"
                        >
                          {EXCEPTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={exceptionNote}
                          onChange={(e) => setExceptionNote(e.target.value)}
                          placeholder="请输入异常说明（必填）"
                          className="flex-1 bg-ops-card border border-ops-border rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-ops-accent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkException(a.id)}
                          disabled={actioningId === a.id || !exceptionNote.trim()}
                          className="px-3 py-1 rounded text-xs font-medium bg-ops-accent/20 text-ops-accent hover:bg-ops-accent/30 transition-colors disabled:opacity-50"
                        >
                          确认标记
                        </button>
                        <button
                          onClick={() => {
                            setExceptionFormId(null)
                            setExceptionNote('')
                            setExceptionType('material')
                          }}
                          className="px-3 py-1 rounded text-xs font-medium bg-ops-border/50 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

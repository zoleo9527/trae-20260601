import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, FileWarning, ArrowUpCircle, Clock, XCircle, PackageOpen, RefreshCcw, UserCheck, History as HistoryIcon, Flame } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface ExceptionRecord {
  id: number
  staffId: number
  staffName: string
  counterId: number
  counterName: string
  date: string
  shift: string
  status: string
  currentResponsible: number
  deadline: string | null
  exceptionType: string | null
  exceptionNote: string | null
  rejectedReason: string | null
  isOverdue: boolean
}

const SHIFT_LABELS: Record<string, string> = { morning: '早班', afternoon: '晚班' }

const RESPONSIBLE_NAMES: Record<number, string> = {
  1: '王芳(柜长)', 2: '张明(楼层)', 3: '李红(品牌)',
  4: '陈丽(导购)', 5: '赵敏(导购)', 6: '刘洋(导购)',
  7: '周强(柜长)', 8: '孙悦(柜长)', 9: '吴雪(导购)', 10: '郑伟(品牌)',
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof PackageOpen; accent: string; glow: string; border: string; badge: string; urgency: number }> = {
  pending_material: {
    label: '缺材料',
    icon: PackageOpen,
    accent: 'text-ops-accent',
    glow: 'shadow-amber-500/10',
    border: 'border-l-ops-accent',
    badge: 'bg-ops-accent/20 text-ops-accent',
    urgency: 2,
  },
  timeout_escalated: {
    label: '超时升级',
    icon: Flame,
    accent: 'text-ops-danger',
    glow: 'shadow-red-500/20',
    border: 'border-l-ops-danger',
    badge: 'bg-ops-danger/20 text-ops-danger',
    urgency: 0,
  },
  review_rejected: {
    label: '复核不通过',
    icon: XCircle,
    accent: 'text-ops-danger',
    glow: 'shadow-red-500/15',
    border: 'border-l-ops-danger',
    badge: 'bg-ops-danger/20 text-ops-danger',
    urgency: 1,
  },
}

const FILTER_TABS = [
  { value: '', label: '全部异常' },
  { value: 'timeout_escalated', label: '超时升级' },
  { value: 'review_rejected', label: '复核不通过' },
  { value: 'pending_material', label: '缺材料' },
]

const STAT_CARDS = [
  { key: 'timeout_escalated', label: '超时升级', icon: Flame, accent: 'text-ops-danger', numberColor: 'text-ops-danger', glow: 'shadow-[0_0_40px_rgba(239,68,68,0.25)]', iconBg: 'bg-ops-danger/15 border border-ops-danger/30', critical: true },
  { key: 'review_rejected', label: '复核不通过', icon: XCircle, accent: 'text-ops-danger', numberColor: 'text-ops-danger', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.18)]', iconBg: 'bg-ops-danger/10 border border-ops-danger/25', critical: true },
  { key: 'pending_material', label: '缺材料待补', icon: PackageOpen, accent: 'text-ops-accent', numberColor: 'text-ops-accent', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.12)]', iconBg: 'bg-ops-accent/10 border border-ops-accent/25', critical: false },
]

function getCountdown(deadline: string, nowTick: number) {
  const now = new Date(nowTick)
  const dl = new Date(deadline)
  const diff = dl.getTime() - now.getTime()
  if (diff <= 0) {
    const absMs = Math.abs(diff)
    const hours = Math.floor(absMs / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    const h = hours % 24
    if (days > 0) return { text: `超${days}天${h}时`, overdue: true, critical: true }
    return { text: `超${hours}时`, overdue: true, critical: true }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const critical = diff < 1000 * 60 * 60 * 8
  if (days > 0) return { text: `${days}天${hours}时`, overdue: false, critical }
  if (hours > 0) return { text: `${hours}时${mins}分`, overdue: false, critical }
  return { text: `${mins}分钟`, overdue: false, critical: true }
}

export default function Exceptions() {
  const user = useAuthStore((s) => s.user)
  const { exceptions, exceptionStats, loading, fetchExceptions, fetchExceptionStats, submitMaterial, escalateTimeout, resubmitAttendance } = useDataStore()
  const [typeFilter, setTypeFilter] = useState('')
  const [actioningId, setActioningId] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const exceptionList = (exceptions as ExceptionRecord[]) || []

  const loadData = useCallback(() => {
    const filters: Record<string, unknown> = {}
    if (typeFilter) filters.type = typeFilter
    if (user?.role === 'counter_manager' && user.counterId) {
      filters.counterId = user.counterId
    }
    fetchExceptions(filters)
    fetchExceptionStats()
  }, [typeFilter, user, fetchExceptions, fetchExceptionStats])

  useEffect(() => { loadData() }, [loadData])

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

  const totalCritical = (exceptionStats.timeout_escalated || 0) + (exceptionStats.review_rejected || 0)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
  }

  const getExceptionDescription = (e: ExceptionRecord) => {
    if (e.status === 'pending_material' && e.exceptionNote) return e.exceptionNote
    if (e.status === 'timeout_escalated') return e.exceptionNote || '柜长未在T+1 10:00前确认，已自动升级至楼层主管'
    if (e.status === 'review_rejected' && e.rejectedReason) return e.rejectedReason
    return ''
  }

  const getResponsibleLabel = (e: ExceptionRecord) => {
    if (RESPONSIBLE_NAMES[e.currentResponsible]) return RESPONSIBLE_NAMES[e.currentResponsible]
    return e.staffName + '(本人)'
  }

  const sorted = [...exceptionList].sort((a, b) => {
    const ua = TYPE_CONFIG[a.status]?.urgency ?? 99
    const ub = TYPE_CONFIG[b.status]?.urgency ?? 99
    if (ua !== ub) return ua - ub
    const da = a.deadline ? new Date(a.deadline).getTime() : 0
    const db = b.deadline ? new Date(b.deadline).getTime() : 0
    return da - db
  })

  const canSubmitMaterial = (e: ExceptionRecord) =>
    e.status === 'pending_material' && user != null && (user.role === 'guide' || user.role === 'counter_manager')
  const canEscalate = (e: ExceptionRecord) =>
    e.status === 'timeout_escalated' && user?.role === 'floor_supervisor'
  const canResubmit = (e: ExceptionRecord) =>
    e.status === 'review_rejected' && user?.role === 'counter_manager' && user.counterId === e.counterId

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-ops-danger" size={20} />
          <h2 className="text-lg font-bold">异常驾驶舱</h2>
          {user?.role === 'counter_manager' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
              仅本专柜异常
            </span>
          )}
          {user?.role === 'floor_supervisor' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-600/30">
              全楼层异常
            </span>
          )}
          {user?.role === 'guide' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
              仅与我相关
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
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-ops-danger/15 via-ops-danger/8 to-transparent border border-ops-danger/40 flex items-start gap-4 shadow-[0_0_40px_rgba(239,68,68,0.08)]">
          <div className="w-10 h-10 rounded-lg bg-ops-danger/20 flex items-center justify-center shrink-0">
            <Flame size={20} className="text-ops-danger animate-pulse-red" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-ops-danger mb-1">
              🚨 紧急异常 {totalCritical} 项 — 需要立即介入
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              超时升级 {exceptionStats.timeout_escalated || 0} 项需楼层主管代确认，
              复核不通过 {exceptionStats.review_rejected || 0} 项需柜长修正后重提。
              时效正在倒计时，请优先处理。
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-mono font-bold text-ops-danger animate-pulse-red">
              {totalCritical}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">项待紧急处理</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {STAT_CARDS.map((card) => {
          const count = exceptionStats[card.key] || 0
          const Icon = card.icon
          const shouldPulse = card.critical && count > 0
          return (
            <div
              key={card.key}
              className={cn(
                'relative rounded-xl p-5 text-center border transition-all',
                count > 0
                  ? cn('bg-ops-card border-ops-border/60 shadow-lg', card.glow)
                  : 'bg-ops-card/50 border-ops-border/30 opacity-70'
              )}
            >
              <div className={cn('w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center', card.iconBg)}>
                <Icon size={20} className={cn(card.accent, shouldPulse && 'animate-pulse-red')} />
              </div>
              <p className={cn(
                'text-3xl font-mono font-bold tracking-tight',
                count > 0 ? card.numberColor : 'text-gray-600',
                shouldPulse && 'animate-pulse-red'
              )}>
                {count}
              </p>
              <p className="text-xs text-gray-500 mt-1.5">{card.label}</p>
              {count > 0 && card.critical && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-ops-danger animate-pulse-red" />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-ops-card border border-ops-border rounded-lg p-1 w-fit">
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                typeFilter === t.value
                  ? t.value === '' || t.value === 'pending_material'
                    ? 'bg-ops-accent text-ops-dark'
                    : 'bg-ops-danger text-white'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-500">
          共 {sorted.length} 条异常记录
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : sorted.length === 0 ? (
        <div className="text-sm text-gray-500 py-16 text-center border border-dashed border-ops-border rounded-xl">
          ✨ 无异常记录，一切正常
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((e) => {
            const config = TYPE_CONFIG[e.status]
            const description = getExceptionDescription(e)
            const countdown = e.deadline ? getCountdown(e.deadline, nowTick) : null
            const responsible = getResponsibleLabel(e)
            const isMyResponsibility = user && (
              (user.role === 'floor_supervisor' && e.currentResponsible === 2) ||
              (user.role === 'counter_manager' && e.currentResponsible === user.id) ||
              (user.role === 'guide' && e.currentResponsible === user.id) ||
              (e.status === 'review_rejected' && user?.role === 'counter_manager' && user.counterId === e.counterId)
            )

            return (
              <div
                key={e.id}
                className={cn(
                  'bg-ops-card border border-ops-border rounded-xl overflow-hidden animate-fade-slide-in transition-all',
                  e.status === 'timeout_escalated' && 'border-ops-danger/50 shadow-[0_0_30px_rgba(239,68,68,0.12)]',
                  isMyResponsibility && 'ring-1 ring-ops-accent/40',
                )}
              >
                <div className={cn('border-l-4 p-4', config?.border || 'border-l-ops-border')}>
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {config && (
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold', config.badge)}>
                          <config.icon size={10} />
                          {config.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                      <span className={cn(
                        'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                        e.shift === 'morning' ? 'bg-blue-900/40 text-blue-300' : 'bg-orange-900/40 text-orange-300'
                      )}>
                        {SHIFT_LABELS[e.shift] || e.shift}
                      </span>
                      <span className="text-xs text-gray-500">{e.counterName}</span>
                      {isMyResponsibility && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-ops-accent/15 text-ops-accent border border-ops-accent/30 font-bold">
                          需我处理
                        </span>
                      )}
                    </div>
                    {(countdown?.overdue || e.status === 'timeout_escalated') && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold badge-danger animate-pulse-red">
                        <Clock size={9} />
                        {countdown?.overdue ? countdown.text : '紧急'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-7 h-7 rounded-full bg-ops-border flex items-center justify-center text-[11px] font-bold text-gray-300">
                      {e.staffName?.[0]}
                    </span>
                    <span className="text-sm text-gray-200 font-medium">{e.staffName}</span>
                  </div>

                  {description && (
                    <div className={cn(
                      'text-xs rounded-lg px-3 py-2 mb-3 leading-relaxed',
                      e.status === 'pending_material' ? 'bg-ops-accent/10 text-ops-accent border border-ops-accent/20' : 'bg-ops-danger/10 text-ops-danger border border-ops-danger/20'
                    )}>
                      {e.status === 'review_rejected' ? (
                        <>
                          <span className="font-bold">复核退回: </span>
                          <span>{description}</span>
                        </>
                      ) : e.status === 'timeout_escalated' ? (
                        <>
                          <span className="font-bold">升级原因: </span>
                          <span>{description}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold">缺材料: </span>
                          <span>{description}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <UserCheck size={11} className="text-gray-500" />
                      <span className="text-gray-500">当前责任人:</span>
                      <span className={cn(
                        'font-mono font-bold',
                        isMyResponsibility ? 'text-ops-accent' : 'text-gray-300'
                      )}>
                        {responsible}
                      </span>
                    </div>

                    {countdown && (
                      <div className="flex items-center gap-1.5">
                        <HistoryIcon size={11} className="text-gray-500" />
                        <span className="text-gray-500">时效:</span>
                        <span className={cn(
                          'font-mono font-bold',
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
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-3.5 pt-3 border-t border-ops-border/50">
                    {canSubmitMaterial(e) && (
                      <button
                        onClick={() => handleSubmitMaterial(e.id)}
                        disabled={actioningId === e.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-ops-info/20 text-ops-info hover:bg-ops-info/30 transition-colors disabled:opacity-50"
                      >
                        <FileWarning size={12} />
                        {actioningId === e.id ? '提交中...' : '已补交材料'}
                      </button>
                    )}
                    {canEscalate(e) && (
                      <button
                        onClick={() => handleEscalate(e.id)}
                        disabled={actioningId === e.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-ops-danger/20 text-ops-danger hover:bg-ops-danger/30 transition-colors disabled:opacity-50 border border-ops-danger/30"
                      >
                        <ArrowUpCircle size={12} />
                        {actioningId === e.id ? '处理中...' : '代确认并解除超时'}
                      </button>
                    )}
                    {canResubmit(e) && (
                      <button
                        onClick={() => handleResubmit(e.id)}
                        disabled={actioningId === e.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-ops-accent/20 text-ops-accent hover:bg-ops-accent/30 transition-colors disabled:opacity-50 border border-ops-accent/30"
                      >
                        <RefreshCcw size={12} />
                        {actioningId === e.id ? '提交中...' : '修正后重提复核'}
                      </button>
                    )}
                    {e.status === 'timeout_escalated' && user?.role !== 'floor_supervisor' && (
                      <span className="text-[10px] text-ops-danger italic">等待楼层主管代确认</span>
                    )}
                    {e.status === 'review_rejected' && user?.role === 'guide' && (
                      <span className="text-[10px] text-gray-500 italic">等待柜长核查修正</span>
                    )}
                    {e.status === 'pending_material' && !canSubmitMaterial(e) && (
                      <span className="text-[10px] text-gray-500 italic">等待导购补交材料</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

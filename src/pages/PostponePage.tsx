import { ReservationBadge, SampleBadge } from '@/components/StatusBadge'
import { useStore } from '@/store/useStore'
import type { PostponeOutcome, Reservation } from '@/types'
import { fmtDateTime, fmtTime } from '@/utils/time'
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FlaskConical,
  History,
  X,
  XCircle,
} from 'lucide-react'
import { format, parseISO, setHours, setMinutes } from 'date-fns'
import { useMemo, useState } from 'react'

const FILTER_TABS: { label: string; value: PostponeOutcome | null; icon: React.ElementType }[] = [
  { label: '全部', value: null, icon: History },
  { label: '待处理', value: 'pending', icon: Clock },
  { label: '已顺延', value: 'postponed', icon: CheckCircle2 },
  { label: '已取消', value: 'cancelled', icon: XCircle },
]

export default function PostponePage() {
  const {
    reservations,
    instruments,
    samples,
    downtimes,
    currentRole,
    confirmPostpone,
    cancelPostponed,
  } = useStore()

  const [filter, setFilter] = useState<PostponeOutcome | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)

  const isAdmin = currentRole === 'admin'

  const postponedReservations = useMemo(() => {
    return reservations
      .filter((r) => r.postponeRecord)
      .filter((r) => !filter || r.postponeRecord?.outcome === filter)
      .sort((a, b) => {
        const aPending = a.postponeRecord?.outcome === 'pending' ? 0 : 1
        const bPending = b.postponeRecord?.outcome === 'pending' ? 0 : 1
        if (aPending !== bPending) return aPending - bPending
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      })
  }, [reservations, filter])

  const counts = useMemo(() => {
    const list = reservations.filter((r) => r.postponeRecord)
    return {
      total: list.length,
      pending: list.filter((r) => r.postponeRecord?.outcome === 'pending').length,
      postponed: list.filter((r) => r.postponeRecord?.outcome === 'postponed').length,
      cancelled: list.filter((r) => r.postponeRecord?.outcome === 'cancelled').length,
    }
  }, [reservations])

  const getInstrumentName = (id: string) =>
    instruments.find((i) => i.id === id)?.name || id

  const getInstrumentCode = (id: string) =>
    instruments.find((i) => i.id === id)?.code || id

  const getAffectedSamples = (reservationId: string) => {
    return samples.filter((s) => s.reservationId === reservationId)
  }

  const findNextAvailableSlot = (res: Reservation): { start: Date; end: Date } | null => {
    const originalStart = parseISO(res.startTime)
    const originalEnd = parseISO(res.endTime)
    const durationMs = originalEnd.getTime() - originalStart.getTime()

    const approved = reservations.filter(
      (r) => r.id !== res.id && r.status === 'approved' && r.instrumentId === res.instrumentId
    )

    let candidateStart = new Date()
    candidateStart = setHours(candidateStart, Math.max(candidateStart.getHours() + 1, 9))
    candidateStart = setMinutes(candidateStart, 0)

    for (let day = 0; day < 30; day++) {
      for (let hour = 8; hour <= 20; hour++) {
        let checkStart = new Date(candidateStart)
        checkStart.setDate(checkStart.getDate() + day)
        checkStart = setHours(checkStart, hour)
        checkStart = setMinutes(checkStart, 0)
        const checkEnd = new Date(checkStart.getTime() + durationMs)

        let conflict = false
        for (const r of approved) {
          const rs = new Date(r.startTime).getTime()
          const re = new Date(r.endTime).getTime()
          if (checkStart.getTime() < re && checkEnd.getTime() > rs) {
            conflict = true
            break
          }
        }

        if (!conflict) {
          return { start: checkStart, end: checkEnd }
        }
      }
    }
    return null
  }

  const handleAutoSchedule = (res: Reservation) => {
    const slot = findNextAvailableSlot(res)
    if (slot) {
      setNewStartTime(format(slot.start, "yyyy-MM-dd'T'HH:mm"))
      setNewEndTime(format(slot.end, "yyyy-MM-dd'T'HH:mm"))
    } else {
      alert('未来30天内未找到可用时段，请手动选择')
    }
  }

  const handleConfirm = (id: string) => {
    if (!newStartTime || !newEndTime) {
      alert('请选择新的时段')
      return
    }
    const start = new Date(newStartTime).toISOString()
    const end = new Date(newEndTime).toISOString()
    confirmPostpone(id, start, end)
    setSelectedId(null)
    setNewStartTime('')
    setNewEndTime('')
  }

  const handleCancelClick = (id: string) => {
    setCancelTargetId(id)
    setCancelNote('')
    setShowCancelModal(true)
  }

  const handleConfirmCancel = () => {
    if (!cancelTargetId) return
    cancelPostponed(cancelTargetId, cancelNote || undefined)
    setShowCancelModal(false)
    setCancelTargetId(null)
    setCancelNote('')
  }

  const handleBatchAuto = () => {
    if (!isAdmin) return
    const pending = postponedReservations.filter((r) => r.postponeRecord?.outcome === 'pending')
    if (pending.length === 0) {
      alert('没有待处理的顺延预约')
      return
    }
    if (!confirm(`将为 ${pending.length} 条待处理顺延预约自动安排最早可用时段，确认继续？`)) return

    for (const res of pending) {
      const slot = findNextAvailableSlot(res)
      if (slot) {
        confirmPostpone(res.id, slot.start.toISOString(), slot.end.toISOString())
      }
    }
  }

  const getOutcomeColor = (outcome: PostponeOutcome) => {
    switch (outcome) {
      case 'pending':
        return 'border-amber-900/30 bg-amber-950/10'
      case 'postponed':
        return 'border-emerald-900/30 bg-emerald-950/10'
      case 'cancelled':
        return 'border-zinc-700/50 bg-zinc-900/30'
    }
  }

  const getOutcomeLabel = (outcome: PostponeOutcome) => {
    switch (outcome) {
      case 'pending':
        return '待处理'
      case 'postponed':
        return '已顺延'
      case 'cancelled':
        return '已取消'
    }
  }

  const getOutcomeBadge = (outcome: PostponeOutcome) => {
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium'
    switch (outcome) {
      case 'pending':
        return (
          <span className={`${base} bg-amber-500/15 text-amber-400`}>
            <Clock size={10} /> 待处理
          </span>
        )
      case 'postponed':
        return (
          <span className={`${base} bg-emerald-500/15 text-emerald-400`}>
            <CheckCircle2 size={10} /> 已顺延
          </span>
        )
      case 'cancelled':
        return (
          <span className={`${base} bg-zinc-500/15 text-zinc-400`}>
            <XCircle size={10} /> 已取消
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">顺延处理</h2>
          <p className="text-xs text-zinc-500 mt-1">
            因故障停机或调度变更受影响的预约处理记录。关联样本去向和处置结果持续可追溯。
          </p>
        </div>
        {isAdmin && counts.pending > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleBatchAuto}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
            >
              <Clock size={14} />
              批量自动顺延 ({counts.pending})
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 bg-[#12122a] rounded-lg p-1 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon
          const count =
            tab.value === null
              ? counts.total
              : tab.value === 'pending'
                ? counts.pending
                : tab.value === 'postponed'
                  ? counts.postponed
                  : counts.cancelled
          return (
            <button
              key={tab.label}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon size={12} />
              {tab.label}
              <span
                className={`ml-0.5 text-[10px] ${
                  filter === tab.value ? 'text-white/70' : 'text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {postponedReservations.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          <CalendarClock size={48} className="mx-auto mb-3 opacity-40" />
          当前没有{filter ? `「${getOutcomeLabel(filter)}」` : ''}顺延处理记录
        </div>
      ) : (
        <div className="space-y-4">
          {postponedReservations.map((res) => {
            const affectedSamples = getAffectedSamples(res.id)
            const outcome = res.postponeRecord!.outcome
            const isPending = outcome === 'pending'
            const isExpanded = selectedId === res.id

            return (
              <div
                key={res.id}
                className={`rounded-lg border overflow-hidden ${getOutcomeColor(outcome)}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                        <span className="text-sm font-medium text-zinc-200">
                          {getInstrumentName(res.instrumentId)}
                        </span>
                        <span className="text-[10px] text-zinc-600 mono">
                          {getInstrumentCode(res.instrumentId)}
                        </span>
                        {getOutcomeBadge(outcome)}
                        <ReservationBadge status={res.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                        <div>
                          <span className="text-zinc-500">原时段：</span>
                          <span className="text-zinc-300 mono">
                            {fmtDateTime(res.postponeRecord!.originalStartTime)} ~{' '}
                            {fmtTime(res.postponeRecord!.originalEndTime)}
                          </span>
                        </div>
                        {res.postponeRecord!.newStartTime && (
                          <div>
                            <span className="text-zinc-500">新时段：</span>
                            <span className="text-emerald-400 mono">
                              {fmtDateTime(res.postponeRecord!.newStartTime)} ~{' '}
                              {fmtTime(res.postponeRecord!.newEndTime!)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-500">申请人：</span>
                          <span className="text-zinc-300">{res.userName}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">课题组：</span>
                          <span className="text-zinc-400">{res.userGroup}</span>
                        </div>
                      </div>

                      <div className="text-xs mb-1">
                        <span className="text-zinc-500">顺延原因：</span>
                        <span className="text-amber-400/80">{res.postponeRecord!.reason}</span>
                      </div>

                      <div className="text-xs mb-1">
                        <span className="text-zinc-500">处置说明：</span>
                        <span
                          className={
                            outcome === 'cancelled'
                              ? 'text-zinc-400'
                              : outcome === 'postponed'
                                ? 'text-emerald-400/80'
                                : 'text-yellow-400/70'
                          }
                        >
                          {res.postponeRecord!.dispositionNote}
                        </span>
                      </div>

                      <div className="text-xs">
                        <span className="text-zinc-500">申请理由：</span>
                        <span className="text-zinc-400">{res.reason}</span>
                      </div>

                      {res.postponeRecord!.handledAt && (
                        <div className="text-[10px] text-zinc-600 mt-2">
                          处理时间：{fmtDateTime(res.postponeRecord!.handledAt)}
                        </div>
                      )}
                    </div>

                    {isAdmin && isPending && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedId(isExpanded ? null : res.id)
                            if (!isExpanded) {
                              handleAutoSchedule(res)
                            } else {
                              setNewStartTime('')
                              setNewEndTime('')
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            isExpanded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          }`}
                        >
                          <Check size={14} />
                          安排顺延
                        </button>
                        <button
                          onClick={() => handleCancelClick(res.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                        >
                          <X size={14} />
                          取消预约
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {affectedSamples.length > 0 && (
                  <div
                    className={`border-t px-4 py-3 ${
                      outcome === 'cancelled'
                        ? 'border-zinc-700/30 bg-zinc-900/10'
                        : outcome === 'postponed'
                          ? 'border-emerald-900/20 bg-emerald-950/5'
                          : 'border-amber-900/20 bg-amber-950/5'
                    }`}
                  >
                    <div className="text-[11px] text-zinc-500 mb-2 flex items-center gap-1">
                      <FlaskConical size={12} />
                      关联样本处置
                    </div>
                    <div className="space-y-1.5">
                      {affectedSamples.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-start justify-between gap-3 text-[11px] bg-[#0f0f1a] rounded px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-zinc-200 font-medium">{s.name}</span>
                              <SampleBadge status={s.status} />
                            </div>
                            <div className="flex items-center gap-3 text-zinc-500">
                              <span className="mono">{s.storageLocation}</span>
                              <span>·</span>
                              <span>{s.submitter}</span>
                            </div>
                            {s.dispositionNote && (
                              <div
                                className={`mt-1 leading-relaxed ${
                                  outcome === 'cancelled'
                                    ? 'text-zinc-400'
                                    : outcome === 'postponed'
                                      ? 'text-emerald-400/70'
                                      : 'text-yellow-400/70'
                                }`}
                              >
                                {s.dispositionNote}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && isAdmin && isPending && (
                  <div className="border-t border-amber-900/20 p-4 bg-[#0f0f1a]">
                    <div className="text-xs text-zinc-400 mb-3">
                      选择新的时段，或使用"自动查找"按钮获取最早可用时段。确认后关联样本将自动更新为"已顺延"
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1">新开始时间</label>
                        <input
                          type="datetime-local"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                          className="w-full px-3 py-1.5 rounded bg-[#12122a] border border-[#1e1e3a] text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1">新结束时间</label>
                        <input
                          type="datetime-local"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          className="w-full px-3 py-1.5 rounded bg-[#12122a] border border-[#1e1e3a] text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                    {affectedSamples.length > 0 && (
                      <div className="mb-3 px-3 py-2 rounded bg-indigo-950/20 border border-indigo-900/30">
                        <div className="text-[11px] text-indigo-400/80">
                          确认顺延后，以下样本将自动更新：
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {affectedSamples.map((s) => (
                            <span
                              key={s.id}
                              className="text-[10px] bg-[#12122a] px-2 py-0.5 rounded text-zinc-400"
                            >
                              {s.name} → <span className="text-indigo-300">已顺延</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAutoSchedule(res)}
                        className="px-3 py-1.5 rounded text-xs bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                      >
                        自动查找
                      </button>
                      <button
                        onClick={() => handleConfirm(res.id)}
                        className="px-3 py-1.5 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                      >
                        确认顺延
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-[#16162e] border border-[#1e1e3a] rounded-xl w-full max-w-md p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">取消预约</h3>
            <p className="text-xs text-zinc-500 mb-4">
              取消后关联样本将同步标记为"已取消"，并通知申请人。请填写处置说明。
            </p>
            <div className="mb-4">
              <label className="block text-[11px] text-zinc-500 mb-1">处置说明</label>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                rows={3}
                placeholder="例如：仪器故障无法恢复，建议重新预约下周时段"
                className="w-full px-3 py-2 rounded bg-[#0e0e20] border border-[#1e1e3a] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
              />
              <p className="text-[10px] text-zinc-600 mt-1">
                不填写将使用默认说明："关联预约已取消，样本不再安排测试。请及时取回样本"
              </p>
            </div>
            <div className="mb-4 px-3 py-2 rounded bg-red-950/20 border border-red-900/30">
              <div className="text-[11px] text-red-400/80">
                取消后以下样本将同步更新：
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {cancelTargetId &&
                  getAffectedSamples(cancelTargetId).map((s) => (
                    <span
                      key={s.id}
                      className="text-[10px] bg-[#12122a] px-2 py-0.5 rounded text-zinc-400"
                    >
                      {s.name} → <span className="text-red-400">已取消</span>
                    </span>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                返回
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded font-medium transition-colors"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

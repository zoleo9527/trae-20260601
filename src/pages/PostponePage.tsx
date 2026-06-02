import { ReservationBadge, SampleBadge } from '@/components/StatusBadge'
import { useStore } from '@/store/useStore'
import type { Reservation } from '@/types'
import { fmtDateTime, fmtTime } from '@/utils/time'
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock,
  FlaskConical,
  X,
} from 'lucide-react'
import { format, parseISO, setHours, setMinutes } from 'date-fns'
import { useMemo, useState } from 'react'

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

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')

  const isAdmin = currentRole === 'admin'

  const postponedReservations = useMemo(() => {
    return reservations
      .filter((r) => r.status === 'postponed')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [reservations])

  const getInstrumentName = (id: string) =>
    instruments.find((i) => i.id === id)?.name || id

  const getInstrumentCode = (id: string) =>
    instruments.find((i) => i.id === id)?.code || id

  const getAffectedSamples = (reservationId: string) => {
    return samples.filter((s) => s.reservationId === reservationId)
  }

  const getDowntimeReason = (reservationId: string) => {
    for (const dt of downtimes) {
      if (dt.affectedReservations.includes(reservationId)) {
        return dt.reason
      }
    }
    return '调度调整'
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

  const handleBatchAuto = () => {
    if (!isAdmin) return
    if (!confirm('将为所有顺延预约自动安排最早可用时段，确认继续？')) return

    for (const res of postponedReservations) {
      const slot = findNextAvailableSlot(res)
      if (slot) {
        confirmPostpone(res.id, slot.start.toISOString(), slot.end.toISOString())
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">顺延处理</h2>
          <p className="text-xs text-zinc-500 mt-1">
            因故障停机或调度变更受影响的预约，需逐条确认顺延时段或取消。关联样本将同步更新处置状态
          </p>
        </div>
        {isAdmin && postponedReservations.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleBatchAuto}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
            >
              <Clock size={14} />
              全部自动顺延
            </button>
          </div>
        )}
      </div>

      {postponedReservations.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          <CalendarClock size={48} className="mx-auto mb-3 opacity-40" />
          当前无需要顺延处理的预约
        </div>
      ) : (
        <div className="space-y-4">
          {postponedReservations.map((res) => {
            const affectedSamples = getAffectedSamples(res.id)
            const downtimeReason = getDowntimeReason(res.id)
            const isExpanded = selectedId === res.id

            return (
              <div
                key={res.id}
                className="rounded-lg border border-amber-900/30 bg-amber-950/10 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                        <span className="text-sm font-medium text-zinc-200">
                          {getInstrumentName(res.instrumentId)}
                        </span>
                        <span className="text-[10px] text-zinc-600 mono">
                          {getInstrumentCode(res.instrumentId)}
                        </span>
                        <ReservationBadge status={res.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-zinc-500">原时段：</span>
                          <span className="text-zinc-300 mono">
                            {fmtDateTime(res.startTime)} ~ {fmtTime(res.endTime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">申请人：</span>
                          <span className="text-zinc-300">{res.userName}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">课题组：</span>
                          <span className="text-zinc-400">{res.userGroup}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">关联样本：</span>
                          <span className="text-zinc-400">
                            {affectedSamples.length > 0 ? `${affectedSamples.length} 份` : '无'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="text-zinc-500">顺延原因：</span>
                        <span className="text-amber-400/80">{downtimeReason}</span>
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="text-zinc-500">申请理由：</span>
                        <span className="text-zinc-400">{res.reason}</span>
                      </div>
                    </div>

                    {isAdmin && (
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
                          onClick={() => {
                            if (confirm('确认取消该预约？关联样本将同步标记为已取消，将通知申请人。')) {
                              cancelPostponed(res.id)
                            }
                          }}
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
                  <div className="border-t border-amber-900/20 px-4 py-3 bg-amber-950/5">
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
                              <div className="mt-1 text-yellow-400/70 leading-relaxed">
                                {s.dispositionNote}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && isAdmin && (
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
                            <span key={s.id} className="text-[10px] bg-[#12122a] px-2 py-0.5 rounded text-zinc-400">
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
    </div>
  )
}

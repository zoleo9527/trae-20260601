import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { InstrumentStatusDot, ReservationBadge } from '@/components/StatusBadge'
import { useStore } from '@/store/useStore'
import { DEMO_USERS } from '@/data/seed'
import type { Reservation } from '@/types'
import {
  fmtDate,
  fmtDateTime,
  fmtTime,
  getDayLabel,
  getHourFromIso,
  getShortDate,
  getWeekDays,
  isSameDay,
} from '@/utils/time'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Moon,
  X,
  Users,
} from 'lucide-react'
import { format, parseISO, setHours, setMinutes } from 'date-fns'
import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 48

function DraggableReservation({
  reservation,
  top,
  height,
  dayIdx,
  totalDays,
  statusColor,
  isActive,
  hasConflict,
  onClick,
}: {
  reservation: Reservation
  top: number
  height: number
  dayIdx: number
  totalDays: number
  statusColor: string
  isActive: boolean
  hasConflict: boolean
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: reservation.id,
    data: { reservation },
  })

  const style = {
    top: `${top}px`,
    height: `${Math.max(height, SLOT_HEIGHT * 0.8)}px`,
    left: `calc(${dayIdx * (100 / totalDays)}% + 4px)`,
    width: `calc(${100 / totalDays}% - 8px)`,
    transform: CSS.Translate.toString(transform),
    zIndex: isActive ? 50 : 10,
  } as React.CSSProperties

  const isNight = getHourFromIso(reservation.startTime) >= 18 || getHourFromIso(reservation.endTime) < 6

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'absolute rounded border overflow-hidden cursor-pointer transition-all',
        statusColor,
        'cursor-grab active:cursor-grabbing',
        isActive && 'opacity-50',
        hasConflict && reservation.status !== 'postponed' && 'ring-2 ring-red-500/70'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <div className="p-1 h-full flex flex-col min-h-0">
        <div className="text-[11px] font-medium text-white/95 flex items-center gap-1">
          <span className="mono">{fmtTime(reservation.startTime)}</span>
          <span className="text-white/50">-</span>
          <span className="mono">{fmtTime(reservation.endTime)}</span>
          {hasConflict && reservation.status !== 'postponed' && (
            <AlertTriangle size={10} className="text-red-300" />
          )}
        </div>
        <div className="text-[11px] text-white/90 truncate">
          {reservation.userName}
        </div>
        {height > SLOT_HEIGHT && (
          <div className="text-[10px] text-white/70 truncate">
            {reservation.userGroup}
          </div>
        )}
      </div>
    </div>
  )
}

function DroppableSlot({
  id,
  children,
  className,
}: {
  id: string
  children?: React.ReactNode
  className?: string
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 border-r border-[#1e1e3a]/40 last:border-r-0 relative transition-colors',
        isOver && 'bg-indigo-500/20 ring-1 ring-indigo-500/40',
        className
      )}
    >
      {children}
    </div>
  )
}

export default function CalendarPage() {
  const {
    instruments,
    reservations,
    downtimes,
    currentRole,
    currentUserId,
    updateReservationTime,
  } = useStore()

  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [dragError, setDragError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const baseDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate])
  const displayDays = viewMode === 'week' ? weekDays : [weekDays[0]]

  const currentUser = DEMO_USERS.find((u) => u.id === currentUserId)
  const isLeader = currentRole === 'leader'
  const leaderGroup = isLeader ? currentUser?.group : null

  const visibleInstruments = useMemo(() => {
    if (selectedInstrument) {
      return instruments.filter((i) => i.id === selectedInstrument)
    }
    return instruments
  }, [instruments, selectedInstrument])

  const activeReservations = useMemo(() => {
    let list = reservations.filter((r) => r.status !== 'cancelled' && r.status !== 'rejected')

    if (isLeader && leaderGroup) {
      list = list.filter((r) => r.userGroup === leaderGroup)
    }

    return list
  }, [reservations, isLeader, leaderGroup])

  const activeDowntimes = useMemo(() => {
    return downtimes.filter((d) => d.status === 'active')
  }, [downtimes])

  const getReservationForId = (id: string) => {
    return activeReservations.find((r) => r.id === id) || null
  }

  const activeReservation = activeId ? getReservationForId(activeId) : null

  const checkConflict = (res: Reservation, newStart: Date, newEnd: Date): Reservation[] => {
    const conflicts: Reservation[] = []
    for (const r of activeReservations) {
      if (r.id === res.id) continue
      if (r.instrumentId !== res.instrumentId) continue
      const rs = new Date(r.startTime).getTime()
      const re = new Date(r.endTime).getTime()
      const ns = newStart.getTime()
      const ne = newEnd.getTime()
      if (ns < re && ne > rs) {
        conflicts.push(r)
      }
    }
    return conflicts
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (currentRole !== 'admin') return
    setActiveId(event.active.id as string)
    setDragError(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    if (currentRole !== 'admin') return
    if (!event.over) return

    const res = getReservationForId(event.active.id as string)
    if (!res) return

    const overId = event.over.id as string
    if (!overId.includes('|')) return

    const [instrumentId, dayStr, hourStr] = overId.split('|')
    if (instrumentId !== res.instrumentId) {
      setDragError('只能在同一仪器的时段内拖动')
      setTimeout(() => setDragError(null), 3000)
      return
    }

    const targetDay = parseISO(dayStr)
    const targetHour = parseInt(hourStr, 10)

    const originalStart = parseISO(res.startTime)
    const originalEnd = parseISO(res.endTime)
    const durationMs = originalEnd.getTime() - originalStart.getTime()

    let newStart = new Date(targetDay)
    newStart = setHours(newStart, targetHour)
    newStart = setMinutes(newStart, 0)

    const newEnd = new Date(newStart.getTime() + durationMs)

    const conflicts = checkConflict(res, newStart, newEnd)
    if (conflicts.length > 0) {
      const conflictNames = conflicts.map((c) => c.userName).join('、')
      const ok = window.confirm(
        `该时段与 ${conflictNames} 的预约冲突。是否强制调整？`
      )
      if (!ok) return
    }

    updateReservationTime(res.id, newStart.toISOString(), newEnd.toISOString())
    setDragError(null)
  }

  const getInstrumentName = (id: string) =>
    instruments.find((i) => i.id === id)?.name || id

  const getStatusColor = (status: string, night = false) => {
    switch (status) {
      case 'pending':
        return night ? 'bg-amber-700/60 border-amber-600' : 'bg-amber-600/80 border-amber-500'
      case 'approved':
        return night ? 'bg-emerald-700/60 border-emerald-600' : 'bg-emerald-600/80 border-emerald-500'
      case 'postponed':
        return night ? 'bg-yellow-700/60 border-yellow-600' : 'bg-yellow-600/80 border-yellow-500'
      default:
        return 'bg-zinc-700/80 border-zinc-600'
    }
  }

  const groupUsageStats = useMemo(() => {
    if (!isLeader || !leaderGroup) return null
    const stats: Record<string, { approved: number; pending: number; totalHours: number }> = {}
    for (const inst of instruments) {
      stats[inst.id] = { approved: 0, pending: 0, totalHours: 0 }
    }
    for (const r of activeReservations) {
      if (r.userGroup !== leaderGroup) continue
      const s = stats[r.instrumentId]
      if (!s) continue
      if (r.status === 'approved') s.approved++
      if (r.status === 'pending') s.pending++
      const hours =
        (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60 * 60)
      s.totalHours += hours
    }
    return stats
  }, [isLeader, leaderGroup, instruments, activeReservations])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-zinc-200 min-w-[160px] text-center">
              {fmtDate(weekDays[0].toISOString())} ~ {fmtDate(weekDays[6].toISOString())}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-2 px-2 py-1 text-xs rounded bg-[#1a1a3a] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              今天
            </button>
          </div>
          <div className="flex gap-1 bg-[#12122a] rounded p-0.5">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              周视图
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewMode === 'day'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              日视图
            </button>
          </div>
          {isLeader && leaderGroup && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-950/30 border border-blue-800/30 rounded">
              <Users size={12} className="text-blue-400" />
              <span className="text-xs text-blue-300">
                {leaderGroup} 占用视图
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-600/80" />
            已通过
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-600/80" />
            待审批
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-600/80" />
            顺延中
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-900/60" />
            停机
          </div>
          <div className="flex items-center gap-1">
            <Moon size={12} />
            夜间
          </div>
        </div>
      </div>

      {isLeader && groupUsageStats && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          {instruments.map((inst) => {
            const stat = groupUsageStats[inst.id]
            return (
              <div
                key={inst.id}
                className="rounded-lg border border-[#1e1e3a] bg-[#12122a] p-3"
              >
                <div className="text-xs text-zinc-400 mb-1">{inst.name}</div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-lg font-semibold text-emerald-400 mono">
                      {stat.approved}
                    </div>
                    <div className="text-[10px] text-zinc-500">已通过</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-amber-400 mono">
                      {stat.pending}
                    </div>
                    <div className="text-[10px] text-zinc-500">待审批</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-400 mono">
                      {stat.totalHours.toFixed(1)}h
                    </div>
                    <div className="text-[10px] text-zinc-500">总时长</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {dragError && (
        <div className="mb-3 px-3 py-2 rounded bg-red-950/50 border border-red-900/50 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle size={12} />
          {dragError}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-[200px] shrink-0 overflow-auto rounded border border-[#1e1e3a] bg-[#0f0f1a]">
          <div className="p-3 border-b border-[#1e1e3a]">
            <div className="text-xs text-zinc-500 font-medium mb-2">仪器列表</div>
            <button
              onClick={() => setSelectedInstrument(null)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                selectedInstrument === null
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              全部仪器
            </button>
          </div>
          <div className="p-2 space-y-1">
            {instruments.map((inst) => {
              const stat = groupUsageStats?.[inst.id]
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstrument(inst.id)}
                  className={`w-full text-left px-2 py-2 rounded text-xs transition-colors ${
                    selectedInstrument === inst.id
                      ? 'bg-indigo-600/20 text-indigo-300'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <InstrumentStatusDot status={inst.status} />
                    <span className="font-medium text-zinc-200">{inst.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-4">
                    <span className="text-[10px] text-zinc-600 mono">{inst.code}</span>
                    {inst.nightMode && (
                      <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                        <Moon size={10} />
                        夜间开放
                      </span>
                    )}
                  </div>
                  {isLeader && stat && (
                    <div className="mt-1 ml-4 text-[10px] text-zinc-500">
                      本组：{stat.approved + stat.pending} 条 · {stat.totalHours.toFixed(1)}h
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded border border-[#1e1e3a] bg-[#0f0f1a]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="min-w-[800px]">
              <div className="sticky top-0 z-10 bg-[#0f0f1a] border-b border-[#1e1e3a]">
                <div className="flex">
                  <div className="w-14 shrink-0 border-r border-[#1e1e3a]" />
                  {displayDays.map((day) => {
                    const isToday = isSameDay(new Date().toISOString(), day)
                    return (
                      <div
                        key={day.toISOString()}
                        className={`flex-1 border-r border-[#1e1e3a] py-2 text-center last:border-r-0 ${
                          isToday ? 'bg-indigo-950/30' : ''
                        }`}
                      >
                        <div className="text-xs text-zinc-500">{getDayLabel(day)}</div>
                        <div
                          className={`text-sm font-medium ${
                            isToday ? 'text-indigo-300' : 'text-zinc-300'
                          }`}
                        >
                          {getShortDate(day)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {visibleInstruments.map((inst, instIdx) => (
                <div
                  key={inst.id}
                  className={instIdx > 0 ? 'border-t border-[#1e1e3a]' : ''}
                >
                  <div className="flex border-b border-[#1e1e3a] bg-[#12122a]/50">
                    <div className="w-14 shrink-0 border-r border-[#1e1e3a] py-2 px-2">
                      <div className="text-[10px] text-zinc-500 truncate">{inst.code}</div>
                    </div>
                    {displayDays.map((day) => {
                      const isToday = isSameDay(new Date().toISOString(), day)
                      return (
                        <div
                          key={day.toISOString()}
                          className={`flex-1 border-r border-[#1e1e3a] last:border-r-0 ${
                            isToday ? 'bg-indigo-950/20' : ''
                          }`}
                        />
                      )
                    })}
                  </div>

                  <div className="relative">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="flex border-b border-[#1e1e3a]/40"
                        style={{ height: `${SLOT_HEIGHT}px` }}
                      >
                        <div className="w-14 shrink-0 border-r border-[#1e1e3a] pr-1 text-right text-[10px] text-zinc-600 mono pt-0.5">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        {displayDays.map((day) => {
                          const isNight = hour >= 18 || hour < 6
                          const isToday = isSameDay(new Date().toISOString(), day)
                          const hasActiveDowntime = activeDowntimes.some((dt) => {
                            if (dt.instrumentId !== inst.id) return false
                            const ds = new Date(dt.startTime).getTime()
                            const de = new Date(dt.endTime).getTime()
                            const slotStart = new Date(day)
                            slotStart.setHours(hour, 0, 0, 0)
                            const slotEnd = new Date(slotStart)
                            slotEnd.setHours(hour + 1, 0, 0, 0)
                            return slotStart.getTime() < de && slotEnd.getTime() > ds
                          })
                          const slotId = `${inst.id}|${format(day, 'yyyy-MM-dd')}|${hour}`
                          return (
                            <DroppableSlot
                              key={slotId}
                              id={slotId}
                              className={cn(
                                isNight && inst.nightMode && 'bg-indigo-950/15',
                                hasActiveDowntime && 'bg-red-950/30',
                                isToday && 'bg-indigo-950/10'
                              )}
                            />
                          )
                        })}
                      </div>
                    ))}

                    {currentRole === 'admin'
                      ? activeReservations
                          .filter((r) => r.instrumentId === inst.id)
                          .filter((r) =>
                            displayDays.some((d) => isSameDay(r.startTime, d))
                          )
                          .map((r) => {
                            const dayIdx = displayDays.findIndex((d) => isSameDay(r.startTime, d))
                            if (dayIdx < 0) return null

                            const startHour = getHourFromIso(r.startTime)
                            const startMin = parseISO(r.startTime).getMinutes()
                            const endHour = getHourFromIso(r.endTime)
                            const endMin = parseISO(r.endTime).getMinutes()

                            const top = startHour * SLOT_HEIGHT + (startMin / 60) * SLOT_HEIGHT
                            const height =
                              (endHour - startHour) * SLOT_HEIGHT +
                              ((endMin - startMin) / 60) * SLOT_HEIGHT

                            const isNight = startHour >= 18 || endHour < 6
                            const hasConflict = checkConflict(r, parseISO(r.startTime), parseISO(r.endTime)).length > 0

                            return (
                              <DraggableReservation
                                key={r.id}
                                reservation={r}
                                top={top}
                                height={height}
                                dayIdx={dayIdx}
                                totalDays={displayDays.length}
                                statusColor={getStatusColor(r.status, isNight)}
                                isActive={activeId === r.id}
                                hasConflict={hasConflict}
                                onClick={() => setSelectedReservation(r)}
                              />
                            )
                          })
                      : activeReservations
                          .filter((r) => r.instrumentId === inst.id)
                          .filter((r) =>
                            displayDays.some((d) => isSameDay(r.startTime, d))
                          )
                          .map((r) => {
                            const dayIdx = displayDays.findIndex((d) => isSameDay(r.startTime, d))
                            if (dayIdx < 0) return null

                            const startHour = getHourFromIso(r.startTime)
                            const startMin = parseISO(r.startTime).getMinutes()
                            const endHour = getHourFromIso(r.endTime)
                            const endMin = parseISO(r.endTime).getMinutes()

                            const top = startHour * SLOT_HEIGHT + (startMin / 60) * SLOT_HEIGHT
                            const height =
                              (endHour - startHour) * SLOT_HEIGHT +
                              ((endMin - startMin) / 60) * SLOT_HEIGHT

                            const isNight = startHour >= 18 || endHour < 6
                            const hasConflict = checkConflict(r, parseISO(r.startTime), parseISO(r.endTime)).length > 0

                            return (
                              <div
                                key={r.id}
                                className={cn(
                                  'absolute rounded border overflow-hidden cursor-pointer transition-all',
                                  getStatusColor(r.status, isNight),
                                  hasConflict && r.status !== 'postponed' && 'ring-2 ring-red-500/70'
                                )}
                                style={{
                                  top: `${top}px`,
                                  height: `${Math.max(height, SLOT_HEIGHT * 0.8)}px`,
                                  left: `calc(${dayIdx * (100 / displayDays.length)}% + 4px)`,
                                  width: `calc(${100 / displayDays.length}% - 8px)`,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedReservation(r)
                                }}
                              >
                                <div className="p-1 h-full flex flex-col min-h-0">
                                  <div className="text-[11px] font-medium text-white/95 flex items-center gap-1">
                                    <span className="mono">{fmtTime(r.startTime)}</span>
                                    <span className="text-white/50">-</span>
                                    <span className="mono">{fmtTime(r.endTime)}</span>
                                    {hasConflict && r.status !== 'postponed' && (
                                      <AlertTriangle size={10} className="text-red-300" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-white/90 truncate">
                                    {r.userName}
                                  </div>
                                  {height > SLOT_HEIGHT && (
                                    <div className="text-[10px] text-white/70 truncate">
                                      {r.userGroup}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                  </div>
                </div>
              ))}
            </div>

            <DragOverlay>
              {activeReservation ? (
                <div
                  className={cn(
                    'rounded border shadow-xl opacity-90',
                    getStatusColor(activeReservation.status)
                  )}
                  style={{
                    minWidth: '180px',
                    padding: '8px 10px',
                  }}
                >
                  <div className="text-xs font-medium text-white/95">
                    {fmtTime(activeReservation.startTime)} - {fmtTime(activeReservation.endTime)}
                  </div>
                  <div className="text-xs text-white/90">
                    {activeReservation.userName}
                  </div>
                  <div className="text-[10px] text-white/70">
                    {getInstrumentName(activeReservation.instrumentId)}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {selectedReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelectedReservation(null)}
        >
          <div
            className="bg-[#12122a] border border-[#1e1e3a] rounded-lg w-[460px] p-5 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-200">预约详情</h3>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 w-20">仪器：</span>
                <span className="text-zinc-200">
                  {getInstrumentName(selectedReservation.instrumentId)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 w-20">申请人：</span>
                <span className="text-zinc-200">{selectedReservation.userName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 w-20">课题组：</span>
                <span className="text-zinc-300">{selectedReservation.userGroup}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 w-20">时段：</span>
                <span className="text-zinc-200 mono">
                  {fmtDateTime(selectedReservation.startTime)} ~{' '}
                  {fmtTime(selectedReservation.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 w-20">状态：</span>
                <ReservationBadge status={selectedReservation.status} />
              </div>
              <div className="pt-2 border-t border-[#1e1e3a]">
                <div className="flex items-start gap-2">
                  <Info size={12} className="text-zinc-500 mt-0.5 shrink-0" />
                  <span className="text-zinc-500">申请理由：</span>
                </div>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed pl-5">
                  {selectedReservation.reason}
                </p>
              </div>
              <div className="pt-2 border-t border-[#1e1e3a]">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-zinc-500" />
                  <span className="text-zinc-500 text-xs">
                    创建于 {fmtDateTime(selectedReservation.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setSelectedReservation(null)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                关闭
              </button>
              {currentRole === 'admin' && selectedReservation.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      useStore.getState().approveReservation(selectedReservation.id)
                      setSelectedReservation(null)
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => {
                      useStore.getState().rejectReservation(selectedReservation.id)
                      setSelectedReservation(null)
                    }}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
                  >
                    驳回
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

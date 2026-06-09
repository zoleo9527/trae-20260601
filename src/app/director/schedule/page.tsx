'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/lib/toast-store'
import { ScheduleStatus, SCHEDULE_STATUS_LABELS } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import {
  Calendar,
  Clock,
  User,
  RefreshCw,
  Wrench,
  AlertTriangle,
  Send,
  ChevronRight,
} from 'lucide-react'

interface ScheduleItem {
  id: string
  treatmentType: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: ScheduleStatus
  remark: string | null
  patient: { id: string; name: string; diagnosis: string | null }
  therapist: { id: string; user: { name: string }; specialty: string | null }
  equipment: { id: string; name: string; location: string | null } | null
  assessment: { id: string; content: string; result: string | null; status: string } | null
  alerts: { id: string; type: string; level: string; message: string; resolved: boolean }[]
}

export default function DirectorSchedule() {
  const { userId, userRole, hydrated } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [therapists, setTherapists] = useState<{ id: string; user: { name: string }; specialty: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTherapist, setSelectedTherapist] = useState<string>('all')
  const [date] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!hydrated) return
    if (!userId || userRole !== 'DIRECTOR') {
      router.push('/login')
      return
    }
    fetchData()
  }, [userId, userRole, hydrated, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [scheduleRes, therapistRes] = await Promise.all([
        fetch(`/api/schedules?date=${date}`),
        fetch('/api/therapists'),
      ])
      const scheduleData = await scheduleRes.json()
      const therapistData = await therapistRes.json()
      setSchedules(scheduleData)
      setTherapists(therapistData)
    } catch {
      addToast('获取数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (scheduleId: string, toStatus: ScheduleStatus, remark?: string) => {
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          toStatus,
          operatorId: userId,
          operatorRole: 'DIRECTOR',
          remark,
        }),
      })
      if (res.ok) {
        addToast('状态已更新', 'success')
        fetchData()
      }
    } catch {
      addToast('操作失败', 'error')
    }
  }

  const handleNotify = (name: string) => {
    addToast(`已发送通知给${name}（占位）`, 'info')
  }

  const filteredSchedules = selectedTherapist === 'all'
    ? schedules
    : schedules.filter((s) => s.therapist.id === selectedTherapist)

  const schedulesByTime = filteredSchedules.reduce<Record<string, ScheduleItem[]>>((acc, s) => {
    const hour = s.scheduledTime.split(':')[0]
    const timeSlot = `${hour}:00 - ${hour}:59`
    if (!acc[timeSlot]) acc[timeSlot] = []
    acc[timeSlot].push(s)
    return acc
  }, {})

  const sortedTimeSlots = Object.keys(schedulesByTime).sort()

  const timeColors: Record<string, string> = {
    PENDING: 'bg-gray-100 border-gray-200',
    URGED: 'bg-accent-50 border-accent-200',
    CONFIRMED: 'bg-emerald-50 border-emerald-200',
    RETURNED: 'bg-red-50 border-red-200',
    SUPPLEMENTING: 'bg-blue-50 border-blue-200',
    IN_TREATMENT: 'bg-purple-50 border-purple-200',
    COMPLETED: 'bg-green-50 border-green-200',
    CANCELLED: 'bg-gray-50 border-gray-200 opacity-50',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">全局排班查看</h1>
          <p className="text-sm text-gray-500 mt-1">{date} · 按治疗师和时间查看排班</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
          >
            <option value="all">全部治疗师</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.name}{t.specialty ? `（${t.specialty}）` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> 待确认</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent-200 inline-block" /> 已催促</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> 已确认</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> 已退回</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> 补材料中</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-200 inline-block" /> 治疗中</span>
      </div>

      {selectedTherapist === 'all' ? (
        <div className="space-y-6">
          {therapists.map((therapist) => {
            const therapistSchedules = filteredSchedules.filter((s) => s.therapist.id === therapist.id)
            if (therapistSchedules.length === 0) return null

            return (
              <div key={therapist.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-navy-50 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy-500 flex items-center justify-center text-white text-xs font-bold">
                    {therapist.user.name[0]}
                  </div>
                  <div>
                    <span className="font-semibold text-navy-700">{therapist.user.name}</span>
                    {therapist.specialty && <span className="text-xs text-gray-400 ml-2">{therapist.specialty}</span>}
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">{therapistSchedules.length}项排班</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {therapistSchedules
                      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`min-w-[200px] rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${timeColors[schedule.status]}`}
                          onClick={() => router.push(`/director/schedule`)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-navy-700">{schedule.scheduledTime}</span>
                            <StatusBadge status={schedule.status} size="sm" />
                            {schedule.alerts.length > 0 && schedule.alerts.some((a) => !a.resolved) && (
                              <AlertTriangle size={12} className="text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-navy-700 mb-1">{schedule.treatmentType}</p>
                          <p className="text-xs text-gray-500">{schedule.patient.name}</p>
                          {schedule.equipment && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Wrench size={10} />
                              {schedule.equipment.name}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedules
            .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
            .map((schedule) => (
              <div
                key={schedule.id}
                className={`bg-white rounded-xl p-5 border transition-all hover:shadow-md ${
                  schedule.alerts.length > 0 && schedule.alerts.some((a) => !a.resolved)
                    ? 'border-amber-300'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={schedule.status} size="md" />
                      <span className="text-lg font-semibold text-navy-700">{schedule.treatmentType}</span>
                      {schedule.alerts.length > 0 && schedule.alerts.some((a) => !a.resolved) && (
                        <AlertTriangle size={16} className="text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-5 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><User size={14} />{schedule.patient.name}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} />{schedule.scheduledTime} · {schedule.duration}分钟</span>
                      {schedule.equipment && (
                        <span className="flex items-center gap-1.5"><Wrench size={14} />{schedule.equipment.name}</span>
                      )}
                    </div>
                    {schedule.remark && <p className="text-xs text-amber-600 mt-1">备注：{schedule.remark}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {schedule.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleStatusChange(schedule.id, 'CONFIRMED', '主任确认')} className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">确认</button>
                        <button onClick={() => handleStatusChange(schedule.id, 'RETURNED', '主任退回')} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">退回</button>
                      </>
                    )}
                    {schedule.status === 'URGED' && (
                      <button onClick={() => handleStatusChange(schedule.id, 'CONFIRMED', '催促后确认')} className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">确认</button>
                    )}
                    {schedule.status === 'RETURNED' && (
                      <button onClick={() => handleStatusChange(schedule.id, 'SUPPLEMENTING', '主任要求补材料')} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">要求补材料</button>
                    )}
                    <button onClick={() => handleNotify(schedule.therapist.user.name)} className="px-3 py-1.5 text-xs bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 flex items-center gap-1">
                      <Send size={10} /> 通知
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {sortedTimeSlots.length > 0 && selectedTherapist === 'all' && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy-700 mb-4">时间线视图（冲突检测）</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {sortedTimeSlots.map((timeSlot) => {
              const items = schedulesByTime[timeSlot]
              const hasConflict = items.length > 1 || items.some((s) => s.alerts.length > 0 && s.alerts.some((a) => a.type === 'EQUIPMENT_CONFLICT' && !a.resolved))

              return (
                <div key={timeSlot} className={`flex border-b border-gray-50 last:border-b-0 ${hasConflict ? 'bg-red-50/30' : ''}`}>
                  <div className={`w-28 px-4 py-3 text-sm font-medium flex-shrink-0 ${hasConflict ? 'text-red-600' : 'text-gray-500'} border-r border-gray-100`}>
                    {timeSlot}
                    {hasConflict && (
                      <div className="flex items-center gap-1 text-xs mt-0.5">
                        <AlertTriangle size={10} />
                        冲突
                      </div>
                    )}
                  </div>
                  <div className="flex-1 px-4 py-3 flex gap-2 flex-wrap">
                    {items.map((s) => (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${timeColors[s.status]}`}
                      >
                        <span className="font-medium">{s.therapist.user.name}</span>
                        <span className="text-gray-400">·</span>
                        <span>{s.patient.name}</span>
                        <span className="text-gray-400">·</span>
                        <span>{s.treatmentType}</span>
                        {s.equipment && (
                          <>
                            <span className="text-gray-400">·</span>
                            <span className="flex items-center gap-0.5"><Wrench size={8} />{s.equipment.name}</span>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import AlertBadge from '@/components/AlertBadge'
import StatusBadge from '@/components/StatusBadge'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/lib/toast-store'
import { ScheduleStatus } from '@/lib/types'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  RefreshCw,
  Send,
  User,
  XCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ScheduleItem {
  id: string
  treatmentType: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: ScheduleStatus
  remark: string | null
  patient: { id: string; name: string; diagnosis: string | null }
  therapist: { id: string; user: { name: string } }
  equipment: { id: string; name: string } | null
  assessment: { id: string; content: string; result: string | null; status: string } | null
  alerts: { id: string; type: string; level: string; message: string; resolved: boolean }[]
  checkins: { id: string; status: string }[]
}

export default function TherapistSchedule() {
  const { userId, userRole, hydrated } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [date] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!hydrated) return
    if (!userId || userRole !== 'THERAPIST') {
      router.push('/login')
      return
    }
    fetchSchedules()
  }, [userId, userRole, hydrated, router])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const therapistRes = await fetch('/api/therapists')
      const therapists = await therapistRes.json()
      const me = therapists.find((t: { userId: string }) => t.userId === userId)
      if (!me) return

      const res = await fetch(`/api/schedules?therapistId=${me.id}&date=${date}`)
      const data = await res.json()
      setSchedules(data)
    } catch {
      addToast('获取排班数据失败', 'error')
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
          operatorRole: 'THERAPIST',
          remark,
        }),
      })
      if (res.ok) {
        addToast(`状态已更新为${toStatus === 'CONFIRMED' ? '已确认' : toStatus === 'IN_TREATMENT' ? '治疗中' : toStatus}`, 'success')
        fetchSchedules()
      }
    } catch {
      addToast('操作失败', 'error')
    }
  }

  const handleNotify = (patientName: string) => {
    addToast(`已发送通知给${patientName}（占位）`, 'info')
  }

  const filtered = filter === 'all' ? schedules : schedules.filter((s) => s.status === filter)

  const urgentCount = schedules.filter((s) => s.status === 'URGED' || s.status === 'RETURNED' || s.status === 'SUPPLEMENTING').length
  const alertSchedules = schedules.filter((s) => s.alerts.length > 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">排班工作台</h1>
          <p className="text-sm text-gray-500 mt-1">{date} · 今日排班</p>
        </div>
        <button
          onClick={fetchSchedules}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          刷新
        </button>
      </div>

      {alertSchedules.length > 0 && (
        <div className="mb-6 bg-warn-50 border border-warn-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">复盘预警</span>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{alertSchedules.length}项</span>
          </div>
          <div className="space-y-2">
            {alertSchedules.flatMap((s) =>
              s.alerts.map((alert) => (
                <AlertBadge key={alert.id} type={alert.type as 'PLAN_DISRUPTED' | 'ASSESSMENT_NOT_FOLLOWED' | 'EQUIPMENT_CONFLICT'} level={alert.level as 'HIGH' | 'MEDIUM' | 'LOW'} message={alert.message} resolved={alert.resolved} />
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'all' ? 'bg-navy-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          全部 ({schedules.length})
        </button>
        <button
          onClick={() => setFilter('URGED')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'URGED' ? 'bg-accent-400 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          已催促 ({schedules.filter((s) => s.status === 'URGED').length})
        </button>
        <button
          onClick={() => setFilter('RETURNED')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'RETURNED' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          已退回 ({schedules.filter((s) => s.status === 'RETURNED').length})
        </button>
        <button
          onClick={() => setFilter('SUPPLEMENTING')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'SUPPLEMENTING' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          补材料中 ({schedules.filter((s) => s.status === 'SUPPLEMENTING').length})
        </button>
        <button
          onClick={() => setFilter('CONFIRMED')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'CONFIRMED' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          已确认 ({schedules.filter((s) => s.status === 'CONFIRMED').length})
        </button>
        {urgentCount > 0 && (
          <span className="ml-auto text-xs text-accent-500 font-medium flex items-center gap-1">
            <Bell size={12} /> {urgentCount}项待处理
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p>暂无排班记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((schedule) => (
            <div
              key={schedule.id}
              className={`bg-white rounded-xl p-5 border transition-all hover:shadow-md cursor-pointer ${
                schedule.alerts.length > 0 && schedule.alerts.some((a) => !a.resolved)
                  ? 'border-amber-300 shadow-amber-50'
                  : 'border-gray-100'
              }`}
              onClick={() => router.push(`/therapist/schedule/${schedule.id}`)}
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

                  <div className="flex items-center gap-5 text-sm text-gray-500 mb-2">
                    <span className="flex items-center gap-1.5">
                      <User size={14} />
                      {schedule.patient.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {schedule.scheduledTime} · {schedule.duration}分钟
                    </span>
                    {schedule.equipment && (
                      <span className="flex items-center gap-1.5">
                        <FileText size={14} />
                        {schedule.equipment.name}
                      </span>
                    )}
                  </div>

                  {schedule.patient.diagnosis && (
                    <p className="text-xs text-gray-400">诊断：{schedule.patient.diagnosis}</p>
                  )}

                  {schedule.assessment && (
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      <FileText size={12} />
                      评估：{schedule.assessment.content}
                      {schedule.assessment.status === 'PENDING' && '（未跟进）'}
                    </p>
                  )}

                  {schedule.remark && (
                    <p className="text-xs text-amber-600 mt-1">备注：{schedule.remark}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  {schedule.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(schedule.id, 'CONFIRMED')}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        确认排班
                      </button>
                      <button
                        onClick={() => handleNotify(schedule.patient.name)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-xs rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <Send size={12} />
                        通知患者
                      </button>
                    </>
                  )}
                  {schedule.status === 'URGED' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(schedule.id, 'CONFIRMED')}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        确认排班
                      </button>
                      <button
                        onClick={() => handleNotify(schedule.patient.name)}
                        className="px-3 py-1.5 bg-accent-400 text-white text-xs rounded-lg hover:bg-accent-500 transition-colors flex items-center gap-1"
                      >
                        <Bell size={12} />
                        回复催促
                      </button>
                    </>
                  )}
                  {schedule.status === 'RETURNED' && (
                    <button
                      onClick={() => handleStatusChange(schedule.id, 'SUPPLEMENTING', '治疗师要求补材料')}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <Paperclip size={12} />
                      补材料
                    </button>
                  )}
                  {schedule.status === 'SUPPLEMENTING' && (
                    <button
                      onClick={() => handleStatusChange(schedule.id, 'PENDING', '材料已补齐')}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      材料已补齐
                    </button>
                  )}
                  {schedule.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleStatusChange(schedule.id, 'IN_TREATMENT')}
                      className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                    >
                      <ArrowRight size={12} />
                      开始治疗
                    </button>
                  )}
                  {schedule.status === 'IN_TREATMENT' && (
                    <button
                      onClick={() => handleStatusChange(schedule.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                    >
                      完成治疗
                    </button>
                  )}
                  {schedule.status === 'PENDING' && (
                    <button
                      onClick={() => handleStatusChange(schedule.id, 'CANCELLED')}
                      className="px-2 py-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/lib/toast-store'
import { CheckinStatus } from '@/lib/types'
import CheckinStatusBadge from '@/components/CheckinStatusBadge'
import {
  ClipboardCheck,
  Clock,
  User,
  RefreshCw,
  Bell,
  Send,
  Upload,
  Paperclip,
  XCircle,
  CheckCircle,
  ChevronRight,
  Wrench,
} from 'lucide-react'

interface CheckinItem {
  id: string
  checkinTime: string | null
  completeTime: string | null
  status: CheckinStatus
  equipmentUsed: string | null
  remark: string | null
  patient: { id: string; name: string; diagnosis: string | null }
  schedule: {
    id: string
    treatmentType: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    status: string
    therapist: { id: string; user: { name: string } }
    equipment: { id: string; name: string } | null
    assessment: { id: string; content: string } | null
  }
  checkinLogs: { fromStatus: string | null; toStatus: string; remark: string | null; createdAt: string }[]
  attachments: { id: string; fileName: string }[]
}

export default function ReceptionCheckin() {
  const { userId, userRole, hydrated } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const [checkins, setCheckins] = useState<CheckinItem[]>([])
  const [schedules, setSchedules] = useState<{ id: string; patientId: string; patient: { name: string }; treatmentType: string; scheduledTime: string; status: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'checkin' | 'complete' | 'all'>('all')
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newScheduleId, setNewScheduleId] = useState('')
  const [completeRemark, setCompleteRemark] = useState('')
  const [completeEquipment, setCompleteEquipment] = useState('')
  const [date] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!hydrated) return
    if (!userId || userRole !== 'RECEPTION') {
      router.push('/login')
      return
    }
    fetchData()
  }, [userId, userRole, hydrated, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [checkinRes, scheduleRes] = await Promise.all([
        fetch(`/api/checkins?date=${date}`),
        fetch(`/api/schedules?date=${date}`),
      ])
      const checkinData = await checkinRes.json()
      const scheduleData = await scheduleRes.json()
      setCheckins(checkinData)
      setSchedules(scheduleData)
    } catch {
      addToast('获取数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckin = async (checkinId: string) => {
    try {
      const res = await fetch(`/api/checkins/${checkinId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkin', operatorId: userId }),
      })
      if (res.ok) {
        addToast('签到成功', 'success')
        fetchData()
      }
    } catch {
      addToast('签到操作失败', 'error')
    }
  }

  const handleComplete = async (checkinId: string) => {
    try {
      const res = await fetch(`/api/checkins/${checkinId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          operatorId: userId,
          remark: completeRemark,
          equipmentUsed: completeEquipment,
        }),
      })
      if (res.ok) {
        addToast('消课确认成功', 'success')
        setShowCompleteModal(null)
        setCompleteRemark('')
        setCompleteEquipment('')
        fetchData()
      }
    } catch {
      addToast('消课操作失败', 'error')
    }
  }

  const handleCancel = async (checkinId: string) => {
    try {
      const res = await fetch(`/api/checkins/${checkinId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', operatorId: userId }),
      })
      if (res.ok) {
        addToast('已取消签到', 'info')
        fetchData()
      }
    } catch {
      addToast('操作失败', 'error')
    }
  }

  const handleCreateCheckin = async () => {
    if (!newScheduleId) {
      addToast('请选择排班记录', 'warning')
      return
    }
    const schedule = schedules.find((s) => s.id === newScheduleId)
    if (!schedule) return

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: newScheduleId,
          patientId: schedule.patientId,
          operatorId: userId,
        }),
      })
      if (res.ok) {
        addToast('签到记录已创建', 'success')
        setShowCreateModal(false)
        setNewScheduleId('')
        fetchData()
      }
    } catch {
      addToast('创建失败', 'error')
    }
  }

  const handleScheduleStatus = async (scheduleId: string, toStatus: string, remark?: string) => {
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          toStatus,
          operatorId: userId,
          operatorRole: 'RECEPTION',
          remark,
        }),
      })
      if (res.ok) {
        addToast(`排班状态已更新`, 'success')
        fetchData()
      }
    } catch {
      addToast('操作失败', 'error')
    }
  }

  const handleNotify = (name: string) => {
    addToast(`已发送通知给${name}（占位）`, 'info')
  }

  const waitingCheckins = checkins.filter((c) => c.status === 'WAITING')
  const checkedInCheckins = checkins.filter((c) => c.status === 'CHECKED_IN')
  const inTreatmentCheckins = checkins.filter((c) => c.status === 'IN_TREATMENT')
  const completedCheckins = checkins.filter((c) => c.status === 'COMPLETED')

  const displayCheckins = tab === 'checkin'
    ? [...waitingCheckins, ...checkedInCheckins]
    : tab === 'complete'
    ? [...inTreatmentCheckins]
    : checkins

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">签到消课工作台</h1>
          <p className="text-sm text-gray-500 mt-1">{date}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-navy-500 text-white text-sm rounded-lg hover:bg-navy-600 transition-colors flex items-center gap-2"
          >
            <ClipboardCheck size={14} />
            创建签到
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">待签到</p>
          <p className="text-2xl font-bold text-gray-700">{waitingCheckins.length}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-400 mb-1">已签到</p>
          <p className="text-2xl font-bold text-blue-700">{checkedInCheckins.length}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-xs text-purple-400 mb-1">治疗中</p>
          <p className="text-2xl font-bold text-purple-700">{inTreatmentCheckins.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-400 mb-1">已完成</p>
          <p className="text-2xl font-bold text-green-700">{completedCheckins.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tab === 'all' ? 'bg-navy-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          全部 ({checkins.length})
        </button>
        <button
          onClick={() => setTab('checkin')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tab === 'checkin' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          待签到/已签到 ({waitingCheckins.length + checkedInCheckins.length})
        </button>
        <button
          onClick={() => setTab('complete')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tab === 'complete' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          待消课 ({inTreatmentCheckins.length})
        </button>
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
      ) : displayCheckins.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p>暂无签到消课记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayCheckins.map((checkin) => (
            <div
              key={checkin.id}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/reception/checkin/${checkin.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckinStatusBadge status={checkin.status} size="md" />
                    <span className="text-lg font-semibold text-navy-700">{checkin.schedule.treatmentType}</span>
                  </div>
                  <div className="flex items-center gap-5 text-sm text-gray-500 mb-2">
                    <span className="flex items-center gap-1.5">
                      <User size={14} />
                      {checkin.patient.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {checkin.schedule.scheduledTime} · {checkin.schedule.duration}分钟
                    </span>
                    <span className="text-gray-400">
                      治疗师：{checkin.schedule.therapist.user.name}
                    </span>
                  </div>
                  {checkin.checkinTime && (
                    <p className="text-xs text-gray-400">
                      签到时间：{new Date(checkin.checkinTime).toLocaleString('zh-CN')}
                    </p>
                  )}
                  {checkin.remark && (
                    <p className="text-xs text-amber-600 mt-1">{checkin.remark}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  {checkin.status === 'WAITING' && (
                    <button
                      onClick={() => handleCheckin(checkin.id)}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      办理签到
                    </button>
                  )}
                  {checkin.status === 'CHECKED_IN' && (
                    <button
                      onClick={() => handleNotify(checkin.patient.name)}
                      className="px-3 py-1.5 bg-accent-50 text-accent-600 text-xs rounded-lg hover:bg-accent-100 transition-colors flex items-center gap-1"
                    >
                      <Bell size={12} />
                      通知治疗师
                    </button>
                  )}
                  {checkin.status === 'IN_TREATMENT' && (
                    <button
                      onClick={() => setShowCompleteModal(checkin.id)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      消课确认
                    </button>
                  )}
                  {(checkin.status === 'WAITING' || checkin.status === 'CHECKED_IN') && (
                    <button
                      onClick={() => handleCancel(checkin.id)}
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

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-navy-700 mb-4">排班快捷操作</h2>
        <div className="space-y-2">
          {schedules
            .filter((s) => s.status === 'PENDING' || s.status === 'URGED' || s.status === 'RETURNED' || s.status === 'SUPPLEMENTING')
            .map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg px-4 py-3 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{schedule.patient.name}</span>
                  <span className="text-gray-400">{schedule.treatmentType}</span>
                  <span className="text-gray-400">{schedule.scheduledTime}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    schedule.status === 'URGED' ? 'bg-accent-50 text-accent-500' :
                    schedule.status === 'RETURNED' ? 'bg-red-50 text-red-500' :
                    schedule.status === 'SUPPLEMENTING' ? 'bg-blue-50 text-blue-500' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {schedule.status === 'URGED' ? '已催促' : schedule.status === 'RETURNED' ? '已退回' : schedule.status === 'SUPPLEMENTING' ? '补材料中' : '待确认'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {schedule.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleScheduleStatus(schedule.id, 'URGED', '前台催促')} className="px-2 py-1 text-xs bg-accent-50 text-accent-600 rounded hover:bg-accent-100">催促</button>
                      <button onClick={() => handleScheduleStatus(schedule.id, 'RETURNED', '材料不全退回')} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">退回</button>
                    </>
                  )}
                  {schedule.status === 'URGED' && (
                    <>
                      <button onClick={() => handleScheduleStatus(schedule.id, 'CONFIRMED', '催促后确认')} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100">确认</button>
                      <button onClick={() => handleScheduleStatus(schedule.id, 'RETURNED', '催促后退回')} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">退回</button>
                    </>
                  )}
                  {schedule.status === 'RETURNED' && (
                    <button onClick={() => handleScheduleStatus(schedule.id, 'SUPPLEMENTING', '通知补材料')} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1">
                      <Paperclip size={10} />
                      补材料
                    </button>
                  )}
                  {schedule.status === 'SUPPLEMENTING' && (
                    <button onClick={() => handleScheduleStatus(schedule.id, 'PENDING', '材料已补齐')} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">材料已补齐</button>
                  )}
                  <button onClick={() => handleNotify(schedule.patient.name)} className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded hover:bg-gray-100 flex items-center gap-1">
                    <Send size={10} />
                    通知
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-navy-700 mb-4">创建签到记录</h3>
            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-2 block">选择排班记录</label>
              <select
                value={newScheduleId}
                onChange={(e) => setNewScheduleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
              >
                <option value="">请选择排班</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.patient.name} - {s.treatmentType} ({s.scheduledTime})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">取消</button>
              <button onClick={handleCreateCheckin} className="px-4 py-2 text-sm bg-navy-500 text-white rounded-lg hover:bg-navy-600">确认创建</button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-navy-700 mb-4">消课确认</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm text-gray-500 mb-2 block">使用器械</label>
                <select
                  value={completeEquipment}
                  onChange={(e) => setCompleteEquipment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                >
                  <option value="">未使用器械</option>
                  <option value="eq1">牵引机A</option>
                  <option value="eq2">电动踏车B</option>
                  <option value="eq3">超声波治疗仪C</option>
                  <option value="eq4">平衡训练台D</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-2 block">备注</label>
                <textarea
                  value={completeRemark}
                  onChange={(e) => setCompleteRemark(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                  rows={3}
                  placeholder="消课备注..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-2 block">附件上传</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                  <Upload size={20} className="mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400">点击上传（占位）</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCompleteModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">取消</button>
              <button onClick={() => handleComplete(showCompleteModal)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">确认消课</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/lib/toast-store'
import { ScheduleStatus, SCHEDULE_STATUS_LABELS } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import AlertBadge from '@/components/AlertBadge'
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Bell,
  Send,
  Upload,
  Paperclip,
  ChevronDown,
  Activity,
  Wrench,
  AlertTriangle,
} from 'lucide-react'

interface StatusLogItem {
  id: string
  fromStatus: string | null
  toStatus: string
  operatorId: string
  operatorRole: string
  remark: string | null
  createdAt: string
  operator: { name: string }
}

interface AttachmentItem {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: string
  uploader: { name: string }
}

interface ScheduleDetail {
  id: string
  treatmentType: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: ScheduleStatus
  remark: string | null
  patient: { id: string; name: string; phone: string; age: number; diagnosis: string | null }
  therapist: { id: string; user: { name: string }; specialty: string | null }
  equipment: { id: string; name: string; location: string | null; status: string } | null
  assessment: { id: string; content: string; result: string | null; status: string; assessedAt: string } | null
  statusLogs: StatusLogItem[]
  checkins: { id: string; status: string; checkinTime: string | null; completeTime: string | null; checkinLogs: { fromStatus: string | null; toStatus: string; remark: string | null; createdAt: string }[]; attachments: AttachmentItem[] }[]
  attachments: AttachmentItem[]
  alerts: { id: string; type: string; level: string; message: string; resolved: boolean }[]
}

export default function ScheduleDetailPage() {
  const { userId, hydrated } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const params = useParams()
  const [detail, setDetail] = useState<ScheduleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!userId) {
      router.push('/login')
      return
    }
    fetchDetail()
  }, [userId, hydrated, params.id])

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/schedules/${params.id}`)
      const data = await res.json()
      setDetail(data)
    } catch {
      addToast('获取详情失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (toStatus: ScheduleStatus, remark?: string) => {
    try {
      const res = await fetch(`/api/schedules/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', toStatus, operatorId: userId, operatorRole: 'THERAPIST', remark }),
      })
      if (res.ok) {
        addToast('状态已更新', 'success')
        fetchDetail()
      }
    } catch {
      addToast('操作失败', 'error')
    }
  }

  const handleUpload = () => {
    setShowUploadModal(true)
  }

  const handleUploadConfirm = () => {
    addToast('文件上传成功（占位）', 'success')
    setShowUploadModal(false)
  }

  const handleNotify = (target: string) => {
    addToast(`已发送通知给${target}（占位）`, 'info')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return <div className="p-8 text-center text-gray-400">未找到排班记录</div>
  }

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        返回列表
      </button>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={detail.status} size="md" />
                <h2 className="text-xl font-bold text-navy-700">{detail.treatmentType}</h2>
              </div>
              <div className="flex items-center gap-2">
                {detail.status === 'PENDING' && (
                  <button onClick={() => handleStatusChange('CONFIRMED')} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">确认排班</button>
                )}
                {detail.status === 'URGED' && (
                  <button onClick={() => handleStatusChange('CONFIRMED')} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">确认排班</button>
                )}
                {detail.status === 'RETURNED' && (
                  <button onClick={() => handleStatusChange('SUPPLEMENTING', '补材料')} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">补材料</button>
                )}
                {detail.status === 'CONFIRMED' && (
                  <button onClick={() => handleStatusChange('IN_TREATMENT')} className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600">开始治疗</button>
                )}
                {detail.status === 'IN_TREATMENT' && (
                  <button onClick={() => handleStatusChange('COMPLETED')} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">完成治疗</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User size={14} className="text-gray-400" />
                <span>患者：{detail.patient.name}（{detail.patient.age}岁）</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={14} className="text-gray-400" />
                <span>时间：{detail.scheduledDate} {detail.scheduledTime} · {detail.duration}分钟</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Activity size={14} className="text-gray-400" />
                <span>治疗师：{detail.therapist.user.name}{detail.therapist.specialty ? `（${detail.therapist.specialty}）` : ''}</span>
              </div>
              {detail.equipment && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Wrench size={14} className="text-gray-400" />
                  <span>器械：{detail.equipment.name}（{detail.equipment.location}）</span>
                </div>
              )}
              {detail.remark && (
                <div className="col-span-2 text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  备注：{detail.remark}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
              <Clock size={16} />
              状态变更历史
            </h3>
            <div className="relative pl-6">
              {detail.statusLogs.map((log, index) => (
                <div key={log.id} className="relative pb-6 last:pb-0">
                  <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full bg-navy-400 border-2 border-white shadow-sm" />
                  {index < detail.statusLogs.length - 1 && (
                    <div className="absolute left-[-16px] top-4 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="ml-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-navy-700">
                        {log.fromStatus ? SCHEDULE_STATUS_LABELS[log.fromStatus as ScheduleStatus] : '初始'}
                      </span>
                      <ChevronDown size={12} className="text-gray-400 -rotate-90" />
                      <span className="font-medium text-navy-700">
                        {SCHEDULE_STATUS_LABELS[log.toStatus as ScheduleStatus]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                      <span>操作人：{log.operator.name}（{log.operatorRole === 'THERAPIST' ? '治疗师' : log.operatorRole === 'RECEPTION' ? '前台' : '主任'}）</span>
                    </div>
                    {log.remark && (
                      <p className="text-xs text-gray-500 mt-1">{log.remark}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-700 flex items-center gap-2">
                <Paperclip size={16} />
                附件
              </h3>
              <button
                onClick={handleUpload}
                className="px-3 py-1.5 text-xs bg-navy-50 text-navy-600 rounded-lg hover:bg-navy-100 transition-colors flex items-center gap-1"
              >
                <Upload size={12} />
                上传附件
              </button>
            </div>
            {detail.attachments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无附件</p>
            ) : (
              <div className="space-y-2">
                {detail.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    <FileText size={14} className="text-gray-400" />
                    <span className="flex-1 text-gray-700">{att.fileName}</span>
                    <span className="text-xs text-gray-400">{att.uploader.name} · {new Date(att.uploadedAt).toLocaleDateString('zh-CN')}</span>
                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">查看（占位）</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {detail.checkins.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
                <Activity size={16} />
                签到消课记录
              </h3>
              <div className="space-y-3">
                {detail.checkins.map((checkin) => (
                  <div key={checkin.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">签到状态：{checkin.status === 'WAITING' ? '待签到' : checkin.status === 'CHECKED_IN' ? '已签到' : checkin.status === 'IN_TREATMENT' ? '治疗中' : checkin.status === 'COMPLETED' ? '已完成' : '已取消'}</span>
                      {checkin.checkinTime && (
                        <span className="text-xs text-gray-400">签到时间：{new Date(checkin.checkinTime).toLocaleString('zh-CN')}</span>
                      )}
                    </div>
                    {checkin.checkinLogs.length > 0 && (
                      <div className="pl-4 border-l-2 border-gray-200 mt-2 space-y-2">
                        {checkin.checkinLogs.map((log, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            <span className="text-gray-700">{log.fromStatus || '初始'} → {log.toStatus}</span>
                            {log.remark && <span className="ml-2">{log.remark}</span>}
                            <span className="ml-2 text-gray-400">{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="font-semibold text-navy-700 mb-3">患者信息</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">姓名：</span>{detail.patient.name}</p>
              <p><span className="text-gray-400">年龄：</span>{detail.patient.age}岁</p>
              <p><span className="text-gray-400">电话：</span>{detail.patient.phone}</p>
              {detail.patient.diagnosis && <p><span className="text-gray-400">诊断：</span>{detail.patient.diagnosis}</p>}
            </div>
          </div>

          {detail.assessment && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-navy-700">关联评估</h3>
                {detail.assessment.status === 'PENDING' && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">未跟进</span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">评估内容：</span>{detail.assessment.content}</p>
                {detail.assessment.result && <p><span className="text-gray-400">评估结果：</span>{detail.assessment.result}</p>}
                <p><span className="text-gray-400">评估时间：</span>{new Date(detail.assessment.assessedAt).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          )}

          {detail.alerts.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-navy-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                关联预警
              </h3>
              <div className="space-y-2">
                {detail.alerts.map((alert) => (
                  <AlertBadge key={alert.id} type={alert.type as 'PLAN_DISRUPTED' | 'ASSESSMENT_NOT_FOLLOWED' | 'EQUIPMENT_CONFLICT'} level={alert.level as 'HIGH' | 'MEDIUM' | 'LOW'} message={alert.message} resolved={alert.resolved} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="font-semibold text-navy-700 mb-3">快捷操作</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleNotify(detail.patient.name)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Bell size={14} />
                发送通知给患者（占位）
              </button>
              <button
                onClick={handleUpload}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Upload size={14} />
                上传附件
              </button>
              <button
                onClick={() => handleNotify('相关治疗师')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm bg-accent-50 text-accent-600 rounded-lg hover:bg-accent-100 transition-colors"
              >
                <Send size={14} />
                外部通知（短信/微信占位）
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-navy-700 mb-4">上传附件</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4">
              <Upload size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
              <p className="text-xs text-gray-400 mt-1">（占位：实际未上传至服务器）</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">取消</button>
              <button onClick={handleUploadConfirm} className="px-4 py-2 text-sm bg-navy-500 text-white rounded-lg hover:bg-navy-600">确认上传</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/lib/toast-store'
import CheckinStatusBadge from '@/components/CheckinStatusBadge'
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Upload,
  Paperclip,
  ChevronDown,
  Activity,
  Wrench,
  Bell,
  Send,
} from 'lucide-react'

interface CheckinDetail {
  id: string
  checkinTime: string | null
  completeTime: string | null
  status: string
  equipmentUsed: string | null
  remark: string | null
  createdAt: string
  patient: { id: string; name: string; phone: string; age: number; diagnosis: string | null }
  schedule: {
    id: string
    treatmentType: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    status: string
    therapist: { id: string; user: { name: string }; specialty: string | null }
    equipment: { id: string; name: string; location: string | null } | null
    assessment: { id: string; content: string; result: string | null } | null
    statusLogs: { fromStatus: string | null; toStatus: string; operatorId: string; operatorRole: string; remark: string | null; createdAt: string }[]
  }
  checkinLogs: { fromStatus: string | null; toStatus: string; operatorId: string; remark: string | null; createdAt: string }[]
  attachments: { id: string; fileName: string; fileType: string; uploader: { name: string }; uploadedAt: string }[]
}

export default function CheckinDetailPage() {
  const { userId, hydrated } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const params = useParams()
  const [detail, setDetail] = useState<CheckinDetail | null>(null)
  const [loading, setLoading] = useState(true)

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
      const res = await fetch(`/api/checkins/${params.id}`)
      const data = await res.json()
      setDetail(data)
    } catch {
      addToast('获取详情失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleNotify = (target: string) => {
    addToast(`已发送通知给${target}（占位）`, 'info')
  }

  const handleUpload = () => {
    addToast('文件上传成功（占位）', 'success')
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
    return <div className="p-8 text-center text-gray-400">未找到签到记录</div>
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
            <div className="flex items-center gap-3 mb-4">
              <CheckinStatusBadge status={detail.status as 'WAITING' | 'CHECKED_IN' | 'IN_TREATMENT' | 'COMPLETED' | 'CANCELLED'} size="md" />
              <h2 className="text-xl font-bold text-navy-700">{detail.schedule.treatmentType}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User size={14} className="text-gray-400" />
                患者：{detail.patient.name}（{detail.patient.age}岁）
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={14} className="text-gray-400" />
                排班时间：{detail.schedule.scheduledDate} {detail.schedule.scheduledTime}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Activity size={14} className="text-gray-400" />
                治疗师：{detail.schedule.therapist.user.name}
              </div>
              {detail.equipmentUsed && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Wrench size={14} className="text-gray-400" />
                  使用器械：{detail.equipmentUsed}
                </div>
              )}
              {detail.checkinTime && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={14} className="text-gray-400" />
                  签到时间：{new Date(detail.checkinTime).toLocaleString('zh-CN')}
                </div>
              )}
              {detail.completeTime && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={14} className="text-gray-400" />
                  完成时间：{new Date(detail.completeTime).toLocaleString('zh-CN')}
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
              签到消课历史回看
            </h3>
            <div className="relative pl-6">
              {detail.checkinLogs.map((log, index) => (
                <div key={index} className="relative pb-6 last:pb-0">
                  <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow-sm" />
                  {index < detail.checkinLogs.length - 1 && (
                    <div className="absolute left-[-16px] top-4 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="ml-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-navy-700">{log.fromStatus || '初始'}</span>
                      <ChevronDown size={12} className="text-gray-400 -rotate-90" />
                      <span className="font-medium text-navy-700">{log.toStatus}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </div>
                    {log.remark && (
                      <p className="text-xs text-gray-500 mt-1">{log.remark}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {detail.schedule.statusLogs.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
                <Activity size={16} />
                排班状态变更历史
              </h3>
              <div className="relative pl-6">
                {detail.schedule.statusLogs.map((log, index) => (
                  <div key={index} className="relative pb-6 last:pb-0">
                    <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full bg-navy-400 border-2 border-white shadow-sm" />
                    {index < detail.schedule.statusLogs.length - 1 && (
                      <div className="absolute left-[-16px] top-4 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    <div className="ml-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-navy-700">{log.fromStatus || '初始'}</span>
                        <ChevronDown size={12} className="text-gray-400 -rotate-90" />
                        <span className="font-medium text-navy-700">{log.toStatus}</span>
                        <span className="text-xs text-gray-400">({log.operatorRole === 'THERAPIST' ? '治疗师' : log.operatorRole === 'RECEPTION' ? '前台' : '主任'})</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString('zh-CN')}</div>
                      {log.remark && <p className="text-xs text-gray-500 mt-1">{log.remark}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {detail.schedule.assessment && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-navy-700 mb-3">关联评估</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">评估内容：</span>{detail.schedule.assessment.content}</p>
                {detail.schedule.assessment.result && <p><span className="text-gray-400">评估结果：</span>{detail.schedule.assessment.result}</p>}
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
                通知患者（占位）
              </button>
              <button
                onClick={() => handleNotify(detail.schedule.therapist.user.name)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Send size={14} />
                通知治疗师（占位）
              </button>
              <button
                onClick={handleUpload}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Upload size={14} />
                上传附件
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

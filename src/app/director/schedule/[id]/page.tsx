'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/lib/toast-store'
import { ScheduleStatus, CheckinStatus, SCHEDULE_STATUS_LABELS, CHECKIN_STATUS_LABELS, ROLE_LABELS, UserRole } from '@/lib/types'
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
  Filter,
  AlertCircle,
} from 'lucide-react'

interface StatusLogItem {
  id: string
  fromStatus: string | null
  toStatus: string
  operatorId: string
  operatorRole: string
  remark: string | null
  createdAt: string
  operator?: { name: string } | null
}

interface AttachmentItem {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: string
  uploader?: { name: string } | null
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
  therapist: { id: string; user?: { name: string } | null; specialty: string | null }
  equipment: { id: string; name: string; location: string | null; status: string } | null
  assessment: { id: string; content: string; result: string | null; status: string; assessedAt: string } | null
  statusLogs: StatusLogItem[]
  checkins: { id: string; status: string; checkinTime: string | null; completeTime: string | null; checkinLogs: { fromStatus: string | null; toStatus: string; remark: string | null; createdAt: string; operator?: { name: string } | null }[]; attachments: AttachmentItem[] }[]
  attachments: AttachmentItem[]
  alerts: { id: string; type: string; level: string; message: string; resolved: boolean }[]
}

export default function DirectorScheduleDetailPage() {
  const { userId, userRole, hydrated } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const params = useParams()
  const [detail, setDetail] = useState<ScheduleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    toStatus: ScheduleStatus
    label: string
    defaultRemark: string
  } | null>(null)
  const [actionRemark, setActionRemark] = useState('')
  const [timelineRoleFilter, setTimelineRoleFilter] = useState<string>('ALL')
  const [timelineStatusFilter, setTimelineStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    if (!hydrated) return
    if (!userId || userRole !== 'DIRECTOR') {
      router.push('/login')
      return
    }
    fetchDetail()
  }, [userId, userRole, hydrated, params.id])

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
        body: JSON.stringify({ action: 'status', toStatus, operatorId: userId, operatorRole: 'DIRECTOR', remark }),
      })
      if (res.ok) {
        addToast('状态已更新', 'success')
        setPendingAction(null)
        setActionRemark('')
        fetchDetail()
      }
    } catch {
      addToast('操作失败', 'error')
    }
  }

  const openRemarkModal = (toStatus: ScheduleStatus, label: string, defaultRemark: string) => {
    setPendingAction({ toStatus, label, defaultRemark })
    setActionRemark(defaultRemark)
  }

  const confirmAction = () => {
    if (!pendingAction) return
    handleStatusChange(pendingAction.toStatus, actionRemark.trim() || pendingAction.defaultRemark)
  }

  const ATTENTION_STATUSES: ScheduleStatus[] = ['URGED', 'RETURNED', 'SUPPLEMENTING']

  const getAttentionTag = (toStatus: string) => {
    if (toStatus === 'URGED') return { label: '催促', cls: 'bg-amber-100 text-amber-700' }
    if (toStatus === 'RETURNED') return { label: '退回', cls: 'bg-red-100 text-red-700' }
    if (toStatus === 'SUPPLEMENTING') return { label: '补材料', cls: 'bg-blue-100 text-blue-700' }
    return null
  }

  const filteredLogs = detail?.statusLogs.filter((log) => {
    if (timelineRoleFilter !== 'ALL' && log.operatorRole !== timelineRoleFilter) return false
    if (timelineStatusFilter !== 'ALL') {
      if (timelineStatusFilter === 'ATTENTION') {
        if (!ATTENTION_STATUSES.includes(log.toStatus as ScheduleStatus)) return false
      } else if (log.toStatus !== timelineStatusFilter && log.fromStatus !== timelineStatusFilter) return false
    }
    return true
  }) ?? []

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

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' })
      if (res.ok) {
        addToast('预警已标记为已处理', 'success')
        fetchDetail()
      }
    } catch {
      addToast('操作失败', 'error')
    }
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
        返回
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
                  <>
                    <button onClick={() => openRemarkModal('CONFIRMED', '确认排班', '主任确认排班')} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">确认排班</button>
                    <button onClick={() => openRemarkModal('RETURNED', '退回', '主任退回')} className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100">退回</button>
                  </>
                )}
                {detail.status === 'URGED' && (
                  <button onClick={() => openRemarkModal('CONFIRMED', '确认排班', '催促后确认')} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">确认排班</button>
                )}
                {detail.status === 'RETURNED' && (
                  <button onClick={() => openRemarkModal('SUPPLEMENTING', '要求补材料', '主任要求补材料')} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">要求补材料</button>
                )}
                {detail.status === 'SUPPLEMENTING' && (
                  <button onClick={() => openRemarkModal('PENDING', '材料已补齐', '材料已补齐，重新待确认')} className="px-4 py-2 bg-navy-500 text-white text-sm rounded-lg hover:bg-navy-600">材料已补齐</button>
                )}
                {detail.status === 'CONFIRMED' && (
                  <button onClick={() => openRemarkModal('IN_TREATMENT', '开始治疗', '开始治疗')} className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600">开始治疗</button>
                )}
                {detail.status === 'IN_TREATMENT' && (
                  <button onClick={() => openRemarkModal('COMPLETED', '完成治疗', '治疗已完成')} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">完成治疗</button>
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
                <span>治疗师：{detail.therapist.user?.name || '未知'}{detail.therapist.specialty ? `（${detail.therapist.specialty}）` : ''}</span>
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-navy-700 flex items-center gap-2">
                <Clock size={16} />
                状态变更历史
              </h3>
              <span className="text-xs text-gray-400">
                {filteredLogs.length}/{detail.statusLogs.length} 条记录
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Filter size={12} className="text-gray-400" />
              <select
                value={timelineRoleFilter}
                onChange={(e) => setTimelineRoleFilter(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-navy-300"
              >
                <option value="ALL">全部角色</option>
                <option value="THERAPIST">康复治疗师</option>
                <option value="RECEPTION">前台</option>
                <option value="DIRECTOR">科室主任</option>
              </select>
              <select
                value={timelineStatusFilter}
                onChange={(e) => setTimelineStatusFilter(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-navy-300"
              >
                <option value="ALL">全部状态</option>
                <option value="ATTENTION">⚡ 催促/退回/补材料</option>
                <option value="PENDING">待确认</option>
                <option value="URGED">已催促</option>
                <option value="CONFIRMED">已确认</option>
                <option value="RETURNED">已退回</option>
                <option value="SUPPLEMENTING">补材料中</option>
                <option value="IN_TREATMENT">治疗中</option>
                <option value="COMPLETED">已完成</option>
              </select>
              {(timelineRoleFilter !== 'ALL' || timelineStatusFilter !== 'ALL') && (
                <button
                  onClick={() => { setTimelineRoleFilter('ALL'); setTimelineStatusFilter('ALL') }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  重置
                </button>
              )}
            </div>
            {detail.statusLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无状态变更记录</p>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">无匹配的状态变更记录</p>
                <p className="text-xs text-gray-300 mt-1">请调整筛选条件</p>
              </div>
            ) : (
              <div className="relative pl-6">
                {filteredLogs.map((log, index) => {
                  const tag = getAttentionTag(log.toStatus)
                  return (
                    <div key={log.id} className="relative pb-6 last:pb-0">
                      <div className={`absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                        tag ? (log.toStatus === 'URGED' ? 'bg-amber-400' : log.toStatus === 'RETURNED' ? 'bg-red-400' : 'bg-blue-400') : 'bg-navy-400'
                      }`} />
                      {index < filteredLogs.length - 1 && (
                        <div className="absolute left-[-16px] top-4 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="ml-2">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <span className="font-medium text-navy-700">
                            {log.fromStatus ? SCHEDULE_STATUS_LABELS[log.fromStatus as ScheduleStatus] : '初始'}
                          </span>
                          <ChevronDown size={12} className="text-gray-400 -rotate-90" />
                          <span className="font-medium text-navy-700">
                            {SCHEDULE_STATUS_LABELS[log.toStatus as ScheduleStatus]}
                          </span>
                          {tag && (
                            <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${tag.cls}`}>
                              {tag.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span>{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                          <span>操作人：{log.operator?.name || '系统'}（{ROLE_LABELS[log.operatorRole as UserRole] || log.operatorRole}）</span>
                        </div>
                        {log.remark && (
                          <p className={`text-xs mt-1 ${tag ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{log.remark}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
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
                      <span className="text-sm font-medium">签到状态：{CHECKIN_STATUS_LABELS[checkin.status as CheckinStatus] || checkin.status}</span>
                      {checkin.checkinTime && (
                        <span className="text-xs text-gray-400">签到时间：{new Date(checkin.checkinTime).toLocaleString('zh-CN')}</span>
                      )}
                    </div>
                    {checkin.completeTime && (
                      <div className="text-xs text-gray-400 mb-2">完成时间：{new Date(checkin.completeTime).toLocaleString('zh-CN')}</div>
                    )}
                    {checkin.checkinLogs.length > 0 && (
                      <div className="pl-4 border-l-2 border-gray-200 mt-2 space-y-2">
                        {checkin.checkinLogs.map((log, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            <span className="text-gray-700">{CHECKIN_STATUS_LABELS[log.fromStatus as CheckinStatus] || log.fromStatus || '初始'} → {CHECKIN_STATUS_LABELS[log.toStatus as CheckinStatus] || log.toStatus}</span>
                            {log.remark && <span className="ml-2">{log.remark}</span>}
                            <span className="ml-2 text-gray-400">{log.operator?.name || '系统'} · {new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                    <span className="text-xs text-gray-400">{att.uploader?.name || '未知'} · {new Date(att.uploadedAt).toLocaleDateString('zh-CN')}</span>
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
              <div className="space-y-3">
                {detail.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <AlertBadge type={alert.type as 'PLAN_DISRUPTED' | 'ASSESSMENT_NOT_FOLLOWED' | 'EQUIPMENT_CONFLICT'} level={alert.level as 'HIGH' | 'MEDIUM' | 'LOW'} message={alert.message} resolved={alert.resolved} />
                    </div>
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 flex-shrink-0"
                      >
                        标记已处理
                      </button>
                    )}
                  </div>
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
                通知患者（占位）
              </button>
              <button
                onClick={() => handleNotify(detail.therapist.user?.name || '治疗师')}
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

      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-navy-700 mb-1">{pendingAction.label}</h3>
            <p className="text-sm text-gray-500 mb-4">
              将排班状态从 <span className="font-medium text-navy-700">{SCHEDULE_STATUS_LABELS[detail.status]}</span> 变更为 <span className="font-medium text-emerald-600">{SCHEDULE_STATUS_LABELS[pendingAction.toStatus]}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">操作备注（选填）</label>
              <textarea
                value={actionRemark}
                onChange={(e) => setActionRemark(e.target.value)}
                placeholder="请填写原因或备注信息…"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setPendingAction(null); setActionRemark('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 text-sm bg-navy-500 text-white rounded-lg hover:bg-navy-600"
              >
                确认{pendingAction.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

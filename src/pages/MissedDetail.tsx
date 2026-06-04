import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCircle, User, FileCheck, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type Role } from '@/stores/appStore'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'

type MissedStatus = 'pending' | 'reminded' | 'confirmed' | 'completed' | 'closed'

interface MissedItem {
  id: string
  examNo: string
  patientName: string
  itemName: string
  requiredDept: string
  status: MissedStatus
  remindedAt: string | null
  confirmedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface LogEntry {
  operatorRole: Role
  operatorName: string
  action: string
  detail: string
  createdAt: string
}

export default function MissedDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole } = useAppStore()

  const [item, setItem] = useState<MissedItem | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetch(`/api/missed-items/${id}`).then((r) => r.json()),
      fetch(`/api/missed-items/${id}/logs`).then((r) => r.json()),
    ])
      .then(([itemData, logsData]) => {
        setItem(itemData.data ?? itemData)
        setLogs(logsData.data ?? logsData ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleAction = async (action: string) => {
    if (!id) return
    setSubmitting(true)
    try {
      const roleMap: Record<string, string> = {
        front_desk: '前台导检员',
        doctor: '科室医生',
        reviewer: '报告审核员',
      }
      const operatorName = roleMap[currentRole] || '未知操作员'
      const res = await fetch(`/api/missed-items/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName }),
      })
      if (res.ok) {
        const updated = await fetch(`/api/missed-items/${id}`).then((r) => r.json())
        setItem(updated.data ?? updated)
        const updatedLogs = await fetch(`/api/missed-items/${id}/logs`).then((r) => r.json())
        setLogs(updatedLogs.data ?? updatedLogs ?? [])
      }
    } catch {} finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  if (!item) {
    return <div className="flex items-center justify-center h-64 text-gray-400">未找到该漏项记录</div>
  }

  const showRemindBtn = currentRole === 'front_desk' && item.status === 'pending'
  const showConfirmBtn = currentRole === 'doctor' && item.status === 'reminded'
  const showCompleteBtn = currentRole === 'doctor' && item.status === 'confirmed'
  const showCloseBtn = currentRole === 'reviewer' && item.status === 'completed'

  const flowSteps = [
    { key: 'pending', label: '待处理', icon: <AlertCircle className="w-4 h-4" />, role: '系统检测' },
    { key: 'reminded', label: '已提醒', icon: <Bell className="w-4 h-4" />, role: '前台导检' },
    { key: 'confirmed', label: '待补检', icon: <User className="w-4 h-4" />, role: '科室医生' },
    { key: 'completed', label: '已补检', icon: <CheckCircle className="w-4 h-4" />, role: '科室医生' },
    { key: 'closed', label: '已关闭', icon: <FileCheck className="w-4 h-4" />, role: '报告审核员' },
  ]

  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['pending', 'reminded', 'confirmed', 'completed', 'closed']
    const currentIdx = statusOrder.indexOf(item.status)
    const stepIdx = statusOrder.indexOf(stepKey)
    if (stepIdx < currentIdx) return 'done'
    if (stepIdx === currentIdx) return 'active'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-warm-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">漏项详情</h1>
      </div>

      <div className="bg-white rounded-lg border border-warm-300 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">漏项流程</h3>
        <div className="flex items-center justify-between">
          {flowSteps.map((step, idx) => {
            const status = getStepStatus(step.key)
            return (
              <div key={step.key} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors',
                      status === 'done' && 'bg-emerald-100 text-emerald-600',
                      status === 'active' && 'bg-primary text-white',
                      status === 'pending' && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {step.icon}
                  </div>
                  <span className={cn(
                    'text-xs font-medium text-center',
                    status === 'done' && 'text-emerald-600',
                    status === 'active' && 'text-primary',
                    status === 'pending' && 'text-gray-400'
                  )}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{step.role}</span>
                </div>
                {idx < flowSteps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2',
                      getStepStatus(flowSteps[idx + 1].key) === 'done' ? 'bg-emerald-300' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-warm-300 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">{item.examNo}</span>
              <StatusBadge status={item.status} type="missed" />
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <span>姓名：{item.patientName}</span>
              <span>漏检项目：{item.itemName}</span>
              <span>应检科室：{item.requiredDept}</span>
              <span>创建时间：{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
              {item.remindedAt && <span>提醒时间：{new Date(item.remindedAt).toLocaleString('zh-CN')}</span>}
              {item.confirmedAt && <span>确认时间：{new Date(item.confirmedAt).toLocaleString('zh-CN')}</span>}
              {item.completedAt && <span>完成时间：{new Date(item.completedAt).toLocaleString('zh-CN')}</span>}
            </div>
          </div>
        </div>
      </div>

      {(showRemindBtn || showConfirmBtn || showCompleteBtn || showCloseBtn) && (
        <div className="bg-white rounded-lg border border-warm-300 p-4 flex items-center gap-3">
          {showRemindBtn && (
            <button
              onClick={() => handleAction('remind')}
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4" /> 发送提醒
            </button>
          )}
          {showConfirmBtn && (
            <button
              onClick={() => handleAction('confirm')}
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              确认
            </button>
          )}
          {showCompleteBtn && (
            <button
              onClick={() => handleAction('complete')}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> 标记补检完成
            </button>
          )}
          {showCloseBtn && (
            <button
              onClick={() => handleAction('close')}
              disabled={submitting}
              className="px-4 py-2 border border-warm-300 text-gray-600 rounded text-sm font-medium hover:bg-warm-100 transition-colors disabled:opacity-50"
            >
              关闭
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-warm-300 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">操作记录</h3>
        <Timeline logs={logs} />
      </div>
    </div>
  )
}

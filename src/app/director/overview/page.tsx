'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/lib/toast-store'
import { AlertType, AlertLevel, ALERT_TYPE_LABELS } from '@/lib/types'
import AlertBadge from '@/components/AlertBadge'
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  Wrench,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react'

interface AlertItem {
  id: string
  type: AlertType
  level: AlertLevel
  message: string
  resolved: boolean
  createdAt: string
  schedule: { id: string; treatmentType: string; patient: { name: string }; therapist: { user: { name: string } } } | null
  equipment: { id: string; name: string; location: string | null } | null
  assessment: { id: string; content: string; patient: { name: string } } | null
}

export default function DirectorOverview() {
  const { userId, userRole, hydrated } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!hydrated) return
    if (!userId || userRole !== 'DIRECTOR') {
      router.push('/login')
      return
    }
    fetchAlerts()
  }, [userId, userRole, hydrated, router])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/alerts')
      const data = await res.json()
      setAlerts(data)
    } catch {
      addToast('获取预警数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' })
      if (res.ok) {
        addToast('预警已标记为已处理', 'success')
        fetchAlerts()
      }
    } catch {
      addToast('操作失败', 'error')
    }
  }

  const handleNotify = (name: string) => {
    addToast(`已发送通知给${name}（占位）`, 'info')
  }

  const unresolvedAlerts = alerts.filter((a) => !a.resolved)
  const planAlerts = unresolvedAlerts.filter((a) => a.type === 'PLAN_DISRUPTED')
  const assessmentAlerts = unresolvedAlerts.filter((a) => a.type === 'ASSESSMENT_NOT_FOLLOWED')
  const equipmentAlerts = unresolvedAlerts.filter((a) => a.type === 'EQUIPMENT_CONFLICT')

  const displayAlerts = filter === 'all' ? unresolvedAlerts : unresolvedAlerts.filter((a) => a.type === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">复盘预警总览</h1>
          <p className="text-sm text-gray-500 mt-1">治疗计划打乱 · 评估未跟进 · 器械占用冲突</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-500">治疗计划打乱</p>
              <p className="text-2xl font-bold text-amber-800">{planAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-500">评估未跟进</p>
              <p className="text-2xl font-bold text-blue-800">{assessmentAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-5 border border-red-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Wrench size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-500">器械占用冲突</p>
              <p className="text-2xl font-bold text-red-800">{equipmentAlerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'all' ? 'bg-navy-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          全部未处理 ({unresolvedAlerts.length})
        </button>
        <button
          onClick={() => setFilter('PLAN_DISRUPTED')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'PLAN_DISRUPTED' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          计划打乱 ({planAlerts.length})
        </button>
        <button
          onClick={() => setFilter('ASSESSMENT_NOT_FOLLOWED')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'ASSESSMENT_NOT_FOLLOWED' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          评估未跟进 ({assessmentAlerts.length})
        </button>
        <button
          onClick={() => setFilter('EQUIPMENT_CONFLICT')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'EQUIPMENT_CONFLICT' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          器械冲突 ({equipmentAlerts.length})
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
      ) : displayAlerts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShieldCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p>暂无未处理预警</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertBadge type={alert.type} level={alert.level} message={alert.message} resolved={alert.resolved} />

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    {alert.schedule && (
                      <>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {alert.schedule.patient.name}
                        </span>
                        <span>{alert.schedule.treatmentType}</span>
                        <span>治疗师：{alert.schedule.therapist.user.name}</span>
                        <button
                          onClick={() => router.push(`/director/schedule/${alert.schedule.id}`)}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                        >
                          查看排班 →
                        </button>
                      </>
                    )}
                    {alert.equipment && (
                      <span className="flex items-center gap-1">
                        <Wrench size={12} />
                        {alert.equipment.name}（{alert.equipment.location}）
                      </span>
                    )}
                    {alert.assessment && (
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {alert.assessment.patient.name} - {alert.assessment.content}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(alert.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {alert.schedule && (
                    <button
                      onClick={() => handleNotify(alert.schedule.therapist.user.name)}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      通知治疗师
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle size={12} />
                    标记已处理
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.filter((a) => a.resolved).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy-700 mb-4">已处理预警</h2>
          <div className="space-y-2">
            {alerts.filter((a) => a.resolved).map((alert) => (
              <div key={alert.id} className="bg-gray-50 rounded-lg px-4 py-3 opacity-60">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="font-medium">{ALERT_TYPE_LABELS[alert.type]}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

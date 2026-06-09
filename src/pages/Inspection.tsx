import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import { ShieldCheck, AlertTriangle, Bell, Clock, Plus, X } from 'lucide-react'
import type { InspectionPlan, Container, NotifiedStatus, InspectionStatus } from '@/shared/types'

const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  planned: '已计划',
  in_progress: '查验中',
  completed: '已完成',
}

const NOTIFIED_STATUS_LABELS: Record<NotifiedStatus, string> = {
  not_notified: '未通知',
  notified: '已通知',
}

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'not_notified', label: '待通知' },
  { key: 'notified', label: '已通知' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

const ROLE_LABELS: Record<string, string> = {
  gate_operator: '闸口操作员',
  dispatcher: '调度员',
  customer_service: '客服专员',
}

const notifiedStatusColors: Record<NotifiedStatus, string> = {
  not_notified: 'bg-red-100 text-red-700',
  notified: 'bg-emerald-100 text-emerald-700',
}

export default function Inspection() {
  const { currentRole } = useAppStore()
  const [plans, setPlans] = useState<InspectionPlan[]>([])
  const [missed, setMissed] = useState<InspectionPlan[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    container_id: '',
    container_no: '',
    planned_time: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [plansData, missedData, containersData] = await Promise.all([
        api.inspections.list(),
        api.inspections.missedNotifications(),
        api.containers.list(),
      ])
      setPlans(plansData)
      setMissed(missedData)
      setContainers(containersData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const availableContainers = containers.filter((c) => c.status !== 'departed')

  const filtered = filter === 'all'
    ? plans
    : plans.filter((p) => {
        if (filter === 'not_notified' || filter === 'notified') return p.notified_status === filter
        return p.status === filter
      })

  const sorted = [...filtered].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  )

  const isOverdue = (plan: InspectionPlan) =>
    plan.status !== 'completed' && new Date(plan.planned_time) < new Date()

  const handleNotify = async (id: string) => {
    await api.inspections.notify(id)
    fetchData()
  }

  const handleUpdateStatus = async (id: string, status: InspectionStatus) => {
    await api.inspections.update(id, { status })
    fetchData()
  }

  const handleCreate = async () => {
    if (!createForm.container_id || !createForm.planned_time || submitting) return
    setSubmitting(true)
    try {
      await api.inspections.create({
        container_id: createForm.container_id,
        container_no: createForm.container_no,
        planned_time: createForm.planned_time,
        created_by: ROLE_LABELS[currentRole],
      })
      setShowCreateModal(false)
      setCreateForm({ container_id: '', container_no: '', planned_time: '' })
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  const selectContainer = (id: string) => {
    const c = availableContainers.find((c) => c.id === id)
    if (c) {
      setCreateForm((prev) => ({ ...prev, container_id: c.id, container_no: c.container_no }))
    }
  }

  const canCreate = currentRole === 'dispatcher'
  const canNotify = currentRole === 'dispatcher' || currentRole === 'customer_service'
  const canUpdateStatus = currentRole === 'dispatcher'
  const isReadOnly = currentRole === 'gate_operator'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="w-8 h-8 text-port-navy animate-pulse" />
        <span className="ml-2 text-gray-500">加载查验数据...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-port-navy" />
          <h1 className="text-xl font-bold text-port-navy">查验计划</h1>
        </div>
        {canCreate && (
          <button
            className="btn-primary text-sm flex items-center gap-1.5"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            新建查验计划
          </button>
        )}
      </div>

      {missed.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500 animate-blink-warning" />
            <span className="font-bold text-red-700">漏通知查验</span>
            <span className="status-badge bg-red-100 text-red-700">{missed.length} 条</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missed.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-red-200 rounded-lg px-3 py-2 text-sm"
              >
                <span className="font-mono font-medium text-red-700">{m.container_no}</span>
                <span className="text-gray-500 ml-2">
                  计划时间: {new Date(m.planned_time).toLocaleString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-port-orange text-white'
                : 'bg-white text-gray-600 border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left font-medium">箱号</th>
              <th className="px-4 py-3 text-left font-medium">计划时间</th>
              <th className="px-4 py-3 text-left font-medium">通知状态</th>
              <th className="px-4 py-3 text-left font-medium">计划状态</th>
              <th className="px-4 py-3 text-left font-medium">创建人</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-gray-50 transition-colors ${
                  isOverdue(p) ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs">{p.container_no}</td>
                <td className="px-4 py-3 text-gray-700">
                  {new Date(p.planned_time).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`status-badge ${notifiedStatusColors[p.notified_status]}`}
                  >
                    {NOTIFIED_STATUS_LABELS[p.notified_status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`status-badge ${
                      p.status === 'planned'
                        ? 'bg-blue-100 text-blue-700'
                        : p.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {INSPECTION_STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.created_by}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {canNotify && p.notified_status === 'not_notified' && (
                      <button
                        className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1"
                        onClick={() => handleNotify(p.id)}
                      >
                        <Bell className="w-3 h-3" />
                        发送通知
                      </button>
                    )}
                    {canUpdateStatus && p.status === 'planned' && (
                      <button
                        className="btn-primary text-xs px-2.5 py-1"
                        onClick={() => handleUpdateStatus(p.id, 'in_progress')}
                      >
                        开始查验
                      </button>
                    )}
                    {canUpdateStatus && p.status === 'in_progress' && (
                      <button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                        onClick={() => handleUpdateStatus(p.id, 'completed')}
                      >
                        完成查验
                      </button>
                    )}
                    {isReadOnly && (
                      <span className="text-gray-400 text-xs">只读</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="text-center py-8 text-gray-400">暂无查验计划</div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-port-navy">新建查验计划</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择箱号
                </label>
                <select
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange"
                  value={createForm.container_id}
                  onChange={(e) => selectContainer(e.target.value)}
                >
                  <option value="">请选择集装箱</option>
                  {availableContainers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.container_no} ({c.type} - {c.customer_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  计划时间
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange"
                  value={createForm.planned_time}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, planned_time: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className="btn-secondary flex-1 text-sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button
                  className="btn-primary flex-1 text-sm"
                  disabled={!createForm.container_id || !createForm.planned_time || submitting}
                  onClick={handleCreate}
                >
                  {submitting ? '提交中...' : '确认创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

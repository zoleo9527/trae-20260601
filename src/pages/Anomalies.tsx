import { useEffect, useState } from 'react'
import { Plus, X, ExternalLink } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'

const severityOptions = [
  { value: '', label: '全部严重程度' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'open', label: '未关闭' },
  { value: 'resolved', label: '已关闭' },
]

const severityBorderColors: Record<string, string> = {
  high: 'border-l-4 border-warning-red',
  medium: 'border-l-4 border-climbing-orange',
  low: 'border-l-4 border-info-blue',
}

export default function Anomalies() {
  const { anomalies, loadingAnomalies, bookings, equipmentIssuances, fetchAnomalies, createAnomaly, resolveAnomaly, fetchBookings, fetchEquipmentIssuances } = useStore()
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resolveTarget, setResolveTarget] = useState<number | null>(null)
  const [createForm, setCreateForm] = useState({
    booking_id: '',
    issuance_id: '',
    description: '',
    severity: 'medium',
    reported_by: '',
  })
  const [resolveForm, setResolveForm] = useState({
    resolution: '',
    resolved_by: '',
  })

  useEffect(() => {
    fetchBookings()
    fetchEquipmentIssuances()
  }, [fetchBookings, fetchEquipmentIssuances])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filterStatus) params.status = filterStatus
    if (filterSeverity) params.severity = filterSeverity
    fetchAnomalies(params)
  }, [filterStatus, filterSeverity, fetchAnomalies])

  const handleCreate = async () => {
    if (!createForm.description || !createForm.reported_by) return
    await createAnomaly({
      booking_id: createForm.booking_id ? Number(createForm.booking_id) : null,
      issuance_id: createForm.issuance_id ? Number(createForm.issuance_id) : null,
      description: createForm.description,
      severity: createForm.severity as 'low' | 'medium' | 'high',
      reported_by: createForm.reported_by,
    })
    setShowCreateModal(false)
    setCreateForm({ booking_id: '', issuance_id: '', description: '', severity: 'medium', reported_by: '' })
    fetchAnomalies()
  }

  const handleResolve = async () => {
    if (!resolveTarget || !resolveForm.resolution || !resolveForm.resolved_by) return
    await resolveAnomaly(resolveTarget, {
      resolution: resolveForm.resolution,
      resolved_by: resolveForm.resolved_by,
    })
    setResolveTarget(null)
    setResolveForm({ resolution: '', resolved_by: '' })
    fetchAnomalies()
  }

  const getBookingLabel = (bookingId: number | null) => {
    if (!bookingId) return null
    const b = bookings.find((x) => x.id === bookingId)
    return b ? `预约 #${b.id} ${b.member_name}` : `预约 #${bookingId}`
  }

  const getIssuanceLabel = (issuanceId: number | null) => {
    if (!issuanceId) return null
    const e = equipmentIssuances.find((x) => x.id === issuanceId)
    return e ? `装备 #${e.id} ${e.equipment_type}` : `装备 #${issuanceId}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
          >
            {severityOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-climbing-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          上报异常
        </button>
      </div>

      {loadingAnomalies ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : anomalies.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">暂无异常记录</div>
      ) : (
        <div className="grid gap-4">
          {anomalies.map((a) => (
            <div key={a.id} className={`bg-white rounded-lg shadow p-5 ${severityBorderColors[a.severity]}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge type="severity" status={a.severity} />
                    <StatusBadge type="anomaly" status={a.status} />
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{a.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {a.booking_id && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {getBookingLabel(a.booking_id)}
                      </span>
                    )}
                    {a.issuance_id && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {getIssuanceLabel(a.issuance_id)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">上报人: {a.reported_by} · {a.created_at}</p>
                </div>
                {a.status === 'open' ? (
                  <button
                    onClick={() => setResolveTarget(a.id)}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-success-green hover:bg-green-600 text-white shrink-0"
                  >
                    处理
                  </button>
                ) : (
                  <div className="text-xs text-gray-500 shrink-0 text-right">
                    <p>处理人: {a.resolved_by}</p>
                    <p className="mt-1">处理结果: {a.resolution}</p>
                    {a.resolved_at && <p className="mt-1">{a.resolved_at}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-rock-gray">上报异常</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联预约（可选）</label>
                <select
                  value={createForm.booking_id}
                  onChange={(e) => setCreateForm({ ...createForm, booking_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                >
                  <option value="">不关联</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>#{b.id} {b.member_name} - {b.course_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联装备记录（可选）</label>
                <select
                  value={createForm.issuance_id}
                  onChange={(e) => setCreateForm({ ...createForm, issuance_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                >
                  <option value="">不关联</option>
                  {equipmentIssuances.map((e) => (
                    <option key={e.id} value={e.id}>#{e.id} {e.member_name} - {e.equipment_type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                <select
                  value={createForm.severity}
                  onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上报人</label>
                <input
                  value={createForm.reported_by}
                  onChange={(e) => setCreateForm({ ...createForm, reported_by: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm text-white bg-climbing-orange rounded-lg hover:bg-orange-600">提交</button>
            </div>
          </div>
        </div>
      )}

      {resolveTarget !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-rock-gray">处理异常</h3>
              <button onClick={() => setResolveTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理措施</label>
                <textarea
                  value={resolveForm.resolution}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理人</label>
                <input
                  value={resolveForm.resolved_by}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolved_by: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-climbing-orange"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setResolveTarget(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleResolve} className="px-4 py-2 text-sm text-white bg-success-green rounded-lg hover:bg-green-600">确认处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { FleetAppointmentDetail, FleetAppointmentAction, FleetAppointmentException, AttachmentCreate } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import { ArrowLeft, CheckCircle, MapPin, Flag, XCircle, AlertTriangle, Upload } from 'lucide-react'

type ActionForm = { operator: string; notes: string }
type ActiveAction = 'confirm' | 'arrive' | 'complete' | 'cancel' | 'exception' | null

export default function FleetAppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<FleetAppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<ActiveAction>(null)
  const [actionForm, setActionForm] = useState<ActionForm>({ operator: '', notes: '' })
  const [exceptionType, setExceptionType] = useState('其他')
  const [attachmentForm, setAttachmentForm] = useState<AttachmentCreate>({ file_name: '', file_type: '', file_size: null, uploaded_by: '' })

  const fetchDetail = async () => {
    if (!id) return
    try {
      const data = await api.fleetAppointments.get(Number(id))
      setDetail(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const handleSubmitAction = async () => {
    if (!detail || !activeAction || actionLoading) return
    setActionLoading(true)
    try {
      const data: FleetAppointmentAction = { operator: actionForm.operator || undefined, notes: actionForm.notes || undefined }
      if (activeAction === 'confirm') {
        await api.fleetAppointments.confirm(detail.id, data)
      } else if (activeAction === 'arrive') {
        await api.fleetAppointments.arrive(detail.id, data)
      } else if (activeAction === 'complete') {
        await api.fleetAppointments.complete(detail.id, data)
      } else if (activeAction === 'cancel') {
        await api.fleetAppointments.cancel(detail.id, data)
      } else if (activeAction === 'exception') {
        const excData: FleetAppointmentException = {
          exception_type: exceptionType,
          description: actionForm.notes || undefined,
          operator: actionForm.operator || undefined,
        }
        await api.fleetAppointments.exception(detail.id, excData)
      }
      setActiveAction(null)
      setActionForm({ operator: '', notes: '' })
      setExceptionType('其他')
      await fetchDetail()
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddAttachment = async () => {
    if (!detail || !attachmentForm.file_name) return
    await api.fleetAppointments.addAttachment(detail.id, attachmentForm)
    setAttachmentForm({ file_name: '', file_type: '', file_size: null, uploaded_by: '' })
    await fetchDetail()
  }

  const handleResolveException = async (excId: number) => {
    if (!detail) return
    await fetchDetail()
  }

  if (loading) return <p className="text-gray-400">加载中...</p>
  if (!detail) return <p className="text-red-500">未找到该记录</p>

  const actionButtonsConfig = [
    { action: 'confirm' as const, label: '确认预约', icon: CheckCircle, color: 'bg-blue-600 hover:bg-blue-700 text-white', show: detail.status === '待确认' },
    { action: 'arrive' as const, label: '标记到场', icon: MapPin, color: 'bg-purple-600 hover:bg-purple-700 text-white', show: detail.status === '已确认' },
    { action: 'complete' as const, label: '标记完成', icon: Flag, color: 'bg-green-600 hover:bg-green-700 text-white', show: detail.status === '已到场' },
    { action: 'cancel' as const, label: '取消预约', icon: XCircle, color: 'bg-gray-600 hover:bg-gray-700 text-white', show: !['已完成', '已取消'].includes(detail.status) },
    { action: 'exception' as const, label: '标记异常', icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-700 text-white', show: !['已完成', '已取消'].includes(detail.status) },
  ]

  const infoFields = [
    { label: '箱号', value: detail.container?.container_no },
    { label: '箱型', value: detail.container ? `${detail.container.size}${detail.container.type}` : null },
    { label: '车队', value: detail.truck_company },
    { label: '车牌号', value: detail.truck_plate },
    { label: '司机', value: detail.driver_name },
    { label: '联系电话', value: detail.driver_phone },
    { label: '预约日期', value: detail.appointment_date },
    { label: '预约时间', value: detail.appointment_time },
    { label: '操作人', value: detail.operator },
    { label: '创建时间', value: detail.created_at ? new Date(detail.created_at).toLocaleString('zh-CN') : null },
    { label: '确认时间', value: detail.confirmed_at ? new Date(detail.confirmed_at).toLocaleString('zh-CN') : null },
    { label: '完成时间', value: detail.completed_at ? new Date(detail.completed_at).toLocaleString('zh-CN') : null },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/fleet-appointments')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> 返回列表
        </button>
        <h2 className="text-xl font-bold text-gray-900">预约记录 #{detail.id}</h2>
        <StatusBadge status={detail.status} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">基本信息</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {infoFields.map(f => (
            <div key={f.label}>
              <span className="text-gray-500">{f.label}：</span>
              <span className="text-gray-900">{f.value || '-'}</span>
            </div>
          ))}
        </div>
        {detail.notes && (
          <div className="mt-4 text-sm">
            <span className="text-gray-500">备注：</span>
            <span className="text-gray-900">{detail.notes}</span>
          </div>
        )}
      </div>

      {detail.gate_release_id && detail.gate_release && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">闸口放行信息</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">放行记录：</span>
              <Link to={`/gate-releases/${detail.gate_release_id}`} className="text-blue-600 hover:underline">
                闸口放行 #{detail.gate_release_id}
              </Link>
            </div>
            <div>
              <span className="text-gray-500">箱号：</span>
              <span className="text-gray-900">{detail.gate_release.container?.container_no || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">放行状态：</span>
              <StatusBadge status={detail.gate_release.status} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">闸口放行备注（来自闸口放行记录）</p>
            {detail.gate_release.notes ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{detail.gate_release.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无闸口备注</p>
            )}
          </div>
        </div>
      )}

      {actionButtonsConfig.some(b => b.show) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">操作</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {actionButtonsConfig.map(({ action, label, icon: Icon, color, show }) =>
              show ? (
                <button
                  key={action}
                  onClick={() => {
                    setActiveAction(activeAction === action ? null : action)
                    setActionForm({ operator: '', notes: '' })
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${color} ${activeAction === action ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ) : null
            )}
          </div>
          {activeAction && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              {activeAction === 'exception' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">异常类型</label>
                  <select
                    value={exceptionType}
                    onChange={e => setExceptionType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="其他">其他</option>
                    <option value="车辆异常">车辆异常</option>
                    <option value="集装箱异常">集装箱异常</option>
                    <option value="证件异常">证件异常</option>
                    <option value="超时未到">超时未到</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">操作人</label>
                <input
                  type="text"
                  value={actionForm.operator}
                  onChange={e => setActionForm(f => ({ ...f, operator: e.target.value }))}
                  placeholder="请输入操作人"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
                <textarea
                  value={actionForm.notes}
                  onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="请输入备注"
                  rows={2}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitAction}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? '处理中...' : '确认提交'}
                </button>
                <button
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {detail.exception_records.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">异常记录</h3>
          <div className="space-y-3">
            {detail.exception_records.map(exc => (
              <div key={exc.id} className="border rounded-lg p-4 flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">{exc.exception_type}</span>
                    <StatusBadge status={exc.status} />
                  </div>
                  {exc.description && <p className="text-sm text-gray-700">{exc.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {exc.handler && <span>处理人：{exc.handler}</span>}
                    <span>{new Date(exc.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                {exc.status === '待处理' && (
                  <button
                    onClick={() => handleResolveException(exc.id)}
                    className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700"
                  >
                    处理
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">附件</h3>
        {detail.attachments.length > 0 && (
          <div className="space-y-2 mb-4">
            {detail.attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between border rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-900">{att.file_name}</span>
                  {att.file_type && <span className="text-xs text-gray-400">{att.file_type}</span>}
                  {att.file_size && <span className="text-xs text-gray-400">({(att.file_size / 1024).toFixed(1)} KB)</span>}
                </div>
                <div className="text-xs text-gray-400">
                  {att.uploaded_by && <span>{att.uploaded_by} · </span>}
                  {new Date(att.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">添加附件</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">文件名</label>
              <input
                type="text"
                value={attachmentForm.file_name}
                onChange={e => setAttachmentForm(f => ({ ...f, file_name: e.target.value }))}
                placeholder="文件名"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">类型</label>
              <input
                type="text"
                value={attachmentForm.file_type || ''}
                onChange={e => setAttachmentForm(f => ({ ...f, file_type: e.target.value }))}
                placeholder="文件类型"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">上传人</label>
              <input
                type="text"
                value={attachmentForm.uploaded_by || ''}
                onChange={e => setAttachmentForm(f => ({ ...f, uploaded_by: e.target.value }))}
                placeholder="上传人"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleAddAttachment}
              disabled={!attachmentForm.file_name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              添加
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">操作时间线</h3>
        <Timeline events={detail.timeline_events} />
      </div>
    </div>
  )
}

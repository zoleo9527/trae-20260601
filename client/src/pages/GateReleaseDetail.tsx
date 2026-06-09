import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import type { AttachmentCreate, ExceptionHandle, FleetAppointment, GateReleaseDetail } from '@/lib/api'
import { api } from '@/lib/api'
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    MapPin,
    Package,
    Paperclip,
    Phone,
    Plus,
    Truck,
    User,
    XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export default function GateReleaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<GateReleaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [linkedAppointments, setLinkedAppointments] = useState<FleetAppointment[]>([])

  const [showReleaseDialog, setShowReleaseDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [operatorName, setOperatorName] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const [showAttachForm, setShowAttachForm] = useState(false)
  const [attachFileName, setAttachFileName] = useState('')
  const [attachFileType, setAttachFileType] = useState('')
  const [attachFileSize, setAttachFileSize] = useState('')
  const [attachUploadedBy, setAttachUploadedBy] = useState('')

  const [handlingExcId, setHandlingExcId] = useState<number | null>(null)
  const [excHandler, setExcHandler] = useState('')
  const [excResult, setExcResult] = useState('')
  const [excLoading, setExcLoading] = useState(false)

  const fetchDetail = useCallback(() => {
    if (!id) return
    setLoading(true)
    api.gateReleases.get(Number(id))
      .then(data => {
        setDetail(data)
        api.fleetAppointments.list()
          .then(apts => setLinkedAppointments(apts.filter(a => a.gate_release_id === data.id)))
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const refreshAfterAction = () => {
    if (!detail) return
    setLoading(true)
    api.gateReleases.get(detail.id)
      .then(data => {
        setDetail(data)
        api.fleetAppointments.list()
          .then(apts => setLinkedAppointments(apts.filter(a => a.gate_release_id === data.id)))
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }

  const handleRelease = async () => {
    if (!detail || actionLoading) return
    setActionLoading(true)
    try {
      await api.gateReleases.release(detail.id, {
        operator: operatorName || undefined,
        notes: actionNotes || undefined,
      })
      setShowReleaseDialog(false)
      setOperatorName('')
      setActionNotes('')
      refreshAfterAction()
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!detail || actionLoading || !rejectReason) return
    setActionLoading(true)
    try {
      await api.gateReleases.reject(detail.id, {
        operator: operatorName || undefined,
        notes: rejectReason,
      })
      setShowRejectDialog(false)
      setOperatorName('')
      setRejectReason('')
      refreshAfterAction()
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddAttachment = async () => {
    if (!detail || !attachFileName) return
    try {
      const data: AttachmentCreate = {
        file_name: attachFileName,
        file_type: attachFileType || undefined,
        file_size: attachFileSize ? Number(attachFileSize) : undefined,
        uploaded_by: attachUploadedBy || undefined,
      }
      await api.gateReleases.addAttachment(detail.id, data)
      setShowAttachForm(false)
      setAttachFileName('')
      setAttachFileType('')
      setAttachFileSize('')
      setAttachUploadedBy('')
      refreshAfterAction()
    } catch {}
  }

  const handleException = async (excId: number) => {
    if (!excHandler || excLoading) return
    setExcLoading(true)
    try {
      const data: ExceptionHandle = { handler: excHandler, result: excResult || undefined }
      const updated = await api.exceptions.handle(excId, data)
      setHandlingExcId(null)
      setExcHandler('')
      setExcResult('')
      setDetail(prev => {
        if (!prev) return prev
        return {
          ...prev,
          exception_records: prev.exception_records.map(exc =>
            exc.id === excId
              ? { ...exc, status: updated.status, handler: updated.handler, handled_at: updated.handled_at }
              : exc
          ),
          timeline_events: [
            {
              id: -(Date.now()),
              entity_type: updated.entity_type,
              entity_id: updated.entity_id,
              event_type: '异常处理',
              description: `异常已处理，处理人：${updated.handler}` + (excResult ? `，结果：${excResult}` : ''),
              operator: updated.handler,
              created_at: updated.handled_at || new Date().toISOString(),
            },
            ...prev.timeline_events,
          ],
        }
      })
    } finally {
      setExcLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) return <p className="text-gray-400 py-8">加载中...</p>
  if (!detail) return <p className="text-red-500 py-8">未找到该记录</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/gate-releases')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> 返回列表
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">放行记录 #{detail.id}</h2>
          <StatusBadge status={detail.status} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">箱号：</span>
            <span className="font-medium text-gray-900">{detail.container?.container_no || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">箱型：</span>
            <span className="text-gray-900">
              {detail.container ? `${detail.container.size}${detail.container.type}` : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">放行类型：</span>
            <span className="text-gray-900">{detail.release_type}</span>
          </div>
          <div>
            <span className="text-gray-500">车队：</span>
            <span className="text-gray-900">{detail.truck_company || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">车牌号：</span>
            <span className="text-gray-900">{detail.truck_plate || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">司机：</span>
            <span className="text-gray-900">{detail.driver_name || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">联系电话：</span>
            <span className="text-gray-900">{detail.driver_phone || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">堆位：</span>
            <span className="text-gray-900">
              {detail.container?.yard_block && detail.container?.yard_slot
                ? `${detail.container.yard_block}-${detail.container.yard_slot}`
                : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">操作人：</span>
            <span className="text-gray-900">{detail.operator || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">创建时间：</span>
            <span className="text-gray-900">{new Date(detail.created_at).toLocaleString('zh-CN')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">放行时间：</span>
            <span className="text-gray-900">
              {detail.released_at ? new Date(detail.released_at).toLocaleString('zh-CN') : '-'}
            </span>
          </div>
        </div>

        {detail.notes && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium mb-1">
              <FileText size={12} /> 备注
            </div>
            <p className="text-sm text-amber-900">{detail.notes}</p>
          </div>
        )}

        {linkedAppointments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">关联车队预约</h4>
            <div className="space-y-2">
              {linkedAppointments.map(apt => (
                <div key={apt.id} className="flex items-center gap-3 text-sm">
                  <Link to={`/fleet-appointments/${apt.id}`} className="text-primary-600 hover:underline">
                    预约 #{apt.id}
                  </Link>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.status === '待处理' && !showReleaseDialog && !showRejectDialog && (
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={() => setShowReleaseDialog(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <CheckCircle size={16} /> 确认放行
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              <XCircle size={16} /> 异常退回
            </button>
          </div>
        )}

        {showReleaseDialog && (
          <div className="mt-6 pt-4 border-t border-green-200 bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-3">确认放行</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">操作人</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="输入操作人姓名"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">备注（可选）</label>
                <textarea
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="输入备注..."
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRelease}
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  确认
                </button>
                <button
                  onClick={() => { setShowReleaseDialog(false); setOperatorName(''); setActionNotes('') }}
                  className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectDialog && (
          <div className="mt-6 pt-4 border-t border-red-200 bg-red-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-3">异常退回</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">退回原因 <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="输入退回原因..."
                  rows={2}
                  className="mt-1 block w-full border border-red-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">操作人</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="输入操作人姓名"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  确认退回
                </button>
                <button
                  onClick={() => { setShowRejectDialog(false); setOperatorName(''); setRejectReason('') }}
                  className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {detail.exception_records.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">异常记录</h3>
          <div className="space-y-3">
            {detail.exception_records.map(exc => (
              <div key={exc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 shrink-0">
                      {exc.exception_type}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{exc.description || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <StatusBadge status={exc.status} />
                    {exc.handler && <span className="text-xs text-gray-400">处理人：{exc.handler}</span>}
                  </div>
                </div>
                {exc.status === '待处理' && handlingExcId !== exc.id && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => setHandlingExcId(exc.id)}
                      className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700"
                    >
                      处理
                    </button>
                  </div>
                )}
                {exc.status === '待处理' && handlingExcId === exc.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">处理人 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={excHandler}
                          onChange={e => setExcHandler(e.target.value)}
                          placeholder="输入处理人姓名"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">处理结果</label>
                        <input
                          type="text"
                          value={excResult}
                          onChange={e => setExcResult(e.target.value)}
                          placeholder="输入处理结果"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setHandlingExcId(null); setExcHandler(''); setExcResult('') }}
                        className="px-3 py-1 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleException(exc.id)}
                        disabled={!excHandler || excLoading}
                        className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 disabled:opacity-50"
                      >
                        {excLoading ? '处理中...' : '确认处理'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">附件</h3>
          <button
            onClick={() => setShowAttachForm(!showAttachForm)}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            <Plus size={14} /> 添加附件
          </button>
        </div>

        {showAttachForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">文件名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={attachFileName}
                  onChange={e => setAttachFileName(e.target.value)}
                  placeholder="文件名"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">文件类型</label>
                <input
                  type="text"
                  value={attachFileType}
                  onChange={e => setAttachFileType(e.target.value)}
                  placeholder="如 PDF, PNG"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">文件大小(bytes)</label>
                <input
                  type="text"
                  value={attachFileSize}
                  onChange={e => setAttachFileSize(e.target.value)}
                  placeholder="如 1024"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">上传人</label>
                <input
                  type="text"
                  value={attachUploadedBy}
                  onChange={e => setAttachUploadedBy(e.target.value)}
                  placeholder="上传人"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddAttachment}
                disabled={!attachFileName}
                className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                确认添加
              </button>
              <button
                onClick={() => {
                  setShowAttachForm(false)
                  setAttachFileName('')
                  setAttachFileType('')
                  setAttachFileSize('')
                  setAttachUploadedBy('')
                }}
                className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {detail.attachments.length === 0 ? (
          <p className="text-sm text-gray-400">暂无附件</p>
        ) : (
          <div className="space-y-2">
            {detail.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Paperclip size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{att.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {att.file_type || '未知类型'} · {formatFileSize(att.file_size)}
                    {att.uploaded_by && ` · ${att.uploaded_by}`}
                    · {new Date(att.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">操作时间线</h3>
        <Timeline events={detail.timeline_events} />
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Upload,
  Clock,
  FileText,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useVisitStore } from '@/stores/visitStore'
import { useAnimalStore } from '@/stores/animalStore'
import { useRecallStore } from '@/stores/recallStore'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', cls: 'bg-green-100 text-green-700' },
  need_followup: { label: '需跟进', cls: 'bg-orange-100 text-orange-700' },
  transferred_to_recall: { label: '转异常收回', cls: 'bg-red-100 text-red-700' },
}

const FLOW_NODES = [
  { key: 'pending', label: '待处理' },
  { key: 'completed', label: '已完成' },
  { key: 'need_followup', label: '需跟进' },
  { key: 'transferred_to_recall', label: '转异常收回' },
]

export default function VisitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentVisit, fetchVisit, updateVisit } = useVisitStore()
  const { currentAnimal, fetchAnimal } = useAnimalStore()
  const { currentRecall, fetchRecall } = useRecallStore()

  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferReason, setTransferReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [linkedRecallId, setLinkedRecallId] = useState<number | null>(null)
  const [attachments, setAttachments] = useState<{ id: number; file_name: string; file_path: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) fetchVisit(Number(id))
  }, [id, fetchVisit])

  useEffect(() => {
    if (id) {
      fetch(`/api/attachments/visit/${id}`)
        .then((r) => r.json())
        .then((data) => setAttachments(Array.isArray(data) ? data : []))
        .catch(() => setAttachments([]))
    }
  }, [id])

  useEffect(() => {
    if (currentVisit?.animal_id) {
      fetchAnimal(currentVisit.animal_id)
    }
  }, [currentVisit?.animal_id, fetchAnimal])

  useEffect(() => {
    const recallId = currentVisit?.recall_id ?? (currentVisit as Record<string, unknown>)?.created_recall_id ?? linkedRecallId
    if (recallId && currentVisit?.status === 'transferred_to_recall') {
      fetchRecall(Number(recallId))
    }
  }, [currentVisit, linkedRecallId, fetchRecall])

  async function handleStatusChange(newStatus: string) {
    if (!id) return
    setActionLoading(true)
    try {
      await updateVisit(Number(id), { status: newStatus })
      await fetchVisit(Number(id))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleTransferConfirm() {
    if (!id || !transferReason.trim()) return
    setActionLoading(true)
    try {
      await updateVisit(Number(id), {
        status: 'transferred_to_recall',
        notes: transferReason,
      })
      await fetchVisit(Number(id))
      const updated = useVisitStore.getState().currentVisit
      const createdRecallId = updated?.recall_id ?? (updated as Record<string, unknown>)?.created_recall_id
      if (createdRecallId) setLinkedRecallId(Number(createdRecallId))
      setShowTransferModal(false)
      setTransferReason('')
    } finally {
      setActionLoading(false)
    }
  }

  if (!currentVisit) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        {useVisitStore.getState().loading ? '加载中...' : '回访记录不存在'}
      </div>
    )
  }

  const v = currentVisit as Record<string, unknown>
  const status = currentVisit.status
  const badge = STATUS_BADGE[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }

  const recallId = Number(v.recall_id ?? v.created_recall_id ?? linkedRecallId ?? 0) || null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/visits')} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">回访详情</h1>
        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">状态流转</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {FLOW_NODES.map((node, i) => {
            const isActive = node.key === status
            const isPast =
              (status === 'completed' && i <= 1) ||
              (status === 'need_followup' && (node.key === 'pending' || node.key === 'need_followup')) ||
              (status === 'transferred_to_recall')
            const nodeCls = isActive
              ? 'bg-orange-600 text-white border-orange-600'
              : isPast
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : 'bg-gray-50 text-gray-400 border-gray-200'
            return (
              <div key={node.key} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${nodeCls}`}>
                  {node.label}
                </span>
                {i < FLOW_NODES.length - 1 && (
                  <span className="text-gray-300">→</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {(status === 'pending' || status === 'need_followup') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">操作</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {(status === 'pending' || status === 'need_followup') && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle size={16} />
                标记完成
              </button>
            )}
            {status === 'pending' && (
              <button
                onClick={() => handleStatusChange('need_followup')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <AlertCircle size={16} />
                需跟进
              </button>
            )}
            {(status === 'pending' || status === 'need_followup') && (
              <button
                onClick={() => setShowTransferModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <AlertTriangle size={16} />
                转异常收回
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'transferred_to_recall' && recallId && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-red-700 mb-3">已关联异常收回</h2>
          {currentRecall ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">收回编号：</span>
                <span className="font-medium text-gray-800">#{currentRecall.id}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">收回原因：</span>
                <span className="text-gray-800">{currentRecall.reason}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">收回状态：</span>
                <span className="text-gray-800">{currentRecall.status}</span>
              </div>
              <Link
                to={`/recalls/${recallId}`}
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <ExternalLink size={14} />
                查看异常收回详情
              </Link>
            </div>
          ) : (
            <Link
              to={`/recalls/${recallId}`}
              className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <ExternalLink size={14} />
              查看异常收回详情 #{recallId}
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">回访信息</h2>
          <dl className="space-y-3">
            <div className="flex text-sm">
              <dt className="w-24 text-gray-500 flex-shrink-0">动物名称</dt>
              <dd className="text-gray-800 font-medium">{String(v.animal_name ?? v.animal_id)}</dd>
            </div>
            <div className="flex text-sm">
              <dt className="w-24 text-gray-500 flex-shrink-0">回访日期</dt>
              <dd className="text-gray-800">{v.visit_date ? dayjs(String(v.visit_date)).format('YYYY-MM-DD') : '-'}</dd>
            </div>
            <div className="flex text-sm">
              <dt className="w-24 text-gray-500 flex-shrink-0">回访人</dt>
              <dd className="text-gray-800">{String(v.visitor_name ?? '-')}</dd>
            </div>
            <div className="flex text-sm">
              <dt className="w-24 text-gray-500 flex-shrink-0">健康状态</dt>
              <dd className="text-gray-800">{String(v.health_status ?? '-')}</dd>
            </div>
            <div className="flex text-sm">
              <dt className="w-24 text-gray-500 flex-shrink-0">行为状态</dt>
              <dd className="text-gray-800">{String(v.behavior_status ?? '-')}</dd>
            </div>
            <div className="flex text-sm">
              <dt className="w-24 text-gray-500 flex-shrink-0">环境状态</dt>
              <dd className="text-gray-800">{String(v.environment_status ?? '-')}</dd>
            </div>
            <div className="flex text-sm">
              <dt className="w-24 text-gray-500 flex-shrink-0">下次回访</dt>
              <dd className="text-gray-800">{v.next_visit_date ? dayjs(String(v.next_visit_date)).format('YYYY-MM-DD') : '-'}</dd>
            </div>
            {v.notes && (
              <div className="flex text-sm">
                <dt className="w-24 text-gray-500 flex-shrink-0">备注</dt>
                <dd className="text-gray-800 whitespace-pre-wrap">{String(v.notes)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-6">
          {currentAnimal && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-4">动物信息</h2>
              <dl className="space-y-3">
                <div className="flex text-sm">
                  <dt className="w-24 text-gray-500 flex-shrink-0">名称</dt>
                  <dd className="text-gray-800 font-medium">{currentAnimal.name}</dd>
                </div>
                <div className="flex text-sm">
                  <dt className="w-24 text-gray-500 flex-shrink-0">物种</dt>
                  <dd className="text-gray-800">{currentAnimal.species}</dd>
                </div>
                <div className="flex text-sm">
                  <dt className="w-24 text-gray-500 flex-shrink-0">品种</dt>
                  <dd className="text-gray-800">{currentAnimal.breed ?? '-'}</dd>
                </div>
                <div className="flex text-sm">
                  <dt className="w-24 text-gray-500 flex-shrink-0">当前状态</dt>
                  <dd className="text-gray-800">{currentAnimal.status}</dd>
                </div>
              </dl>
            </div>
          )}

          {v.adoption_id && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-4">关联领养信息</h2>
              <dl className="space-y-3">
                <div className="flex text-sm">
                  <dt className="w-24 text-gray-500 flex-shrink-0">领养编号</dt>
                  <dd className="text-gray-800">#{String(v.adoption_id)}</dd>
                </div>
                {v.adopter_name && (
                  <div className="flex text-sm">
                    <dt className="w-24 text-gray-500 flex-shrink-0">领养人</dt>
                    <dd className="text-gray-800">{String(v.adopter_name)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">附件</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors cursor-pointer">
            <Upload size={14} />
            上传附件
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !id) return
                setUploading(true)
                try {
                  const form = new FormData()
                  form.append('file', file)
                  form.append('entity_type', 'visit')
                  form.append('entity_id', id)
                  const res = await fetch('/api/attachments/upload', { method: 'POST', body: form })
                  if (res.ok) {
                    const list = await fetch(`/api/attachments/visit/${id}`).then((r) => r.json())
                    setAttachments(Array.isArray(list) ? list : [])
                  }
                } finally {
                  setUploading(false)
                  e.target.value = ''
                }
              }}
            />
          </label>
          {uploading && <span className="text-xs text-gray-400">上传中...</span>}
        </div>
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                <FileText size={14} className="text-gray-400" />
                <a href={att.url} target="_blank" rel="noopener noreferrer" download className="flex-1 truncate hover:text-orange-600 transition-colors">{att.file_name}</a>
                <button
                  onClick={async () => {
                    if (!id) return
                    await fetch(`/api/attachments/${att.id}`, { method: 'DELETE' })
                    const list = await fetch(`/api/attachments/visit/${id}`).then((r) => r.json())
                    setAttachments(Array.isArray(list) ? list : [])
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
        {attachments.length === 0 && !uploading && (
          <p className="mt-2 text-xs text-gray-400">暂无附件</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">状态变更记录</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">创建回访记录</p>
              <p className="text-xs text-gray-400">
                {v.created_at ? dayjs(String(v.created_at)).format('YYYY-MM-DD HH:mm') : '-'}
              </p>
            </div>
          </div>
          {status !== 'pending' && (
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                status === 'completed' ? 'bg-green-100' : status === 'need_followup' ? 'bg-orange-100' : 'bg-red-100'
              }`}>
                {status === 'completed' && <CheckCircle size={14} className="text-green-600" />}
                {status === 'need_followup' && <AlertCircle size={14} className="text-orange-600" />}
                {status === 'transferred_to_recall' && <AlertTriangle size={14} className="text-red-600" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  状态变更为 <span className={badge.cls.split(' ').find(c => c.startsWith('text-'))?.replace('text-', '') === undefined ? '' : ''}>{badge.label}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {v.updated_at ? dayjs(String(v.updated_at)).format('YYYY-MM-DD HH:mm') : '-'}
                </p>
              </div>
            </div>
          )}
          {status === 'transferred_to_recall' && v.notes && (
            <div className="flex items-start gap-3 ml-11">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={12} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(v.notes)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTransferModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">转异常收回</h3>
            <p className="text-sm text-gray-500 mb-4">确认将此回访转为异常收回？此操作将自动创建异常收回记录，不可撤销。</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                收回原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="请输入收回原因"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTransferConfirm}
                disabled={actionLoading || !transferReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '确认转异常收回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

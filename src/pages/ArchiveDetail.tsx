import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  History,
  User,
  Phone,
  CreditCard,
  Calendar,
  Stethoscope,
  Heart,
  Package,
  AlertCircle,
  AlertTriangle,
  Eye,
  Archive as ArchiveIcon,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { ArchiveDetail, Note, ChangeLog, ArchiveStatus, Role } from '@/lib/types'
import { ARCHIVE_STATUS_LABELS, CONTRACT_STATUS_LABELS, ROLE_LABELS, FIELD_LABELS } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const ROLE_COLORS: Record<Role, string> = {
  doctor: 'bg-primary-100 text-primary-700',
  nurse: 'bg-blue-100 text-blue-700',
  public_health: 'bg-amber-100 text-amber-700',
}

const SOURCE_LABELS: Record<string, string> = {
  contract: '签约处理',
  archive: '建档处理',
  return: '退回原因',
}

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole, currentUser } = useAppStore()
  const [detail, setDetail] = useState<ArchiveDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'changes'>('info')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [changeNotifVisible, setChangeNotifVisible] = useState(true)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await api.archives.get(id)
      setDetail(data)
    } catch {
      setDetail(null)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleStatusChange = async (newStatus: ArchiveStatus, extra?: Record<string, string>) => {
    if (!detail || submitting) return
    setSubmitting(true)
    try {
      await api.archives.update(detail.id, { status: newStatus, processedBy: currentUser, ...extra })
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
    setSubmitting(false)
  }

  const handleReturn = async () => {
    if (!detail || !returnReason.trim() || submitting) return
    setSubmitting(true)
    try {
      await api.archives.returnArchive(detail.id, {
        reason: returnReason.trim(),
        returnedBy: currentUser,
        returnedByRole: currentRole,
      })
      setShowReturnModal(false)
      setReturnReason('')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '退回失败')
    }
    setSubmitting(false)
  }

  const handleAddNote = async () => {
    if (!detail || !noteText.trim() || submitting) return
    setSubmitting(true)
    try {
      await api.contracts.addNote(detail.contract_id, {
        content: noteText.trim(),
        createdBy: currentUser,
        createdByRole: currentRole,
        source: 'archive',
      })
      setNoteText('')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '添加备注失败')
    }
    setSubmitting(false)
  }

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await api.notifications.markRead(notifId)
      await load()
    } catch {}
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card animate-pulse p-6">
          <div className="h-6 w-64 rounded bg-zinc-200" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="card flex flex-col items-center justify-center py-16">
        <AlertCircle size={32} className="mb-3 text-zinc-300" />
        <p className="text-sm text-zinc-500">档案未找到</p>
        <Link to="/archives" className="btn-secondary mt-3">返回列表</Link>
      </div>
    )
  }

  const canStartProcessing = detail.status === 'pending' && currentRole === 'public_health'
  const canComplete = detail.status === 'processing' && currentRole === 'public_health'
  const canReturn = (detail.status === 'pending' || detail.status === 'processing') && currentRole === 'public_health'
  const canClose = detail.status === 'completed' && currentRole === 'public_health'
  const unreadChangeNotifs = detail.notifications || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/archives')} className="btn-ghost">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">{detail.resident_name || '未知'}</h2>
              <span className={cn('badge', `badge-${detail.status}`)}>
                {ARCHIVE_STATUS_LABELS[detail.status]}
              </span>
              <Link to={`/contracts/${detail.contract_id}`} className="badge bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
                <FileText size={10} className="mr-1" />
                关联签约
              </Link>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">档案编号: {detail.archive_no}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canStartProcessing && (
            <button onClick={() => handleStatusChange('processing')} disabled={submitting} className="btn-primary">
              <Eye size={14} />
              开始建档
            </button>
          )}
          {canComplete && (
            <button onClick={() => handleStatusChange('completed')} disabled={submitting} className="btn-primary">
              <CheckCircle2 size={14} />
              完成建档
            </button>
          )}
          {canReturn && (
            <button onClick={() => setShowReturnModal(true)} disabled={submitting} className="btn-danger">
              <RotateCcw size={14} />
              退回签约
            </button>
          )}
          {canClose && (
            <button onClick={() => handleStatusChange('closed')} disabled={submitting} className="btn-secondary">
              <XCircle size={14} />
              关闭档案
            </button>
          )}
        </div>
      </div>

      {unreadChangeNotifs.length > 0 && changeNotifVisible && (
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-700">
              <AlertTriangle size={16} />
              签约信息已变更，请查看
            </div>
            <button onClick={() => setChangeNotifVisible(false)} className="text-accent-400 hover:text-accent-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1.5">
            {unreadChangeNotifs.map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-zinc-700">
                  <span className={cn(
                    'rounded px-1.5 py-0.5 text-[9px] font-semibold',
                    n.type === 'contract_changed' && 'bg-amber-100 text-amber-700',
                    n.type === 'contract_returned' && 'bg-red-100 text-red-700',
                  )}>
                    {n.type === 'contract_changed' ? '签约变更' : '签约退回'}
                  </span>
                  <span>{n.summary}</span>
                  <span className="text-zinc-400">
                    {new Date(n.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => handleMarkNotificationRead(n.id)}
                  className="text-xs text-accent-600 hover:text-accent-700 font-medium"
                >
                  已知悉
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-zinc-200 pb-0">
        {[
          { key: 'info' as const, label: '签约信息继承', icon: ArchiveIcon },
          { key: 'notes' as const, label: `备注 (${detail.notes?.length || 0})`, icon: MessageSquare },
          { key: 'changes' as const, label: `变更记录 (${detail.change_logs?.length || 0})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-700">关联签约信息</h3>
              <span className={cn('badge', `badge-${detail.contract_status}`)}>
                签约状态: {detail.contract_status ? CONTRACT_STATUS_LABELS[detail.contract_status] : '-'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { icon: User, label: '居民姓名', value: detail.resident_name },
                { icon: CreditCard, label: '签约编号', value: detail.contract_no },
                { icon: FileText, label: '签约类型', value: detail.contract_type },
                { icon: Package, label: '服务包', value: detail.service_package },
                { icon: Calendar, label: '签约期限', value: detail.period_start && detail.period_end
                  ? `${new Date(detail.period_start).toLocaleDateString('zh-CN')} 至 ${new Date(detail.period_end).toLocaleDateString('zh-CN')}`
                  : '-' },
                { icon: Stethoscope, label: '全科医生', value: detail.team_doctor },
                { icon: Heart, label: '护士', value: detail.team_nurse },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <Icon size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                    <div>
                      <div className="text-[10px] text-zinc-400">{item.label}</div>
                      <div className="text-sm text-zinc-800">{item.value || '-'}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {detail.return_reason && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                  <AlertCircle size={14} />
                  退回原因
                </div>
                <p className="mt-1 text-sm text-red-600">{detail.return_reason}</p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
              {detail.processed_by && <span>处理人: {detail.processed_by}</span>}
              {detail.completed_at && <span>完成时间: {new Date(detail.completed_at).toLocaleString('zh-CN')}</span>}
              <span>创建时间: {new Date(detail.created_at).toLocaleString('zh-CN')}</span>
              <span>更新时间: {new Date(detail.updated_at).toLocaleString('zh-CN')}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-700 mb-3">最近备注</h3>
              {(!detail.notes || detail.notes.length === 0) ? (
                <p className="text-xs text-zinc-400">暂无备注</p>
              ) : (
                <div className="space-y-2">
                  {detail.notes.slice(0, 3).map((n) => (
                    <div key={n.id} className={cn(
                      'rounded-lg p-2.5',
                      n.source === 'return' ? 'bg-red-50' : 'bg-zinc-50'
                    )}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={cn('rounded px-1 py-0.5 text-[9px] font-medium', ROLE_COLORS[n.created_by_role])}>
                          {ROLE_LABELS[n.created_by_role]}
                        </span>
                        <span className="text-[10px] text-zinc-400">{n.created_by}</span>
                      </div>
                      <p className="text-xs text-zinc-700">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.change_logs && detail.change_logs.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle size={14} />
                  签约信息有变更
                </div>
                <p className="mt-1 text-[10px] text-amber-600">
                  关联签约有 {detail.change_logs.length} 条变更记录，请查看变更记录标签页
                </p>
                <button
                  onClick={() => setActiveTab('changes')}
                  className="mt-2 text-xs font-medium text-amber-700 underline"
                >
                  查看变更
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <div className="border-b border-zinc-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-zinc-700">备注记录（含签约阶段）</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">签约和建档阶段的所有备注都在这里展示，退回原因也会同步显示</p>
          </div>
          <div className="max-h-96 divide-y divide-zinc-50 overflow-auto scrollbar-thin">
            {(!detail.notes || detail.notes.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <MessageSquare size={24} className="mb-2 opacity-30" />
                <p className="text-xs">暂无备注</p>
              </div>
            ) : (
              detail.notes.map((n: Note) => (
                <div key={n.id} className={cn(
                  'px-5 py-3',
                  n.source === 'return' && 'bg-red-50/50'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', ROLE_COLORS[n.created_by_role])}>
                      {ROLE_LABELS[n.created_by_role]}
                    </span>
                    <span className="text-xs font-medium text-zinc-700">{n.created_by}</span>
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-medium',
                      n.source === 'return' ? 'bg-red-100 text-red-600' : n.source === 'archive' ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                    )}>
                      {SOURCE_LABELS[n.source] || n.source}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(n.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 pl-0.5">{n.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-zinc-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="添加建档备注..."
                className="input-field flex-1"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote() }}
              />
              <button onClick={handleAddNote} disabled={submitting || !noteText.trim()} className="btn-primary">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'changes' && (
        <div className="card">
          <div className="border-b border-zinc-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-zinc-700">变更记录</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">签约进入建档后，任何修改都会在此展示，建档处理人可逐条确认</p>
          </div>
          <div className="max-h-96 overflow-auto scrollbar-thin">
            {(!detail.change_logs || detail.change_logs.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <History size={24} className="mb-2 opacity-30" />
                <p className="text-xs">暂无变更记录</p>
              </div>
            ) : (
              <div className="px-5 py-3">
                <div className="relative space-y-4">
                  {detail.change_logs.map((cl: ChangeLog) => (
                    <div key={cl.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-accent-500 mt-1" />
                        <div className="flex-1 w-px bg-zinc-200" />
                      </div>
                      <div className="min-w-0 flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', ROLE_COLORS[cl.changed_by_role])}>
                            {ROLE_LABELS[cl.changed_by_role]}
                          </span>
                          <span className="text-xs font-medium text-zinc-700">{cl.changed_by}</span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(cl.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className="rounded-lg bg-zinc-50 p-2.5">
                          <span className="text-xs text-zinc-500">
                            {FIELD_LABELS[cl.field] || cl.field}
                          </span>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through">
                              {cl.old_value}
                            </span>
                            <ArrowLeft size={10} className="text-zinc-400" />
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
                              {cl.new_value}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showReturnModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowReturnModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[440px] rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw size={16} className="text-red-600" />
              <h3 className="text-sm font-semibold text-zinc-800">退回签约补录</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              退回后签约状态将变为"已退回"，全科医生将收到通知。退回原因将同步至签约侧作为备注。
            </p>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              退回原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-field min-h-[100px] resize-y mb-4"
              placeholder="请填写退回原因，此原因将同步至签约侧..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowReturnModal(false); setReturnReason('') }} className="btn-secondary text-xs">取消</button>
              <button onClick={handleReturn} disabled={submitting || !returnReason.trim()} className="btn-danger text-xs">
                <RotateCcw size={12} />
                确认退回
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

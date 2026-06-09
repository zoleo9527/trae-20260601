import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
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
} from 'lucide-react'
import { api } from '@/lib/api'
import type { ContractDetail, Note, ChangeLog, ContractStatus, Role } from '@/lib/types'
import { CONTRACT_STATUS_LABELS, ROLE_LABELS, FIELD_LABELS } from '@/lib/types'
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

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole, currentUser } = useAppStore()
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'changes'>('info')

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await api.contracts.get(id)
      setDetail(data)
      await api.recent.add({ userId: currentUser, itemType: 'contract', itemId: id })
    } catch {
      setDetail(null)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleStatusChange = async (newStatus: ContractStatus) => {
    if (!detail || submitting) return
    setSubmitting(true)
    try {
      await api.contracts.update(detail.id, {
        status: newStatus,
        changed_by: currentUser,
        changed_by_role: currentRole,
      })
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
    setSubmitting(false)
  }

  const handleAddNote = async () => {
    if (!detail || !noteText.trim() || submitting) return
    setSubmitting(true)
    try {
      await api.contracts.addNote(detail.id, {
        content: noteText.trim(),
        createdBy: currentUser,
        createdByRole: currentRole,
      })
      setNoteText('')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : '添加备注失败')
    }
    setSubmitting(false)
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
        <p className="text-sm text-zinc-500">签约记录未找到</p>
        <Link to="/contracts" className="btn-secondary mt-3">返回列表</Link>
      </div>
    )
  }

  const canSubmitReview = detail.status === 'draft' && currentRole === 'doctor'
  const canApprove = detail.status === 'pending_review' && currentRole === 'nurse'
  const canReturnFromReview = detail.status === 'pending_review' && currentRole === 'nurse'
  const canResubmit = detail.status === 'returned' && currentRole === 'doctor'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contracts')} className="btn-ghost">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">{detail.resident_name}</h2>
              <span className={cn('badge', `badge-${detail.status}`)}>
                {CONTRACT_STATUS_LABELS[detail.status]}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{detail.contract_no}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSubmitReview && (
            <button onClick={() => handleStatusChange('pending_review')} disabled={submitting} className="btn-primary">
              <Send size={14} />
              提交审核
            </button>
          )}
          {canApprove && (
            <button onClick={() => handleStatusChange('approved')} disabled={submitting} className="btn-primary">
              <CheckCircle2 size={14} />
              审核通过
            </button>
          )}
          {canReturnFromReview && (
            <button onClick={() => handleStatusChange('returned')} disabled={submitting} className="btn-danger">
              <RotateCcw size={14} />
              退回修改
            </button>
          )}
          {canResubmit && (
            <button onClick={() => handleStatusChange('pending_review')} disabled={submitting} className="btn-primary">
              <Send size={14} />
              重新提交
            </button>
          )}
          {detail.status === 'approved' && (
            <Link to={`/archives?contractId=${detail.id}`} className="btn-accent">
              <FileText size={14} />
              转入建档
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-200 pb-0">
        {[
          { key: 'info' as const, label: '签约信息', icon: FileText },
          { key: 'notes' as const, label: `备注 (${detail.notes.length})`, icon: MessageSquare },
          { key: 'changes' as const, label: `变更记录 (${detail.change_logs.length})`, icon: History },
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
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { icon: User, label: '居民姓名', value: detail.resident_name },
                { icon: CreditCard, label: '身份证号', value: detail.resident_id_card },
                { icon: Phone, label: '联系电话', value: detail.resident_phone },
                { icon: FileText, label: '签约类型', value: detail.contract_type },
                { icon: Package, label: '服务包', value: detail.service_package },
                { icon: Calendar, label: '签约期限', value: `${new Date(detail.period_start).toLocaleDateString('zh-CN')} 至 ${new Date(detail.period_end).toLocaleDateString('zh-CN')}` },
                { icon: Stethoscope, label: '全科医生', value: detail.team_doctor },
                { icon: Heart, label: '护士', value: detail.team_nurse },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <Icon size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                    <div>
                      <div className="text-[10px] text-zinc-400">{item.label}</div>
                      <div className="text-sm text-zinc-800">{item.value}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
              <span>创建人: {detail.created_by}</span>
              <span>创建时间: {new Date(detail.created_at).toLocaleString('zh-CN')}</span>
              <span>更新时间: {new Date(detail.updated_at).toLocaleString('zh-CN')}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-700 mb-3">最近备注</h3>
              {detail.notes.length === 0 ? (
                <p className="text-xs text-zinc-400">暂无备注</p>
              ) : (
                <div className="space-y-2">
                  {detail.notes.slice(0, 3).map((n) => (
                    <div key={n.id} className="rounded-lg bg-zinc-50 p-2.5">
                      <p className="text-xs text-zinc-700">{n.content}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-400">
                        <span className={cn('rounded px-1 py-0.5 text-[9px] font-medium', ROLE_COLORS[n.created_by_role])}>
                          {ROLE_LABELS[n.created_by_role]}
                        </span>
                        <span>{n.created_by}</span>
                        <span>{new Date(n.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.status === 'returned' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                  <AlertCircle size={14} />
                  此签约已被退回
                </div>
                {detail.notes.filter((n) => n.source === 'return').length > 0 && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {detail.notes.filter((n) => n.source === 'return')[0].content}
                  </p>
                )}
                <button
                  onClick={() => setActiveTab('notes')}
                  className="mt-2 text-xs font-medium text-red-700 underline"
                >
                  查看退回详情
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <div className="border-b border-zinc-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-zinc-700">备注记录</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">签约处理时添加的备注将自动携带至建档流程</p>
          </div>
          <div className="max-h-96 divide-y divide-zinc-50 overflow-auto scrollbar-thin">
            {detail.notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <MessageSquare size={24} className="mb-2 opacity-30" />
                <p className="text-xs">暂无备注</p>
              </div>
            ) : (
              detail.notes.map((n: Note) => (
                <div key={n.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', ROLE_COLORS[n.created_by_role])}>
                      {ROLE_LABELS[n.created_by_role]}
                    </span>
                    <span className="text-xs font-medium text-zinc-700">{n.created_by}</span>
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-medium',
                      n.source === 'return' ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-500'
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
                placeholder="添加备注（备注将携带至建档流程）..."
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
            <p className="text-[10px] text-zinc-400 mt-0.5">签约在建档阶段被修改时，变更自动通知建档侧</p>
          </div>
          <div className="max-h-96 overflow-auto scrollbar-thin">
            {detail.change_logs.length === 0 ? (
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
                        <div className="h-2.5 w-2.5 rounded-full bg-primary-500 mt-1" />
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
    </div>
  )
}

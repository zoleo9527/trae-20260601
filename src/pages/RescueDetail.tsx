import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Save, X, Upload, FileText,
  Heart, Home, Users, ClipboardCheck, AlertTriangle, Paperclip,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useAnimalStore } from '@/stores/animalStore'
import { useAuthStore } from '@/stores/authStore'
import type { Animal } from '@/stores/animalStore'

interface FosterRecord {
  id: number
  foster_user_name: string
  foster_phone: string
  foster_address: string
  start_date: string
  end_date: string | null
  status: string
  notes: string | null
}

interface AdoptionRecord {
  id: number
  adopter_name: string
  adopter_phone: string
  adopter_address: string
  adopt_date: string | null
  reviewer_name: string | null
  status: string
  notes: string | null
}

interface VisitRecord {
  id: number
  visit_date: string
  visitor_name: string | null
  health_status: string | null
  behavior_status: string | null
  environment_status: string | null
  notes: string | null
  status: string
}

interface RecallRecord {
  id: number
  reason: string
  report_date: string
  reporter_name: string | null
  handler_name: string | null
  status: string
  resolution: string | null
  resolved_date: string | null
}

interface Attachment {
  id: number
  file_name: string
  file_path: string
  file_size: number | null
  uploaded_at: string
}

const STATUS_LABELS: Record<string, string> = {
  rescued: '已救助',
  fostered: '寄养中',
  adopted: '已领养',
  recalled: '已收回',
}
const STATUS_COLORS: Record<string, string> = {
  rescued: 'bg-blue-100 text-blue-700',
  fostered: 'bg-purple-100 text-purple-700',
  adopted: 'bg-green-100 text-green-700',
  recalled: 'bg-red-100 text-red-700',
}
const GENDER_LABELS: Record<string, string> = { male: '公', female: '母', unknown: '未知' }
const FOSTER_STATUS_LABELS: Record<string, string> = { active: '寄养中', ended: '已结束' }
const FOSTER_STATUS_COLORS: Record<string, string> = { active: 'bg-blue-100 text-blue-700', ended: 'bg-gray-100 text-gray-600' }
const ADOPTION_STATUS_LABELS: Record<string, string> = { pending_review: '待审核', approved: '已通过', rejected: '已拒绝' }
const ADOPTION_STATUS_COLORS: Record<string, string> = { pending_review: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }
const VISIT_STATUS_LABELS: Record<string, string> = { pending: '待回访', completed: '已完成', need_followup: '需跟进', transferred_to_recall: '转收回' }
const VISIT_STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', need_followup: 'bg-orange-100 text-orange-700', transferred_to_recall: 'bg-red-100 text-red-700' }
const RECALL_STATUS_LABELS: Record<string, string> = { initiated: '已发起', reviewing: '审核中', executing: '执行中', recalled: '已收回', closed: '已关闭' }
const RECALL_STATUS_COLORS: Record<string, string> = { initiated: 'bg-yellow-100 text-yellow-700', reviewing: 'bg-blue-100 text-blue-700', executing: 'bg-orange-100 text-orange-700', recalled: 'bg-red-100 text-red-700', closed: 'bg-gray-100 text-gray-600' }

function StatusBadge({ status, labels, colors }: { status: string; labels: Record<string, string>; colors: Record<string, string> }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

interface TimelineStep {
  key: string
  label: string
  icon: React.ReactNode
  date: string | null
  detail: string | null
  person: string | null
}

function LifecycleTimeline({ steps, activeKey }: { steps: TimelineStep[]; activeKey: string }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200" />
      {steps.map((step) => {
        const isActive = step.key === activeKey
        return (
          <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center ${isActive ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {step.icon}
            </div>
            <div className="min-w-0 ml-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isActive ? 'text-orange-600' : 'text-gray-800'}`}>{step.label}</span>
                {step.date && (
                  <span className="text-xs text-gray-400">{dayjs(step.date).format('YYYY-MM-DD')}</span>
                )}
              </div>
              {step.detail && <p className="text-sm text-gray-500 mt-0.5">{step.detail}</p>}
              {step.person && <p className="text-xs text-gray-400 mt-0.5">负责人: {step.person}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function RescueDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const currentAnimal = useAnimalStore((s) => s.currentAnimal)
  const loading = useAnimalStore((s) => s.loading)
  const fetchAnimal = useAnimalStore((s) => s.fetchAnimal)
  const updateAnimal = useAnimalStore((s) => s.updateAnimal)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Animal>>({})
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const canEdit = user?.role === 'volunteer' || user?.role === 'admin'

  const fosters = (currentAnimal?.fosters ?? []) as FosterRecord[]
  const adoptions = (currentAnimal?.adoptions ?? []) as AdoptionRecord[]
  const visits = (currentAnimal?.visits ?? []) as VisitRecord[]
  const recalls = (currentAnimal?.recalls ?? []) as RecallRecord[]

  const loadAttachments = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/attachments/animal/${id}`)
      if (res.ok) {
        const data = await res.json()
        setAttachments(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
  }, [id])

  useEffect(() => {
    if (id) fetchAnimal(Number(id))
  }, [id, fetchAnimal])

  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  useEffect(() => {
    if (currentAnimal && editing) {
      setForm({
        name: currentAnimal.name,
        species: currentAnimal.species,
        breed: currentAnimal.breed,
        age: currentAnimal.age,
        gender: currentAnimal.gender,
        rescue_date: currentAnimal.rescue_date,
        rescue_location: currentAnimal.rescue_location ?? (currentAnimal as Record<string, unknown>).location as string,
        status: currentAnimal.status,
        description: currentAnimal.description,
      })
    }
  }, [currentAnimal, editing])

  async function handleSave() {
    if (!id || !currentAnimal) return
    await updateAnimal(Number(id), form)
    setEditing(false)
    fetchAnimal(Number(id))
  }

  function handleCancelEdit() {
    setEditing(false)
    setForm({})
  }

  const activeStepMap: Record<string, string> = {
    rescued: 'rescue',
    fostered: 'foster',
    adopted: 'adoption',
    recalled: 'recall',
  }

  const timelineSteps: TimelineStep[] = [
    {
      key: 'rescue',
      label: '救助',
      icon: <Heart size={12} />,
      date: currentAnimal?.rescue_date ?? null,
      detail: (currentAnimal as Record<string, unknown>)?.rescue_location as string ?? currentAnimal?.location ?? null,
      person: null,
    },
    {
      key: 'foster',
      label: '寄养',
      icon: <Home size={12} />,
      date: fosters.length > 0 ? fosters[0].start_date : null,
      detail: fosters.length > 0 ? fosters[0].foster_user_name : null,
      person: fosters.length > 0 ? fosters[0].foster_user_name : null,
    },
    {
      key: 'adoption',
      label: '领养',
      icon: <Users size={12} />,
      date: adoptions.length > 0 ? adoptions[0].adopt_date : null,
      detail: adoptions.length > 0 ? adoptions[0].adopter_name : null,
      person: adoptions.length > 0 ? adoptions[0].adopter_name : null,
    },
    {
      key: 'recall',
      label: '回访/收回',
      icon: <ClipboardCheck size={12} />,
      date: recalls.length > 0 ? recalls[0].report_date : (visits.length > 0 ? visits[0].visit_date : null),
      detail: recalls.length > 0 ? recalls[0].reason : (visits.length > 0 ? visits[0].notes : null),
      person: recalls.length > 0 ? recalls[0].reporter_name : (visits.length > 0 ? visits[0].visitor_name : null),
    },
  ]

  if (loading && !currentAnimal) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>加载中...</p>
      </div>
    )
  }

  if (!currentAnimal) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>动物档案不存在</p>
      </div>
    )
  }

  const rescueLocation = (currentAnimal as Record<string, unknown>).rescue_location as string ?? currentAnimal.location ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/rescues')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回列表
        </button>
      </div>

      {/* Basic Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {editing ? (
                <input
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              ) : (
                currentAnimal.name
              )}
            </h2>
            <StatusBadge status={currentAnimal.status} labels={STATUS_LABELS} colors={STATUS_COLORS} />
          </div>
          {canEdit && (
            editing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Save size={14} />
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={14} />
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 size={14} />
                编辑
              </button>
            )
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">物种</span>
            {editing ? (
              <input value={form.species ?? ''} onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))} className="block mt-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
            ) : (
              <p className="mt-1 text-gray-800">{currentAnimal.species}</p>
            )}
          </div>
          <div>
            <span className="text-gray-400">品种</span>
            {editing ? (
              <input value={form.breed ?? ''} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} className="block mt-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
            ) : (
              <p className="mt-1 text-gray-800">{currentAnimal.breed || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-gray-400">年龄</span>
            {editing ? (
              <input type="number" value={form.age != null ? String(form.age) : ''} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))} className="block mt-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
            ) : (
              <p className="mt-1 text-gray-800">{currentAnimal.age != null ? `${currentAnimal.age}岁` : '-'}</p>
            )}
          </div>
          <div>
            <span className="text-gray-400">性别</span>
            {editing ? (
              <select value={String(form.gender ?? '')} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="block mt-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none">
                <option value="male">公</option>
                <option value="female">母</option>
                <option value="unknown">未知</option>
              </select>
            ) : (
              <p className="mt-1 text-gray-800">{GENDER_LABELS[currentAnimal.gender as string] || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-gray-400">救助日期</span>
            {editing ? (
              <input type="date" value={form.rescue_date ?? ''} onChange={(e) => setForm((f) => ({ ...f, rescue_date: e.target.value }))} className="block mt-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
            ) : (
              <p className="mt-1 text-gray-800">{currentAnimal.rescue_date ? dayjs(currentAnimal.rescue_date).format('YYYY-MM-DD') : '-'}</p>
            )}
          </div>
          <div>
            <span className="text-gray-400">救助地点</span>
            {editing ? (
              <input value={String(form.rescue_location ?? '')} onChange={(e) => setForm((f) => ({ ...f, rescue_location: e.target.value }))} className="block mt-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
            ) : (
              <p className="mt-1 text-gray-800">{rescueLocation || '-'}</p>
            )}
          </div>
          <div>
            <span className="text-gray-400">状态</span>
            {editing ? (
              <select value={form.status ?? ''} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="block mt-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none">
                <option value="rescued">已救助</option>
                <option value="fostered">寄养中</option>
                <option value="adopted">已领养</option>
                <option value="recalled">已收回</option>
              </select>
            ) : (
              <div className="mt-1"><StatusBadge status={currentAnimal.status} labels={STATUS_LABELS} colors={STATUS_COLORS} /></div>
            )}
          </div>
          <div className="col-span-2 md:col-span-4">
            <span className="text-gray-400">描述</span>
            {editing ? (
              <textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="block mt-1 w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none" />
            ) : (
              <p className="mt-1 text-gray-800">{currentAnimal.description || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">生命周期</h3>
        <LifecycleTimeline steps={timelineSteps} activeKey={activeStepMap[currentAnimal.status] ?? 'rescue'} />
      </div>

      {/* Fosters Section */}
      <SectionCard title="寄养记录" icon={<Home size={18} className="text-purple-600" />}>
        {fosters.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无寄养记录</p>
        ) : (
          <div className="space-y-3">
            {fosters.map((f) => (
              <div key={f.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{f.foster_user_name}</span>
                  <StatusBadge status={f.status} labels={FOSTER_STATUS_LABELS} colors={FOSTER_STATUS_COLORS} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <p>电话: {f.foster_phone || '-'}</p>
                  <p>地址: {f.foster_address || '-'}</p>
                  <p>开始: {dayjs(f.start_date).format('YYYY-MM-DD')}</p>
                  <p>结束: {f.end_date ? dayjs(f.end_date).format('YYYY-MM-DD') : '进行中'}</p>
                </div>
                {f.notes && <p className="mt-2 text-sm text-gray-500">备注: {f.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Adoptions Section */}
      <SectionCard title="领养记录" icon={<Users size={18} className="text-green-600" />}>
        {adoptions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无领养记录</p>
        ) : (
          <div className="space-y-3">
            {adoptions.map((a) => (
              <div key={a.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{a.adopter_name}</span>
                  <StatusBadge status={a.status} labels={ADOPTION_STATUS_LABELS} colors={ADOPTION_STATUS_COLORS} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <p>电话: {a.adopter_phone || '-'}</p>
                  <p>地址: {a.adopter_address || '-'}</p>
                  <p>领养日期: {a.adopt_date ? dayjs(a.adopt_date).format('YYYY-MM-DD') : '-'}</p>
                  <p>审核人: {a.reviewer_name || '-'}</p>
                </div>
                {a.notes && <p className="mt-2 text-sm text-gray-500">备注: {a.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Visits Section */}
      <SectionCard title="回访记录" icon={<ClipboardCheck size={18} className="text-blue-600" />}>
        {visits.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无回访记录</p>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {dayjs(v.visit_date).format('YYYY-MM-DD HH:mm')}
                  </span>
                  <StatusBadge status={v.status} labels={VISIT_STATUS_LABELS} colors={VISIT_STATUS_COLORS} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <p>回访人: {v.visitor_name || '-'}</p>
                  <p>健康状态: {v.health_status || '-'}</p>
                  <p>行为状态: {v.behavior_status || '-'}</p>
                  <p>环境状态: {v.environment_status || '-'}</p>
                </div>
                {v.notes && <p className="mt-2 text-sm text-gray-500">备注: {v.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Recalls Section */}
      <SectionCard title="收回记录" icon={<AlertTriangle size={18} className="text-red-600" />}>
        {recalls.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无收回记录</p>
        ) : (
          <div className="space-y-3">
            {recalls.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {dayjs(r.report_date).format('YYYY-MM-DD')}
                  </span>
                  <StatusBadge status={r.status} labels={RECALL_STATUS_LABELS} colors={RECALL_STATUS_COLORS} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <p>报告人: {r.reporter_name || '-'}</p>
                  <p>处理人: {r.handler_name || '-'}</p>
                </div>
                <p className="mt-2 text-sm text-gray-500">原因: {r.reason}</p>
                {r.resolution && <p className="mt-1 text-sm text-gray-500">处理结果: {r.resolution}</p>}
                {r.resolved_date && (
                  <p className="mt-1 text-sm text-gray-400">解决日期: {dayjs(r.resolved_date).format('YYYY-MM-DD')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Attachments Section */}
      <SectionCard title="附件" icon={<Paperclip size={18} className="text-gray-600" />}>
        <div className="mb-4">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors cursor-pointer">
            <Upload size={14} />
            上传附件
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !id) return
                const form = new FormData()
                form.append('file', file)
                form.append('entity_type', 'animal')
                form.append('entity_id', id)
                const res = await fetch('/api/attachments/upload', { method: 'POST', body: form })
                if (res.ok) {
                  const list = await fetch(`/api/attachments/animal/${id}`).then((r) => r.json())
                  setAttachments(Array.isArray(list) ? list : [])
                }
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">暂无附件</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 truncate">{att.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : ''}
                    {att.uploaded_at ? ` · ${dayjs(att.uploaded_at).format('YYYY-MM-DD')}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

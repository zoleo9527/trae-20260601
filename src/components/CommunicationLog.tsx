import type { Communication, Role } from '@/types';
import { MessageSquare, Phone, Plus, Save, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';

const methodConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  phone: { icon: <Phone size={12} />, color: 'text-blue-600', bg: 'bg-blue-50', label: '电话' },
  wechat: { icon: <MessageSquare size={12} />, color: 'text-green-600', bg: 'bg-green-50', label: '微信' },
  in_person: { icon: <UserIcon size={12} />, color: 'text-violet-600', bg: 'bg-violet-50', label: '到院' },
}

interface Props {
  communications: Communication[]
  patientId: number
  role: Role
  onAdd: (data: Omit<Communication, 'id'>) => Promise<void>
}

export default function CommunicationLog({ communications, patientId, role, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    contact_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    method: 'phone' as Communication['method'],
    content: '',
    contacted_by: role === 'receptionist' ? '前台小周' : '',
    result: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.content.trim() || !form.result.trim()) return
    setSubmitting(true)
    try {
      await onAdd({
        patient_id: patientId,
        contact_at: form.contact_at,
        method: form.method,
        content: form.content.trim(),
        contacted_by: form.contacted_by.trim() || '前台小周',
        result: form.result.trim(),
      })
      setForm({
        contact_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        method: 'phone',
        content: '',
        contacted_by: role === 'receptionist' ? '前台小周' : '',
        result: '',
      })
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isReceptionist = role === 'receptionist'

  return (
    <div>
      {isReceptionist && (
        <div className="mb-4">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-vet-violet text-white rounded-lg hover:bg-vet-violet-dark transition-colors"
            >
              <Plus size={16} />
              新增沟通记录
            </button>
          ) : (
            <div className="bg-vet-violet-light border border-vet-violet/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-vet-violet-dark">新增沟通记录</h4>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">联系时间</label>
                  <input
                    type="datetime-local"
                    value={form.contact_at.replace(' ', 'T')}
                    onChange={(e) => setForm({ ...form, contact_at: e.target.value.replace('T', ' ') })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vet-violet/30 focus:border-vet-violet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">联系方式</label>
                  <select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value as Communication['method'] })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vet-violet/30 focus:border-vet-violet"
                  >
                    <option value="phone">电话</option>
                    <option value="wechat">微信</option>
                    <option value="in_person">到院</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">沟通内容</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="请输入沟通内容..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vet-violet/30 focus:border-vet-violet resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">记录人</label>
                  <input
                    type="text"
                    value={form.contacted_by}
                    onChange={(e) => setForm({ ...form, contacted_by: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vet-violet/30 focus:border-vet-violet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">沟通结果</label>
                  <input
                    type="text"
                    value={form.result}
                    onChange={(e) => setForm({ ...form, result: e.target.value })}
                    placeholder="如：已确认/主人理解"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vet-violet/30 focus:border-vet-violet"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.content.trim() || !form.result.trim()}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-vet-violet text-white rounded-lg hover:bg-vet-violet-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={14} />
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {communications.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          暂无沟通记录
        </div>
      ) : (
        <div className="space-y-3">
          {communications.map((comm) => {
            const mc = methodConfig[comm.method] || methodConfig.phone
            return (
              <div key={comm.id} className="bg-white rounded-lg border border-slate-200 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${mc.bg} ${mc.color}`}>
                    {mc.icon}
                    {mc.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{comm.contact_at}</span>
                </div>
                <p className="text-sm text-slate-700 mb-1.5">{comm.content}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>记录人: {comm.contacted_by}</span>
                  <span className="text-slate-600 font-medium">{comm.result}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

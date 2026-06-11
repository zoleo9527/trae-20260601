import { useState } from 'react'
import { X } from 'lucide-react'
import { useMallStore } from '../store'
import { VENUE_LIST } from '../types'

interface CreateModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateApplicationModal({ open, onClose }: CreateModalProps) {
  const tenants = useMallStore((s) => s.tenants)
  const createApplication = useMallStore((s) => s.createApplication)
  const [form, setForm] = useState({
    tenantId: 0,
    activityName: '',
    activityDate: '',
    venueName: '',
    description: '',
  })

  if (!open) return null

  const handleSubmit = async () => {
    if (!form.tenantId || !form.activityName || !form.activityDate || !form.venueName) return
    await createApplication({ ...form, operator: '营运专员' })
    setForm({ tenantId: 0, activityName: '', activityDate: '', venueName: '', description: '' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">新建活动申请</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">租户</label>
            <select
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
            >
              <option value={0}>请选择租户</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.shopNo}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">活动名称</label>
            <input
              type="text"
              value={form.activityName}
              onChange={(e) => setForm({ ...form, activityName: e.target.value })}
              placeholder="如：周年庆促销"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">活动日期</label>
            <input
              type="date"
              value={form.activityDate}
              onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">活动场地</label>
            <select
              value={form.venueName}
              onChange={(e) => setForm({ ...form, venueName: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
            >
              <option value="">请选择场地</option>
              {VENUE_LIST.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注说明</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="活动详情、特殊需求等"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.tenantId || !form.activityName || !form.activityDate || !form.venueName}
            className="px-4 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            提交申请
          </button>
        </div>
      </div>
    </div>
  )
}

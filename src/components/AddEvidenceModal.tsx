import { useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { EvidenceSource } from '@/types'

const evidenceTypes: EvidenceSource['type'][] = ['台账记录', '现场记录', '沟通截图', '监控记录', '照片', '运单信息']

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (evidence: Omit<EvidenceSource, 'id'>) => void
}

export default function AddEvidenceModal({ open, onClose, onSubmit }: Props) {
  const [type, setType] = useState<EvidenceSource['type']>('现场记录')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  if (!open) return null

  const canSubmit = title.trim() && content.trim()

  function handleSubmit() {
    if (!canSubmit) return
    const t = new Date().toISOString().slice(0, 16).replace('T', ' ')
    onSubmit({
      type,
      title: title.trim(),
      content: content.trim(),
      timestamp: t,
      operator: '张伟',
    })
    setType('现场记录')
    setTitle('')
    setContent('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="text-base font-semibold text-surface-900">补充证据</h2>
          <button className="p-1 rounded-lg hover:bg-surface-100 transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">来源类型</label>
            <div className="flex flex-wrap gap-2">
              {evidenceTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    type === t
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">证据标题 <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="简要描述证据内容"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">证据描述 <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              rows={4}
              placeholder="详细描述证据内容，包括关键信息和判断依据..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-xl">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className={clsx('btn-primary', !canSubmit && 'opacity-50 pointer-events-none')}
            onClick={handleSubmit}
          >
            确认补充
          </button>
        </div>
      </div>
    </div>
  )
}

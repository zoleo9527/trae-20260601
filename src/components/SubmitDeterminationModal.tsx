import { useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { LiabilityParty } from '@/types'

const parties: LiabilityParty[] = ['发货方', '承运方', '货站方', '收货方', '第三方']

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: { responsibleParty: LiabilityParty; responsibleDetail: string; basis: string }) => void
  currentParty?: LiabilityParty
  currentDetail?: string
  currentBasis?: string
}

export default function SubmitDeterminationModal({ open, onClose, onSubmit, currentParty, currentDetail, currentBasis }: Props) {
  const [responsibleParty, setResponsibleParty] = useState<LiabilityParty>(currentParty && currentParty !== '待定' ? currentParty : '发货方')
  const [responsibleDetail, setResponsibleDetail] = useState(currentDetail || '')
  const [basis, setBasis] = useState(currentBasis || '')

  if (!open) return null

  const canSubmit = responsibleParty && responsibleDetail.trim() && basis.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="text-base font-semibold text-surface-900">提交责任认定</h2>
          <button className="p-1 rounded-lg hover:bg-surface-100 transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">责任方 <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {parties.map(p => (
                <button
                  key={p}
                  onClick={() => setResponsibleParty(p)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    responsibleParty === p
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">责任说明 <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              rows={3}
              placeholder="描述责任方应承担的具体责任和原因..."
              value={responsibleDetail}
              onChange={e => setResponsibleDetail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">认定依据 <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              rows={4}
              placeholder="列出认定依据，可分行填写..."
              value={basis}
              onChange={e => setBasis(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-xl">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className={clsx('btn-primary', !canSubmit && 'opacity-50 pointer-events-none')}
            onClick={() => canSubmit && onSubmit({ responsibleParty, responsibleDetail, basis })}
          >
            确认提交认定
          </button>
        </div>
      </div>
    </div>
  )
}

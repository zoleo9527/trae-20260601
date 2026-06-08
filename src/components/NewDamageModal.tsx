import { useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { DamageCategory, DamageSeverity } from '@/types'

const categories: DamageCategory[] = ['包装破损', '货物湿损', '货物丢失', '货物变形', '标签脱落', '温控异常']
const severities: DamageSeverity[] = ['轻微', '一般', '严重', '特重大']

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    awb: string
    flightNo: string
    route: string
    category: DamageCategory
    severity: DamageSeverity
    description: string
    discoveryTime: string
    discoveryLocation: string
    reporter: string
    abnormalNote?: string
    flag: 'today'
  }) => void
}

export default function NewDamageModal({ open, onClose, onSubmit }: Props) {
  const [awb, setAwb] = useState('')
  const [flightNo, setFlightNo] = useState('')
  const [route, setRoute] = useState('')
  const [category, setCategory] = useState<DamageCategory>('包装破损')
  const [severity, setSeverity] = useState<DamageSeverity>('一般')
  const [description, setDescription] = useState('')
  const [discoveryLocation, setDiscoveryLocation] = useState('')
  const [abnormalNote, setAbnormalNote] = useState('')

  if (!open) return null

  const canSubmit = awb.trim() && flightNo.trim() && description.trim()

  function handleSubmit() {
    if (!canSubmit) return
    const t = new Date().toISOString().slice(0, 16).replace('T', ' ')
    onSubmit({
      awb: awb.trim(),
      flightNo: flightNo.trim(),
      route: route.trim() || '未知',
      category,
      severity,
      description: description.trim(),
      discoveryTime: t,
      discoveryLocation: discoveryLocation.trim() || '待确认',
      reporter: '张伟',
      abnormalNote: abnormalNote.trim() || undefined,
      flag: 'today',
    })
    setAwb('')
    setFlightNo('')
    setRoute('')
    setCategory('包装破损')
    setSeverity('一般')
    setDescription('')
    setDiscoveryLocation('')
    setAbnormalNote('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-surface-900">新增货损记录</h2>
          <button className="p-1 rounded-lg hover:bg-surface-100 transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">运单号 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="如 784-12345678"
                value={awb}
                onChange={e => setAwb(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">航班号 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="如 CA1234"
                value={flightNo}
                onChange={e => setFlightNo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">航线</label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="如 北京→上海"
              value={route}
              onChange={e => setRoute(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">异常类别 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                      category === c
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">严重程度 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-1.5">
                {severities.map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                      severity === s
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">货损描述 <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              rows={3}
              placeholder="描述异常货损的具体情况..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">发现地点</label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="如 货站A区卸货平台"
              value={discoveryLocation}
              onChange={e => setDiscoveryLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">异常说明</label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              rows={2}
              placeholder="补充异常说明（选填）..."
              value={abnormalNote}
              onChange={e => setAbnormalNote(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-xl sticky bottom-0">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className={clsx('btn-primary', !canSubmit && 'opacity-50 pointer-events-none')}
            onClick={handleSubmit}
          >
            确认新增
          </button>
        </div>
      </div>
    </div>
  )
}

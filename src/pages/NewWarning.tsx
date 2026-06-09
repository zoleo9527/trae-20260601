import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useWarningStore } from '@/stores/warningStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import type { Urgency } from '@/types'

const UNITS = ['支', '盒', '瓶', '袋', '套', '包']

const URGENCY_OPTIONS: { value: Urgency; label: string; color: string; ringColor: string }[] = [
  { value: 'critical', label: '7天内到期', color: 'text-red-400', ringColor: 'accent-red-500' },
  { value: 'urgent', label: '30天内到期', color: 'text-amber-400', ringColor: 'accent-amber-500' },
  { value: 'normal', label: '90天内到期', color: 'text-blue-400', ringColor: 'accent-blue-500' },
]

interface FormErrors {
  productName?: string
  batchNo?: string
  expiryDate?: string
  quantity?: string
  unit?: string
  storageLocation?: string
  urgency?: string
}

export default function NewWarning() {
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const addWarning = useWarningStore((s) => s.addWarning)
  const addLog = useOperationLogStore((s) => s.addLog)

  const [productName, setProductName] = useState('')
  const [batchNo, setBatchNo] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('盒')
  const [storageLocation, setStorageLocation] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('normal')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  if (!currentUser || currentUser.role !== 'sales') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400 text-xl font-semibold">无权限</p>
      </div>
    )
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!productName.trim()) newErrors.productName = '请输入产品名称'
    if (!batchNo.trim()) newErrors.batchNo = '请输入批号'
    if (!expiryDate) newErrors.expiryDate = '请选择有效期'
    if (!quantity || Number(quantity) <= 0) newErrors.quantity = '请输入有效数量'
    if (!unit) newErrors.unit = '请选择单位'
    if (!storageLocation.trim()) newErrors.storageLocation = '请输入仓库位置'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const newWarningId = addWarning({
      productName: productName.trim(),
      batchNo: batchNo.trim(),
      expiryDate,
      quantity: Number(quantity),
      unit,
      storageLocation: storageLocation.trim(),
      urgency,
      note: note.trim(),
      createdById: currentUser.id,
      createdByName: currentUser.name,
    })

    addLog({
      type: 'create_warning',
      relatedId: newWarningId,
      relatedType: 'warning',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `提交临期预警：${productName.trim()}（${batchNo.trim()}）`,
      isSupplement: false,
    })

    navigate('/warnings')
  }

  const inputClassName =
    'bg-slate-700 border border-slate-600 text-white rounded-lg p-2.5 w-full focus:ring-amber-500 focus:border-amber-500 outline-none'
  const labelClassName = 'text-sm font-medium text-slate-300'

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex items-center gap-3 p-6">
        <button
          onClick={() => navigate('/warnings')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white">提交临期预警</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 pb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
          <div>
            <label className={labelClassName}>产品名称 *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={`${inputClassName} mt-1`}
              placeholder="请输入产品名称"
            />
            {errors.productName && <p className="text-red-400 text-xs mt-1">{errors.productName}</p>}
          </div>

          <div>
            <label className={labelClassName}>批号 *</label>
            <input
              type="text"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className={`${inputClassName} mt-1`}
              placeholder="请输入批号"
            />
            {errors.batchNo && <p className="text-red-400 text-xs mt-1">{errors.batchNo}</p>}
          </div>

          <div>
            <label className={labelClassName}>有效期 *</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={`${inputClassName} mt-1 [color-scheme:dark]`}
            />
            {errors.expiryDate && <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelClassName}>数量 *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`${inputClassName} mt-1`}
                placeholder="请输入数量"
              />
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div className="w-32">
              <label className={labelClassName}>单位 *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`${inputClassName} mt-1`}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClassName}>仓库位置 *</label>
            <input
              type="text"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className={`${inputClassName} mt-1`}
              placeholder="请输入仓库位置"
            />
            {errors.storageLocation && <p className="text-red-400 text-xs mt-1">{errors.storageLocation}</p>}
          </div>

          <div>
            <label className={labelClassName}>紧急程度 *</label>
            <div className="mt-2 space-y-2">
              {URGENCY_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={opt.value}
                    checked={urgency === opt.value}
                    onChange={() => setUrgency(opt.value)}
                    className={`w-4 h-4 ${opt.ringColor}`}
                  />
                  <span className={`${opt.color} text-sm`}>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.urgency && <p className="text-red-400 text-xs mt-1">{errors.urgency}</p>}
          </div>

          <div>
            <label className={labelClassName}>备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${inputClassName} mt-1 min-h-[80px] resize-y`}
              placeholder="选填"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              提交预警
            </button>
            <button
              type="button"
              onClick={() => navigate('/warnings')}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

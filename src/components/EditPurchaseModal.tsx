import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react'
import { apiGet, apiPut } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Qualification, Purchase, PurchaseItem, PaginatedResponse } from '@/types'

interface FormItem {
  product_name: string
  specification: string
  quantity: number
  unit_price: number
}

function formatAmount(n: number) {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function EditPurchaseModal({
  purchase,
  onClose,
  onSaved,
}: {
  purchase: Purchase
  onClose: () => void
  onSaved: () => void
}) {
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [formQualId, setFormQualId] = useState(purchase.qualification_id)
  const [formCustomer, setFormCustomer] = useState(purchase.customer_name)
  const [formItems, setFormItems] = useState<FormItem[]>(() => {
    if (purchase.items && purchase.items.length > 0) {
      return purchase.items.map((it: PurchaseItem) => ({
        product_name: it.product_name,
        specification: it.specification,
        quantity: it.quantity,
        unit_price: it.unit_price,
      }))
    }
    return [{ product_name: '', specification: '', quantity: 1, unit_price: 0 }]
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<PaginatedResponse<Qualification>>('/qualifications', { page_size: '200' })
      .then((res) => {
        setQualifications(res.list.filter((q) => ['approved', 'expiring_soon', 'pending'].includes(q.status)))
      })
      .catch(() => {})
  }, [])

  const handleQualChange = (qualId: string) => {
    setFormQualId(qualId)
    const q = qualifications.find((q) => q.id === qualId)
    if (q) {
      setFormCustomer(q.customer_name)
    }
  }

  const selectedQual = qualifications.find((q) => q.id === formQualId)
  const customerLocked = !!selectedQual
  const totalAmount = formItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  const canSubmit =
    formCustomer &&
    formQualId &&
    formItems.every((i) => i.product_name && i.quantity > 0) &&
    selectedQual?.status !== 'expired' &&
    selectedQual?.status !== 'rejected'

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      await apiPut(`/purchases/${purchase.id}`, {
        customer_name: formCustomer,
        qualification_id: formQualId,
        items: formItems.map((i) => ({
          product_name: i.product_name,
          specification: i.specification,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      })
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e?.message || '保存失败')
    }
    setSubmitting(false)
  }

  const updateItem = (index: number, field: keyof FormItem, value: string | number) => {
    setFormItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">编辑采购申请</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              客户名称
              {customerLocked && <span className="ml-2 text-xs font-normal text-gray-400">由关联资质自动带出</span>}
            </label>
            <input
              value={formCustomer}
              onChange={(e) => { if (!customerLocked) setFormCustomer(e.target.value) }}
              readOnly={customerLocked}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                customerLocked ? 'border-gray-100 bg-gray-50 text-gray-500' : 'border-gray-200',
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">关联资质</label>
            <select
              value={formQualId}
              onChange={(e) => handleQualChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">请选择资质</option>
              {qualifications.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.customer_name} - {q.license_no}
                </option>
              ))}
            </select>
          </div>
          {selectedQual && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                selectedQual.status === 'approved' && 'bg-green-50 text-green-700',
                selectedQual.status === 'expiring_soon' && 'bg-amber-50 text-amber-700',
                selectedQual.status === 'pending' && 'bg-blue-50 text-blue-700',
                (selectedQual.status === 'expired' || selectedQual.status === 'rejected') &&
                  'bg-red-50 text-red-700',
              )}
            >
              {selectedQual.status === 'approved' && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  资质正常
                </>
              )}
              {selectedQual.status === 'expiring_soon' && (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  关联资质即将到期
                </>
              )}
              {selectedQual.status === 'pending' && (
                <>
                  <Info className="h-4 w-4" />
                  关联资质审核中
                </>
              )}
              {selectedQual.status === 'expired' && (
                <>
                  <AlertCircle className="h-4 w-4" />
                  客户资质异常，请先处理资质
                </>
              )}
              {selectedQual.status === 'rejected' && (
                <>
                  <AlertCircle className="h-4 w-4" />
                  客户资质异常，请先处理资质
                </>
              )}
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">采购明细</label>
              <button
                onClick={() =>
                  setFormItems((prev) => [
                    ...prev,
                    { product_name: '', specification: '', quantity: 1, unit_price: 0 },
                  ])
                }
                className="flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-600"
              >
                <Plus className="h-3 w-3" />
                添加
              </button>
            </div>
            <div className="space-y-2">
              {formItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item.product_name}
                    onChange={(e) => updateItem(i, 'product_name', e.target.value)}
                    placeholder="产品名称"
                    className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <input
                    value={item.specification}
                    onChange={(e) => updateItem(i, 'specification', e.target.value)}
                    placeholder="规格"
                    className="w-20 rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                    className="w-16 rounded border border-gray-200 px-2 py-1.5 text-center text-sm"
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))}
                    className="w-24 rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  {formItems.length > 1 && (
                    <button
                      onClick={() => setFormItems((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm text-gray-600">
              合计：<span className="font-semibold text-gray-900">{formatAmount(totalAmount)}</span>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import useStore from '@/store'

interface ReturnItem {
  category: string
  requisitioned: number
  returning: number
}

export default function LinenReturn() {
  const navigate = useNavigate()
  const { requisitions, fetchRequisitions, currentUser, createReturn } = useStore()
  const [selectedId, setSelectedId] = useState('')
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showDiscrepancy, setShowDiscrepancy] = useState(false)

  useEffect(() => {
    fetchRequisitions()
  }, [fetchRequisitions])

  const pendingReqs = requisitions.filter((r) => r.status === 'pending' || r.status === 'fulfilled')

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setShowDiscrepancy(false)
    const req = requisitions.find((r) => r.id === Number(id))
    if (!req) return
    const items = (req.items as { category: string; quantity: number }[]) || []
    setReturnItems(items.map((it) => ({ category: it.category, requisitioned: it.quantity, returning: it.quantity })))
  }

  const updateReturnQty = (idx: number, qty: number) => {
    setReturnItems((prev) => prev.map((it, i) => (i === idx ? { ...it, returning: Math.max(0, Math.min(qty, it.requisitioned)) } : it)))
  }

  const hasDiscrepancy = returnItems.some((it) => it.returning < it.requisitioned)

  const handleSubmit = async () => {
    if (!selectedId) return
    try {
      await createReturn({
        requisitionId: Number(selectedId),
        operatorId: currentUser?.id,
        items: returnItems.map((it) => ({ category: it.category, quantity: it.returning })),
      })
      if (hasDiscrepancy) {
        setShowDiscrepancy(true)
      }
      setToast({ type: 'success', msg: '归还登记成功' })
      setTimeout(() => {
        setToast(null)
        if (!hasDiscrepancy) navigate('/linen')
      }, hasDiscrepancy ? 5000 : 1500)
    } catch {
      setToast({ type: 'error', msg: '提交失败，请重试' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/linen')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} style={{ color: 'var(--color-primary)' }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}>
          布草归还登记
        </h1>
      </div>

      {toast && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: toast.type === 'success' ? '#f0fdf4' : '#fef2f2', color: toast.type === 'success' ? 'var(--color-vacant)' : 'var(--color-maintenance)' }}>
          {toast.msg}
        </div>
      )}

      {showDiscrepancy && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: '#fffbeb', borderLeft: '3px solid var(--color-cleaning)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-cleaning)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-cleaning)' }}>存在未归还物品，请注意跟踪</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>选择领用记录</label>
          <select value={selectedId} onChange={(e) => handleSelect(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }}>
            <option value="">请选择领用单</option>
            {pendingReqs.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} - {r.requester_name} - {new Date(r.created_at).toLocaleDateString('zh-CN')} ({r.status === 'pending' ? '待处理' : '已确认'})
              </option>
            ))}
          </select>
        </div>

        {selectedId && returnItems.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-primary)' }}>归还物品</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>品类</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>领用数量</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>归还数量</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>差异</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((it, idx) => {
                  const diff = it.requisitioned - it.returning
                  return (
                    <tr key={idx} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="py-2.5 px-3">{it.category}</td>
                      <td className="py-2.5 px-3">{it.requisitioned}</td>
                      <td className="py-2.5 px-3">
                        <input type="number" min={0} max={it.requisitioned} value={it.returning} onChange={(e) => updateReturnQty(idx, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 rounded border text-sm text-center" style={{ borderColor: 'var(--color-border)' }} />
                      </td>
                      <td className="py-2.5 px-3" style={{ color: diff > 0 ? 'var(--color-maintenance)' : 'var(--color-vacant)' }}>
                        {diff > 0 ? `-${diff}` : '0'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={handleSubmit} disabled={!selectedId} className="px-6 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-accent)' }}>
            确认归还
          </button>
        </div>
      </div>
    </div>
  )
}

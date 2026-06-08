import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import useStore from '@/store'

const DEFAULT_CATEGORIES = [
  { category: 'bedsheet', label: '床单' },
  { category: 'pillowcase', label: '枕套' },
  { category: 'bath_towel', label: '浴巾' },
  { category: 'face_towel', label: '面巾' },
]

interface ItemRow {
  category: string
  label: string
  quantity: number
}

export default function LinenRequisition() {
  const navigate = useNavigate()
  const { rooms, fetchRooms, currentUser, createRequisition } = useStore()
  const [roomId, setRoomId] = useState('')
  const [items, setItems] = useState<ItemRow[]>(DEFAULT_CATEGORIES.map((c) => ({ ...c, quantity: 0 })))
  const [customLabel, setCustomLabel] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const updateQty = (idx: number, qty: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, quantity: Math.max(0, qty) } : it)))
  }

  const addCategory = () => {
    if (!customLabel.trim()) return
    setItems((prev) => [...prev, { category: customLabel.trim(), label: customLabel.trim(), quantity: 0 }])
    setCustomLabel('')
  }

  const handleSubmit = async () => {
    const filled = items.filter((it) => it.quantity > 0)
    if (!roomId || filled.length === 0) {
      setToast({ type: 'error', msg: '请选择房间并填写领用数量' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    try {
      await createRequisition({
        room_id: Number(roomId),
        requester_id: currentUser?.id,
        items: filled.map((it) => ({ category: it.category, quantity: it.quantity })),
      })
      setToast({ type: 'success', msg: '领用登记成功' })
      setTimeout(() => navigate('/linen'), 1000)
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
          布草领用登记
        </h1>
      </div>

      {toast && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: toast.type === 'success' ? '#f0fdf4' : '#fef2f2', color: toast.type === 'success' ? 'var(--color-vacant)' : 'var(--color-maintenance)' }}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>房间号</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <option value="">请选择房间</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>操作人</label>
            <input readOnly value={currentUser?.name ?? ''} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50" style={{ borderColor: 'var(--color-border)' }} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-primary)' }}>领用物品</h3>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="w-24 text-sm font-medium">{it.label}</span>
                <input
                  type="number"
                  min={0}
                  value={it.quantity}
                  onChange={(e) => updateQty(idx, parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 rounded-lg border text-sm text-center"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="自定义品类名称" className="flex-1 px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }} />
          <button onClick={addCategory} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={14} />添加品类
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSubmit} className="px-6 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
            提交领用
          </button>
        </div>
      </div>
    </div>
  )
}

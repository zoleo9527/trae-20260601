import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import useStore from '@/store'

const LOSS_TYPES = [
  { value: 'wear', label: '磨损', color: '#eab308', bg: '#fefce8' },
  { value: 'stain', label: '污渍', color: '#f97316', bg: '#fff7ed' },
  { value: 'missing', label: '丢失', color: '#ef4444', bg: '#fef2f2' },
]

interface LossRow {
  category: string
  quantity: number
  lossType: string
  description: string
}

export default function LinenLoss() {
  const navigate = useNavigate()
  const { rooms, fetchRooms, losses, fetchLosses, currentUser, createLoss } = useStore()
  const [roomId, setRoomId] = useState('')
  const [rows, setRows] = useState<LossRow[]>([{ category: '', quantity: 0, lossType: 'wear', description: '' }])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [floorFilter, setFloorFilter] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    fetchRooms()
    fetchLosses()
  }, [fetchRooms, fetchLosses])

  const addRow = () => setRows((prev) => [...prev, { category: '', quantity: 0, lossType: 'wear', description: '' }])

  const updateRow = (idx: number, field: keyof LossRow, value: string | number) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  const handleSubmit = async () => {
    const valid = rows.filter((r) => r.category && r.quantity > 0)
    if (!roomId || valid.length === 0) {
      setToast({ type: 'error', msg: '请填写完整损耗信息' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    try {
      await createLoss({
        room_id: Number(roomId),
        reporter_id: currentUser?.id,
        items: valid.map((r) => ({ category: r.category, quantity: r.quantity, loss_type: r.lossType, description: r.description })),
        reason: valid.map((r) => `${r.category}(${LOSS_TYPES.find((t) => t.value === r.lossType)?.label})`).join(', '),
      })
      setToast({ type: 'success', msg: '损耗登记成功' })
      setRows([{ category: '', quantity: 0, lossType: 'wear', description: '' }])
      fetchLosses()
      setTimeout(() => setToast(null), 3000)
    } catch {
      setToast({ type: 'error', msg: '提交失败' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const filtered = losses.filter((l) => {
    const loss = l as unknown as Record<string, unknown>
    if (dateFrom && l.created_at < dateFrom) return false
    if (dateTo && l.created_at > dateTo + 'T23:59:59') return false
    if (floorFilter && loss.floor !== Number(floorFilter)) return false
    return true
  })

  const getLossTypeStyle = (type: string) => LOSS_TYPES.find((t) => t.value === type) ?? LOSS_TYPES[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/linen')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} style={{ color: 'var(--color-primary)' }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}>布草损耗登记</h1>
      </div>

      {toast && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: toast.type === 'success' ? '#f0fdf4' : '#fef2f2', color: toast.type === 'success' ? 'var(--color-vacant)' : 'var(--color-maintenance)' }}>{toast.msg}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>损耗登记</h3>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>房间号</label>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }}>
            <option value="">请选择房间</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number}</option>)}
          </select>
        </div>
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>品类</label>
              <input value={row.category} onChange={(e) => updateRow(idx, 'category', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>数量</label>
              <input type="number" min={1} value={row.quantity} onChange={(e) => updateRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>损耗类型</label>
              <select value={row.lossType} onChange={(e) => updateRow(idx, 'lossType', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }}>
                {LOSS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>说明</label>
              <input value={row.description} onChange={(e) => updateRow(idx, 'description', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)' }} />
            </div>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <button onClick={addRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-primary)' }}><Plus size={14} />添加行</button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>提交登记</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>损耗记录</h3>
          <div className="flex gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-1 rounded border text-xs" style={{ borderColor: 'var(--color-border)' }} />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-1 rounded border text-xs" style={{ borderColor: 'var(--color-border)' }} />
            <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="px-2 py-1 rounded border text-xs" style={{ borderColor: 'var(--color-border)' }}>
              <option value="">全部楼层</option>
              {[3, 4, 5].map((f) => <option key={f} value={f}>{f}楼</option>)}
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>暂无记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                {['日期', '房间号', '品类', '数量', '损耗类型', '说明', '登记人'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const items = (l.items as { category: string; quantity: number; loss_type: string; description: string }[]) || []
                return items.map((it, i) => {
                  const ts = getLossTypeStyle(it.loss_type)
                  return (
                    <tr key={`${l.id}-${i}`} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="py-2.5 px-3">{new Date(l.created_at).toLocaleDateString('zh-CN')}</td>
                      <td className="py-2.5 px-3">{(l as unknown as Record<string, unknown>).room_number as string ?? '-'}</td>
                      <td className="py-2.5 px-3">{it.category}</td>
                      <td className="py-2.5 px-3">{it.quantity}</td>
                      <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: ts.bg, color: ts.color }}>{ts.label}</span></td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--color-text-muted)' }}>{it.description || '-'}</td>
                      <td className="py-2.5 px-3">{l.reporter_name}</td>
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

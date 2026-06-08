import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/store'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'var(--color-cleaning)', bg: '#fffbeb' },
  fulfilled: { label: '已确认', color: 'var(--color-occupied)', bg: '#eff6ff' },
  returned: { label: '已归还', color: 'var(--color-vacant)', bg: '#f0fdf4' },
}

interface InventoryRow {
  room_number: string
  floor: number
  category: string
  requisitioned: number
  returned: number
  outstanding: number
}

export default function LinenInventory() {
  const navigate = useNavigate()
  const { requisitions, fetchRequisitions, rooms, fetchRooms } = useStore()
  const [inventory, setInventory] = useState<InventoryRow[]>([])

  useEffect(() => {
    fetchRequisitions()
    fetchRooms()
  }, [fetchRequisitions, fetchRooms])

  useEffect(() => {
    fetch('/api/linen/inventory')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setInventory(json.data)
      })
      .catch(() => {})
  }, [requisitions])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/linen')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} style={{ color: 'var(--color-primary)' }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}>
          布草盘点对账
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>领用记录</h2>
          {requisitions.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>暂无记录</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {requisitions.map((r) => {
                const items = (r.items as { category: string; quantity: number }[]) || []
                const s = STATUS_MAP[r.status] ?? STATUS_MAP.pending
                return (
                  <div key={r.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      <span>房间: {(r as unknown as Record<string, unknown>).room_number as string ?? '-'}</span>
                      <span>操作人: {r.requester_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {items.map((it, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg)' }}>{it.category}×{it.quantity}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>库存概览</h2>
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>暂无数据</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  {['房间号', '楼层', '品类', '领用数', '归还数', '未归还'].map((h) => (
                    <th key={h} className="text-left py-2 px-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map((row, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-2 px-2">{row.room_number}</td>
                    <td className="py-2 px-2">{row.floor}楼</td>
                    <td className="py-2 px-2">{row.category}</td>
                    <td className="py-2 px-2">{row.requisitioned}</td>
                    <td className="py-2 px-2">{row.returned}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: row.outstanding > 0 ? '#fff7ed' : '#f0fdf4', color: row.outstanding > 0 ? '#f97316' : 'var(--color-vacant)' }}>
                        {row.outstanding}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

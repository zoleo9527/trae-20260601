import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, PackageSearch, X } from 'lucide-react'
import useStore from '@/store'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  found: { label: '已发现', color: '#ca8a04', bg: '#fefce8' },
  stored: { label: '已存放', color: '#2563eb', bg: '#eff6ff' },
  claimed: { label: '已认领', color: '#16a34a', bg: '#f0fdf4' },
  disposed: { label: '已归还', color: '#6b7280', bg: '#f3f4f6' },
}

const CATEGORY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  jewelry: { label: '珠宝首饰', color: '#dc2626', bg: '#fef2f2' },
  electronics: { label: '电子产品', color: '#2563eb', bg: '#eff6ff' },
  valuable: { label: '贵重物品', color: '#d4940a', bg: '#fffbeb' },
  documents: { label: '证件文件', color: '#7c3aed', bg: '#f5f3ff' },
  clothing: { label: '衣物', color: '#0d9488', bg: '#f0fdfa' },
  other: { label: '其他', color: '#6b7280', bg: '#f3f4f6' },
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

export default function Leftovers() {
  const navigate = useNavigate()
  const { leftovers, fetchLeftovers, createLeftover, rooms, fetchRooms, currentUser } = useStore()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ roomId: '', description: '', category: 'other', location: '' })

  useEffect(() => {
    const f: Record<string, string> = {}
    if (status) f.status = status
    if (category) f.category = category
    fetchLeftovers(f)
  }, [status, category, fetchLeftovers])

  useEffect(() => {
    if (rooms.length === 0) fetchRooms()
  }, [rooms.length, fetchRooms])

  const handleSubmit = async () => {
    if (!form.roomId || !form.description) return
    await createLeftover({
      room_id: Number(form.roomId),
      item_name: form.description,
      description: form.description,
      category: form.category,
      location: form.location,
      reporter_id: currentUser?.id,
    })
    setShowForm(false)
    setForm({ roomId: '', description: '', category: 'other', location: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">遗留物管理</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#d4940a] text-white rounded-lg text-sm font-medium hover:opacity-90">
          {showForm ? <X size={16} /> : <Plus size={16} />}登记遗留物
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="">选择房间</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number}</option>)}
            </select>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              {Object.entries(CATEGORY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="物品描述" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="存放位置" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          <button onClick={handleSubmit} disabled={!form.roomId || !form.description} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium disabled:opacity-50">提交</button>
        </div>
      )}

      <div className="flex gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="">全部状态</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="">全部类别</option>
          {Object.entries(CATEGORY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {leftovers.map((item) => {
          const sc = STATUS_CFG[item.status] || STATUS_CFG.found
          const cc = CATEGORY_CFG[(item as any).category] || CATEGORY_CFG.other
          return (
            <div key={item.id} onClick={() => navigate(`/leftovers/${item.id}`)} className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <PackageSearch size={16} className="text-[#1e3a5f]" />
                  <span className="font-semibold text-[#1e3a5f]">{item.item_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cc.color, backgroundColor: cc.bg }}>{cc.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{item.room_number}</span>
                <span>{item.reporter_name} · {timeAgo(item.created_at)}</span>
                {item.location && <span>存放: {item.location}</span>}
              </div>
            </div>
          )
        })}
        {leftovers.length === 0 && <div className="text-center py-12 text-gray-400">暂无遗留物记录</div>}
      </div>
    </div>
  )
}

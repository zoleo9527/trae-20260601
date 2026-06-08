import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import useStore from '@/store'

const FAULT_TYPES = [
  { value: 'air_conditioning', label: '空调' },
  { value: 'plumbing', label: '水管' },
  { value: 'electrical', label: '电路' },
  { value: 'furniture', label: '家具' },
  { value: 'other', label: '其他' },
]

const PRIORITIES = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

export default function MaintenanceNew() {
  const navigate = useNavigate()
  const { rooms, fetchRooms, currentUser, createMaintenance } = useStore()
  const [roomId, setRoomId] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('normal')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (rooms.length === 0) fetchRooms()
  }, [rooms.length, fetchRooms])

  const handleSubmit = async () => {
    if (!roomId || !category) return
    await createMaintenance({
      room_id: Number(roomId),
      category,
      priority,
      description,
      reporter_id: currentUser?.id,
    })
    navigate('/maintenance')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/maintenance')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="text-[#1e3a5f]" />
        </button>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">新建报修</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">房间</label>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="">选择房间</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">故障类型</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="">选择类型</option>
            {FAULT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button key={p.value} onClick={() => setPriority(p.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${priority === p.value ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" placeholder="请描述故障详情..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">报修人</label>
          <input value={currentUser?.name || ''} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50" />
        </div>

        <button onClick={handleSubmit} disabled={!roomId || !category} className="w-full py-2.5 bg-[#d4940a] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          提交报修
        </button>
      </div>
    </div>
  )
}

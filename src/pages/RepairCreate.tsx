import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

interface Room {
  id: number
  room_number: string
  floor: number
  status: string
}

const faultTypes = [
  { value: 'plumbing', label: '水管' },
  { value: 'electrical', label: '电气' },
  { value: 'furniture', label: '家具' },
  { value: 'ac', label: '空调' },
  { value: 'door', label: '门窗' },
  { value: 'other', label: '其他' },
]

const urgencyLevels = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

export default function RepairCreate() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomId, setRoomId] = useState('')
  const [faultType, setFaultType] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Room[]>('/rooms')
      .then(setRooms)
      .catch(() => {})
  }, [])

  const repairableRooms = rooms.filter((r) => r.status !== 'repair')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId || !faultType) {
      setError('请选择房间和故障类型')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await api.post('/repairs', {
        room_id: Number(roomId),
        fault_type: faultType,
        description: description || null,
        urgency,
      })
      navigate('/repairs')
    } catch (err: any) {
      setError(err.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <Link to="/repairs" className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7084] hover:text-[#e8723a] mb-4 transition-colors">
        <ArrowLeft size={13} />
        返回报修列表
      </Link>

      <h1 className="text-lg font-bold text-[#e4e6eb] mb-5">提交工程报修</h1>

      <form onSubmit={handleSubmit} className="bg-[#151822] rounded-lg border border-[#1e2230] p-5 space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[12px] text-[#8b8fa3] mb-1.5">房间号 <span className="text-red-400">*</span></label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 bg-[#0d0f14] border border-[#2a2f42] rounded-md text-[13px] text-[#e4e6eb] focus:outline-none focus:border-[#e8723a]/50 focus:ring-1 focus:ring-[#e8723a]/20"
          >
            <option value="">请选择房间</option>
            {[3, 4, 5].map((f) => (
              <optgroup key={f} label={`${f}F`}>
                {repairableRooms
                  .filter((r) => r.floor === f)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] text-[#8b8fa3] mb-1.5">故障类型 <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {faultTypes.map((ft) => (
              <button
                key={ft.value}
                type="button"
                onClick={() => setFaultType(ft.value)}
                className={`px-3 py-1.5 rounded-md text-[12px] border transition-colors ${
                  faultType === ft.value
                    ? 'bg-[#e8723a]/15 border-[#e8723a]/40 text-[#e8723a]'
                    : 'bg-[#0d0f14] border-[#2a2f42] text-[#8b8fa3] hover:border-[#3a3f52]'
                }`}
              >
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-[#8b8fa3] mb-1.5">故障描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-[#0d0f14] border border-[#2a2f42] rounded-md text-[13px] text-[#e4e6eb] placeholder-[#4a4e5e] focus:outline-none focus:border-[#e8723a]/50 focus:ring-1 focus:ring-[#e8723a]/20 resize-none"
            placeholder="描述故障详情，有助于工程师快速定位问题"
          />
        </div>

        <div>
          <label className="block text-[12px] text-[#8b8fa3] mb-1.5">紧急程度</label>
          <div className="flex gap-2">
            {urgencyLevels.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setUrgency(u.value)}
                className={`px-3 py-1.5 rounded-md text-[12px] border transition-colors ${
                  urgency === u.value
                    ? u.value === 'urgent'
                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                      : u.value === 'high'
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                        : u.value === 'normal'
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                          : 'bg-gray-500/15 border-gray-500/40 text-gray-400'
                    : 'bg-[#0d0f14] border-[#2a2f42] text-[#8b8fa3] hover:border-[#3a3f52]'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !roomId || !faultType}
            className="w-full py-2.5 rounded-md text-[13px] font-medium bg-[#e8723a] text-white hover:bg-[#d4662f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '提交中...' : '提交报修'}
          </button>
        </div>
      </form>
    </div>
  )
}

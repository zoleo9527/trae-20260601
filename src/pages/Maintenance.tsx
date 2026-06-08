import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wrench } from 'lucide-react'
import useStore from '@/store'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  reported: { label: '已报修', color: '#ca8a04', bg: '#fefce8' },
  assigned: { label: '已派单', color: '#2563eb', bg: '#eff6ff' },
  in_progress: { label: '维修中', color: '#7c3aed', bg: '#f5f3ff' },
  completed: { label: '已完成', color: '#16a34a', bg: '#f0fdf4' },
  verified: { label: '已验收', color: '#0d9488', bg: '#f0fdfa' },
}

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: '低', color: '#6b7280', bg: '#f3f4f6' },
  normal: { label: '普通', color: '#2563eb', bg: '#eff6ff' },
  high: { label: '高', color: '#ea580c', bg: '#fff7ed' },
  urgent: { label: '紧急', color: '#dc2626', bg: '#fef2f2' },
}

const FAULT_MAP: Record<string, string> = {
  air_conditioning: '空调', plumbing: '水管', electrical: '电路', furniture: '家具', other: '其他',
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

export default function Maintenance() {
  const navigate = useNavigate()
  const { maintenanceOrders, fetchMaintenance } = useStore()
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  useEffect(() => {
    const f: Record<string, string> = {}
    if (status) f.status = status
    if (priority) f.priority = priority
    fetchMaintenance(f)
  }, [status, priority, fetchMaintenance])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">维修管理</h1>
        <button onClick={() => navigate('/maintenance/new')} className="flex items-center gap-2 px-4 py-2 bg-[#d4940a] text-white rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={16} />新建报修
        </button>
      </div>

      <div className="flex gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="">全部状态</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="">全部优先级</option>
          {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {maintenanceOrders.map((o) => {
          const sc = STATUS_CFG[o.status] || STATUS_CFG.reported
          const pc = PRIORITY_CFG[(o as any).priority] || PRIORITY_CFG.normal
          return (
            <div key={o.id} onClick={() => navigate(`/maintenance/${o.id}`)} className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Wrench size={16} className="text-[#1e3a5f]" />
                  <span className="font-semibold text-[#1e3a5f]">{o.room_number}</span>
                  <span className="text-sm text-gray-500">{FAULT_MAP[o.category] || o.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(o as any).priority === 'urgent' ? 'animate-pulse' : ''}`} style={{ color: pc.color, backgroundColor: pc.bg }}>{pc.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-1 mb-2">{o.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{o.reporter_name} · {timeAgo(o.created_at)}</span>
                {o.assigned_name && <span>派给: {o.assigned_name}</span>}
              </div>
            </div>
          )
        })}
        {maintenanceOrders.length === 0 && <div className="text-center py-12 text-gray-400">暂无维修工单</div>}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Wrench, User, Clock, CheckCircle } from 'lucide-react'
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

export default function MaintenanceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { maintenanceOrders, fetchMaintenance, updateMaintenance, users, fetchUsers } = useStore()
  const [showAssign, setShowAssign] = useState(false)
  const [assigneeId, setAssigneeId] = useState('')

  useEffect(() => {
    if (maintenanceOrders.length === 0) fetchMaintenance()
    if (users.length === 0) fetchUsers()
  }, [maintenanceOrders.length, fetchMaintenance, users.length, fetchUsers])

  const order = maintenanceOrders.find((m) => m.id === Number(id))
  if (!order) return <div className="text-center py-12 text-gray-400">加载中...</div>

  const sc = STATUS_CFG[order.status] || STATUS_CFG.reported
  const pc = PRIORITY_CFG[(order as any).priority] || PRIORITY_CFG.normal
  const engineers = users.filter((u) => u.role === 'engineer')

  const handleAction = async (status: string, extra?: Record<string, unknown>) => {
    await updateMaintenance(order.id, { status, ...extra })
    setShowAssign(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/maintenance')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="text-[#1e3a5f]" />
        </button>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">维修详情</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wrench size={20} className="text-[#1e3a5f]" />
          <span className="text-xl font-bold text-[#1e3a5f]">{order.room_number}</span>
          <span className="text-sm text-gray-500">{FAULT_MAP[order.category] || order.category}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(order as any).priority === 'urgent' ? 'animate-pulse' : ''}`} style={{ color: pc.color, backgroundColor: pc.bg }}>{pc.label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600"><User size={16} /><span>报修人: {order.reporter_name}</span></div>
          <div className="flex items-center gap-2 text-gray-600"><Clock size={16} /><span>报修时间: {timeAgo(order.created_at)}</span></div>
          {order.assigned_name && <div className="flex items-center gap-2 text-gray-600"><User size={16} /><span>维修人: {order.assigned_name}</span></div>}
          <p className="text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg">{order.description}</p>
          {order.completed_at && <div className="flex items-center gap-2 text-green-600"><CheckCircle size={16} /><span>完成时间: {new Date(order.completed_at).toLocaleString('zh-CN')}</span></div>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
        {order.status === 'reported' && (
          <>
            {showAssign ? (
              <div className="space-y-3">
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                  <option value="">选择工程师</option>
                  {engineers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('assigned', { assigned_to: Number(assigneeId) })} disabled={!assigneeId} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium disabled:opacity-50">确认派单</button>
                  <button onClick={() => setShowAssign(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAssign(true)} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium">派单</button>
            )}
          </>
        )}
        {order.status === 'assigned' && <button onClick={() => handleAction('in_progress')} className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium">开始维修</button>}
        {order.status === 'in_progress' && <button onClick={() => handleAction('completed')} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">完成维修</button>}
        {order.status === 'completed' && <button onClick={() => handleAction('verified')} className="px-4 py-2 bg-[#0d9488] text-white rounded-lg text-sm font-medium">验收确认</button>}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { formatTime } from '@/components/Timeline'
import { Filter, RefreshCw, ScrollText } from 'lucide-react'
import { Navigate } from 'react-router-dom'

interface AuditLog {
  id: number
  operator_id: number
  operator_name: string
  action_type: string
  detail: string | null
  ip: string | null
  created_at: string
}

const actionTypeLabels: Record<string, string> = {
  repair_create: '创建报修',
  repair_accept: '接单',
  repair_complete: '完成维修',
  recovery_create: '创建恢复',
  recovery_clean_complete: '保洁完成',
  recovery_approve: '审核通过',
  recovery_reject: '审核驳回',
}

const actionTypeColors: Record<string, string> = {
  repair_create: 'bg-red-500/15 text-red-400 border-red-500/30',
  repair_accept: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  repair_complete: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  recovery_create: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  recovery_clean_complete: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  recovery_approve: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  recovery_reject: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function Audit() {
  const { user } = useAuthStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [actionType, setActionType] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLogs = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (actionType) params.set('action_type', actionType)
    if (operatorId) params.set('operator_id', operatorId)
    api.get<AuditLog[]>(`/audit?${params.toString()}`)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [actionType, operatorId])

  if (user?.role !== 'supervisor') {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#e4e6eb]">审计日志</h1>
          <p className="text-[12px] text-[#6b7084] mt-0.5">全部操作记录，共 {logs.length} 条</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[#6b7084]" />
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="bg-[#151822] border border-[#2a2f42] rounded-md text-[12px] text-[#e4e6eb] px-2 py-1.5 focus:outline-none focus:border-[#e8723a]/50"
            >
              <option value="">全部类型</option>
              <option value="repair_create">创建报修</option>
              <option value="repair_accept">接单</option>
              <option value="repair_complete">完成维修</option>
              <option value="recovery_create">创建恢复</option>
              <option value="recovery_clean_complete">保洁完成</option>
              <option value="recovery_approve">审核通过</option>
              <option value="recovery_reject">审核驳回</option>
            </select>
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="bg-[#151822] border border-[#2a2f42] rounded-md text-[12px] text-[#e4e6eb] px-2 py-1.5 focus:outline-none focus:border-[#e8723a]/50"
            >
              <option value="">全部人员</option>
              <option value="1">张主管</option>
              <option value="2">李保洁</option>
              <option value="3">王工程师</option>
            </select>
          </div>
          <button
            onClick={fetchLogs}
            className="p-1.5 rounded-md bg-[#151822] border border-[#2a2f42] text-[#6b7084] hover:text-[#e4e6eb] transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-[#4a4e5e] text-sm py-10 text-center">暂无审计记录</div>
      ) : (
        <div className="bg-[#151822] rounded-lg border border-[#1e2230] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2230]">
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">时间</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">操作人</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">操作类型</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">详情</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#1e2230] last:border-0 hover:bg-[#1a1d28] transition-colors">
                  <td className="px-4 py-2.5 text-[11px] text-[#4a4e5e] font-mono">{formatTime(log.created_at)}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[#e4e6eb]">{log.operator_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${actionTypeColors[log.action_type] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
                      {actionTypeLabels[log.action_type] || log.action_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[#8b8fa3] max-w-[300px] truncate">{log.detail || '-'}</td>
                  <td className="px-4 py-2.5 text-[11px] text-[#4a4e5e] font-mono">{log.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

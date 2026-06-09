import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle, Filter } from 'lucide-react'
import { useWarningStore } from '@/stores/warningStore'
import { useUserStore } from '@/stores/userStore'
import {
  WARNING_STATUS_LABELS,
  URGENCY_LABELS,
} from '@/types'
import type { WarningStatus, Urgency, Warning } from '@/types'

function getUrgencyClasses(urgency: Urgency) {
  switch (urgency) {
    case 'critical':
      return 'bg-red-500/20 text-red-400'
    case 'urgent':
      return 'bg-amber-500/20 text-amber-400'
    case 'normal':
      return 'bg-blue-500/20 text-blue-400'
  }
}

function getStatusClasses(status: WarningStatus) {
  switch (status) {
    case 'pending':
      return 'bg-slate-500/20 text-slate-400'
    case 'confirmed':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'rejected':
      return 'bg-red-500/20 text-red-400'
    case 'exchanged':
      return 'bg-blue-500/20 text-blue-400'
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const statusFilters: { label: string; value: WarningStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已退回', value: 'rejected' },
  { label: '已申请换货', value: 'exchanged' },
]

const urgencyFilters: { label: string; value: Urgency | 'all' }[] = [
  { label: '全部紧急度', value: 'all' },
  { label: '7天内', value: 'critical' },
  { label: '30天内', value: 'urgent' },
  { label: '90天内', value: 'normal' },
]

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getUrgencyClasses(urgency)}`}>
      {URGENCY_LABELS[urgency]}
    </span>
  )
}

function StatusBadge({ status }: { status: WarningStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusClasses(status)}`}>
      {WARNING_STATUS_LABELS[status]}
    </span>
  )
}

function WarningRow({ warning }: { warning: Warning }) {
  const borderColor = {
    critical: 'border-l-red-500',
    urgent: 'border-l-amber-500',
    normal: 'border-l-blue-500',
  }[warning.urgency]

  return (
    <tr className={`border-l-4 ${borderColor} hover:bg-slate-800/50`}>
      <td className="px-4 py-3 text-sm text-slate-200">{warning.productName}</td>
      <td className="px-4 py-3 text-sm text-slate-300">{warning.batchNo}</td>
      <td className="px-4 py-3 text-sm text-slate-300">{formatDate(warning.expiryDate)}</td>
      <td className="px-4 py-3 text-sm text-slate-300">{warning.quantity}{warning.unit}</td>
      <td className="px-4 py-3 text-sm text-slate-300">{warning.storageLocation}</td>
      <td className="px-4 py-3 text-sm"><UrgencyBadge urgency={warning.urgency} /></td>
      <td className="px-4 py-3 text-sm"><StatusBadge status={warning.status} /></td>
      <td className="px-4 py-3 text-sm">
        <Link to={`/warnings/${warning.id}`} className="text-amber-400 hover:text-amber-300">
          查看
        </Link>
      </td>
    </tr>
  )
}

export default function Warnings() {
  const navigate = useNavigate()
  const { warnings } = useWarningStore()
  const { currentUser } = useUserStore()
  const [statusFilter, setStatusFilter] = useState<WarningStatus | 'all'>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'all'>('all')

  const filtered = warnings.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false
    if (urgencyFilter !== 'all' && w.urgency !== urgencyFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-white">临期预警</h1>
        </div>
        {currentUser?.role === 'sales' && (
          <button
            onClick={() => navigate('/warnings/new')}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            提交预警
          </button>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg p-4 mb-6 flex items-start gap-6">
        <Filter className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  statusFilter === f.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {urgencyFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setUrgencyFilter(f.value)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  urgencyFilter === f.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">暂无预警记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">产品名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">批号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">有效期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">数量/单位</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">仓库名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">紧急度</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <WarningRow key={w.id} warning={w} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

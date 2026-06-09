import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'
import { useRecallStore } from '@/stores/recallStore'
import { useAuthStore } from '@/stores/authStore'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'initiated', label: '已发起' },
  { value: 'reviewing', label: '审核中' },
  { value: 'executing', label: '执行收回' },
  { value: 'recalled', label: '已收回' },
  { value: 'closed', label: '已关闭' },
]

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  initiated: { label: '已发起', className: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '审核中', className: 'bg-purple-100 text-purple-700' },
  executing: { label: '执行收回', className: 'bg-amber-100 text-amber-700' },
  recalled: { label: '已收回', className: 'bg-red-100 text-red-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-600' },
}

export default function RecallList() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { recalls, loading, fetchRecalls } = useRecallStore()
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchRecalls(statusFilter ? { status: statusFilter } : undefined)
  }, [statusFilter, fetchRecalls])

  const canCreate = user?.role === 'adoption_officer' || user?.role === 'admin'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">异常收回</h1>
        {canCreate && (
          <button
            onClick={() => navigate('/recalls/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            发起收回
          </button>
        )}
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            加载中...
          </div>
        ) : recalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <AlertTriangle size={40} className="mb-2 opacity-40" />
            <p>暂无异常收回记录</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">动物名称</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">发起日期</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">发起人</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">原因</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">当前处理人</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {recalls.map((recall) => {
                const badge = STATUS_BADGES[recall.status] ?? { label: recall.status, className: 'bg-gray-100 text-gray-600' }
                return (
                  <tr
                    key={recall.id}
                    onClick={() => navigate(`/recalls/${recall.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {(recall as Record<string, unknown>).animal_name as string ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {recall.report_date ? dayjs(recall.report_date as string).format('YYYY-MM-DD') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(recall as Record<string, unknown>).reporter_name as string ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {recall.reason ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(recall as Record<string, unknown>).handler_name as string ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/recalls/${recall.id}`) }}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

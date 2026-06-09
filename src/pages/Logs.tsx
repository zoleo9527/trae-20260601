import { useEffect, useState } from 'react'
import { useLogsStore } from '@/stores/logs'
import { Search, Filter } from 'lucide-react'

const ACTION_LABELS: Record<string, string> = {
  login: '登录',
  container_enter: '集装箱进场',
  container_status_change: '状态变更',
  inspection_create: '创建查验',
  inspection_execute: '执行查验',
  inspection_notify: '查验通知',
  move_task_create: '创建移箱',
  move_task_start: '开始移箱',
  move_task_complete: '完成移箱',
  problem_reschedule: '问题单改期',
  problem_supplement: '问题单补录',
  problem_reject: '问题单驳回',
}

const ROLE_LABELS: Record<string, string> = {
  gate: '闸口员',
  dispatch: '调度员',
  service: '客服',
}

export default function Logs() {
  const { logs, total, loading, fetchLogs } = useLogsStore()
  const [containerNo, setContainerNo] = useState('')
  const [role, setRole] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchLogs({
      containerNo: containerNo || undefined,
      role: role || undefined,
      action: action || undefined,
      page,
      size: 30,
    })
  }, [fetchLogs, containerNo, role, action, page])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-portNavy mb-6">操作日志</h1>

      <div className="bg-white rounded-lg border border-slate-100 p-4 mb-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-500 mb-1">箱号搜索</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={containerNo}
                onChange={(e) => { setContainerNo(e.target.value); setPage(1) }}
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
                placeholder="输入箱号..."
              />
            </div>
          </div>
          <div className="w-32">
            <label className="block text-xs text-slate-500 mb-1">角色</label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1) }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
            >
              <option value="">全部</option>
              <option value="gate">闸口员</option>
              <option value="dispatch">调度员</option>
              <option value="service">客服</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-slate-500 mb-1">操作类型</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1) }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
            >
              <option value="">全部</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="px-4 py-3 text-left font-medium">时间</th>
              <th className="px-4 py-3 text-left font-medium">操作人</th>
              <th className="px-4 py-3 text-left font-medium">角色</th>
              <th className="px-4 py-3 text-left font-medium">操作类型</th>
              <th className="px-4 py-3 text-left font-medium">关联箱号</th>
              <th className="px-4 py-3 text-left font-medium">详情</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">加载中...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">暂无日志记录</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{log.created_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-4 py-3 text-portNavy">{log.username || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.role === 'gate' ? 'bg-blue-50 text-blue-600' :
                      log.role === 'dispatch' ? 'bg-purple-50 text-purple-600' :
                      log.role === 'service' ? 'bg-green-50 text-green-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {ROLE_LABELS[log.role || ''] || log.role || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{ACTION_LABELS[log.action] || log.action}</td>
                  <td className="px-4 py-3 font-mono text-portBlue">{log.container_no || '-'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.detail || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <span>共 {total} 条记录</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-slate-100 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-1">第 {page} 页</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={logs.length < 30}
            className="px-3 py-1 rounded bg-slate-100 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}

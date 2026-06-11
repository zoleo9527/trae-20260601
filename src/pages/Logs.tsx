import { useEffect, useState, useCallback } from 'react'
import { FileText, Filter } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { cn } from '@/lib/utils'

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'schedule', label: '排班' },
  { value: 'attendance', label: '考勤' },
  { value: 'review', label: '复核' },
]

const ACTION_LABELS: Record<string, string> = {
  create_schedule: '创建排班',
  submit_schedule: '提交排班',
  update_schedule: '修改排班',
  confirm_attendance: '确认考勤',
  mark_exception: '标记异常',
  submit_material: '补交材料',
  escalate_timeout: '超时升级',
  approve_review: '审核通过',
  reject_review: '审核退回',
  submit_schedule_gen_attendance: '排班生成考勤',
  resubmit_attendance: '重提复核',
  approve_attendance_submitted: '审核下发考勤',
}

const ACTION_COLORS: Record<string, string> = {
  create_schedule: 'text-ops-success',
  submit_schedule: 'text-ops-success',
  confirm_attendance: 'text-ops-success',
  approve_review: 'text-ops-success',
  mark_exception: 'text-amber-500',
  escalate_timeout: 'text-amber-500',
  reject_review: 'text-ops-danger',
  update_schedule: 'text-ops-info',
}

const ENTITY_LABELS: Record<string, string> = {
  schedule: '排班',
  attendance: '考勤',
  review: '复核',
}

const ROLE_LABELS: Record<string, string> = {
  floor_supervisor: '楼层主管',
  brand_supervisor: '品牌督导',
  counter_manager: '柜长',
  guide: '导购',
}

const ROLE_COLORS: Record<string, string> = {
  floor_supervisor: 'bg-ops-accent/20 text-ops-accent',
  brand_supervisor: 'bg-purple-600/20 text-purple-400',
  counter_manager: 'bg-ops-info/20 text-ops-info',
  guide: 'bg-emerald-600/20 text-emerald-400',
}

const STATUS_LABELS: Record<string, string> = {
  submitted: '待柜长下发',
  pending_confirm: '待确认',
  pending_material: '待补材料',
  timeout_escalated: '超时升级',
  pending_review: '待复核',
  review_rejected: '复核退回',
  pending_brand_confirm: '待品牌确认',
  closed: '已闭环',
  draft: '草稿',
}

interface LogRecord {
  id: number
  operatorId: number
  operatorName: string
  operatorRole?: string
  action: string
  entityType: string
  entityId: number
  detail: string
  fromStatus?: string
  toStatus?: string
  createdAt: string
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}:${ss}`
}

const DETAIL_MAX = 20

export default function Logs() {
  const { logs, loading, fetchLogs } = useDataStore()
  const [entityType, setEntityType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const list = logs as LogRecord[]

  const loadData = useCallback(() => {
    const filters: Record<string, unknown> = {}
    if (entityType) filters.entityType = entityType
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    fetchLogs(filters)
  }, [fetchLogs, entityType, startDate, endDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleReset = () => {
    setEntityType('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-ops-accent" size={20} />
        <h2 className="text-lg font-bold">操作日志</h2>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter size={14} className="text-gray-500" />
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="bg-ops-card border border-ops-border rounded px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-ops-accent transition-colors"
        >
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="起始日期"
          className="bg-ops-card border border-ops-border rounded px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-ops-accent transition-colors font-mono"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="结束日期"
          className="bg-ops-card border border-ops-border rounded px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-ops-accent transition-colors font-mono"
        />
        <button
          onClick={loadData}
          className="px-4 py-1.5 rounded text-sm font-medium bg-ops-accent text-ops-dark hover:bg-ops-accent/90 transition-colors"
        >
          查询
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 rounded text-sm font-medium bg-ops-card border border-ops-border text-gray-400 hover:text-gray-200 transition-colors"
        >
          重置
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-12">暂无操作日志</div>
      ) : (
        <div className="bg-ops-card border border-ops-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ops-border text-gray-500 text-xs">
                <th className="text-left px-4 py-2.5 font-medium">时间</th>
                <th className="text-left px-4 py-2.5 font-medium">操作人</th>
                <th className="text-left px-4 py-2.5 font-medium">操作</th>
                <th className="text-left px-4 py-2.5 font-medium">状态流转</th>
                <th className="text-left px-4 py-2.5 font-medium">对象</th>
                <th className="text-left px-4 py-2.5 font-medium">详情</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l, idx) => (
                <tr
                  key={l.id}
                  className={cn(
                    'border-b border-ops-border/50 transition-colors hover:bg-ops-border/20',
                    idx % 2 === 1 && 'bg-ops-dark/30',
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(l.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">{l.operatorName}</span>
                      {l.operatorRole && (
                        <span className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                          ROLE_COLORS[l.operatorRole] || 'bg-ops-border text-gray-400',
                        )}>
                          {ROLE_LABELS[l.operatorRole] || l.operatorRole}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={cn('font-medium', ACTION_COLORS[l.action] || 'text-gray-300')}>
                      {ACTION_LABELS[l.action] || l.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {(l.fromStatus || l.toStatus) ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        {l.fromStatus ? (
                          <span className="px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-400 font-mono">
                            {STATUS_LABELS[l.fromStatus] || l.fromStatus}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-gray-700/20 text-gray-500 font-mono">无</span>
                        )}
                        <span className="text-gray-500">→</span>
                        {l.toStatus ? (
                          <span className="px-1.5 py-0.5 rounded bg-ops-info/20 text-ops-info font-mono font-bold">
                            {STATUS_LABELS[l.toStatus] || l.toStatus}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-400">
                    {ENTITY_LABELS[l.entityType] || l.entityType} #{l.entityId}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 max-w-[200px]">
                    <span title={l.detail}>
                      {l.detail.length > DETAIL_MAX ? l.detail.slice(0, DETAIL_MAX) + '…' : l.detail}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

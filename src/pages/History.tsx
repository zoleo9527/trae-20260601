import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, RotateCcw } from 'lucide-react'
import { useOperationLogStore } from '@/stores/operationLogStore'
import type { UserRole, OperationType } from '@/types'
import { ROLE_LABELS, OPERATION_TYPE_LABELS } from '@/types'

const ROLE_OPTIONS: { value: '' | UserRole; label: string }[] = [
  { value: '', label: '全部角色' },
  { value: 'sales', label: '销售内勤' },
  { value: 'warehouse', label: '仓库员' },
  { value: 'aftersales', label: '售后专员' },
]

const TYPE_OPTIONS: { value: '' | OperationType; label: string }[] = [
  { value: '', label: '全部类型' },
  ...Object.entries(OPERATION_TYPE_LABELS).map(([value, label]) => ({
    value: value as OperationType,
    label,
  })),
]

function getDotColor(type: OperationType): string {
  if (type.startsWith('create_') || type.startsWith('resubmit_')) return 'bg-blue-500'
  if (type.startsWith('confirm_') || type.startsWith('reject_')) return 'bg-amber-500'
  if (type.startsWith('approve_')) return 'bg-emerald-500'
  if (type.startsWith('complete_')) return 'bg-purple-500'
  if (type.startsWith('supplement_')) return 'bg-amber-500'
  return 'bg-slate-500'
}

function getBadgeColor(type: OperationType): string {
  if (type.startsWith('create_') || type.startsWith('resubmit_')) return 'bg-blue-500/20 text-blue-400'
  if (type.startsWith('confirm_') || type.startsWith('reject_')) return 'bg-amber-500/20 text-amber-400'
  if (type.startsWith('approve_')) return 'bg-emerald-500/20 text-emerald-400'
  if (type.startsWith('complete_')) return 'bg-purple-500/20 text-purple-400'
  if (type.startsWith('supplement_')) return 'bg-amber-500/20 text-amber-400'
  return 'bg-slate-500/20 text-slate-400'
}

function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

function groupByDate(logs: ReturnType<typeof useOperationLogStore.getState>['logs']) {
  const groups: Record<string, typeof logs> = {}
  for (const log of logs) {
    const date = formatDate(log.operatedAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function History() {
  const [role, setRole] = useState<'' | UserRole>('')
  const [type, setType] = useState<'' | OperationType>('')
  const [keyword, setKeyword] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const getFiltered = useOperationLogStore((s) => s.getFiltered)
  const logs = getFiltered({
    role: role || undefined,
    type: type || undefined,
    keyword: keyword || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const handleReset = () => {
    setRole('')
    setType('')
    setKeyword('')
    setStartDate('')
    setEndDate('')
  }

  const dateGroups = groupByDate(logs)

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">操作历史</h1>
          <span className="bg-slate-700 text-slate-300 text-sm px-2.5 py-0.5 rounded-full">
            {logs.length}
          </span>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">角色</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as '' | UserRole)}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as '' | OperationType)}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs text-slate-400">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索关键词..."
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm [color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm [color-scheme:dark]"
              />
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm py-2"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-20 text-slate-500">暂无操作记录</div>
        ) : (
          <div className="space-y-6">
            {dateGroups.map(([date, groupLogs]) => (
              <div key={date}>
                <div className="sticky top-0 bg-slate-900 py-2 z-10">
                  <span className="text-sm text-slate-400">{date}</span>
                </div>
                <div className="relative ml-4 border-l-2 border-slate-700 pl-6 space-y-4">
                  {groupLogs.map((log) => (
                    <div key={log.id} className="relative flex gap-4">
                      <div className={`absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${getDotColor(log.type)}`} />
                      <div className="text-xs text-slate-500 w-12 pt-0.5 shrink-0">
                        {formatTime(log.operatedAt)}
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(log.type)}`}>
                            {OPERATION_TYPE_LABELS[log.type]}
                          </span>
                          {log.isSupplement && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                              补录
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-300 mb-2">{log.detail}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{log.operatorName}</span>
                          <span className="text-slate-600">·</span>
                          <span>{ROLE_LABELS[log.operatorRole]}</span>
                          {log.relatedId && (
                            <>
                              <span className="text-slate-600">·</span>
                              {log.relatedType === 'warning' ? (
                                <Link
                                  to={`/warnings/${log.relatedId}`}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  查看预警
                                </Link>
                              ) : log.relatedType === 'exchange' ? (
                                <Link
                                  to={`/exchanges/${log.relatedId}`}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  查看换货
                                </Link>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

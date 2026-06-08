import { useState } from 'react'
import { useAppStore } from '@/store/index'
import StatusBadge from '@/components/StatusBadge'
import { Search, ChevronDown, ChevronUp, Clock, Wine, Filter, BarChart3 } from 'lucide-react'
import type { MinibarCheckStatus, MinibarCheck } from '@/types'

const STATUS_OPTIONS: { value: MinibarCheckStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待核对' },
  { value: 'checked', label: '已核对' },
  { value: 'anomaly', label: '异常' },
]

export default function MinibarHistory() {
  const { minibarChecks, rooms, users, uiFilters, updateUiFilter } = useAppStore()

  const searchRoom = uiFilters.historySearchRoom
  const statusFilter = uiFilters.historyStatus
  const dateFrom = uiFilters.historyDateFrom
  const dateTo = uiFilters.historyDateTo

  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId)
  const getUserName = (userId?: string) =>
    userId ? users.find((u) => u.id === userId)?.name : undefined

  const sortedChecks = [...minibarChecks].sort((a, b) =>
    (b.checkedAt ?? b.taskId).localeCompare(a.checkedAt ?? a.taskId)
  )

  const filtered = sortedChecks.filter((check) => {
    const room = getRoom(check.roomId)
    if (!room) return false
    if (searchRoom && !room.number.includes(searchRoom)) return false
    if (statusFilter !== 'all' && check.status !== statusFilter) return false
    if (dateFrom) {
      const checkDate = check.checkedAt ?? ''
      if (checkDate && checkDate < dateFrom) return false
    }
    if (dateTo) {
      const checkDate = check.checkedAt ?? ''
      if (checkDate && checkDate > dateTo + 'T23:59:59') return false
    }
    return true
  })

  const summaryStats = (() => {
    let anomalyCount = 0
    let anomalyAmount = 0
    for (const check of filtered) {
      if (check.status === 'anomaly') {
        anomalyCount += 1
        for (const item of check.items) {
          if (item.isAnomaly) {
            anomalyAmount += (item.expectedCount - item.actualCount) * item.unitPrice
          }
        }
      }
    }
    return { total: filtered.length, anomalyCount, anomalyAmount }
  })()

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (checkId: string) => {
    setExpandedId((prev) => (prev === checkId ? null : checkId))
  }

  const formatTime = (iso?: string) => {
    if (!iso) return '--'
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const formatDate = (iso?: string) => {
    if (!iso) return '--'
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">核对历史</h1>

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter size={14} />
          筛选条件
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">房号关键字</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchRoom}
                onChange={(e) => updateUiFilter('historySearchRoom', e.target.value)}
                placeholder="输入房号"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">核对状态</label>
            <select
              value={statusFilter}
              onChange={(e) => updateUiFilter('historyStatus', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">时间区间</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => updateUiFilter('historyDateFrom', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
              <span className="shrink-0 text-xs text-gray-400">至</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => updateUiFilter('historyDateTo', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
          </div>
        </div>
        {(searchRoom || statusFilter !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => {
              updateUiFilter('historySearchRoom', '')
              updateUiFilter('historyStatus', 'all')
              updateUiFilter('historyDateFrom', '')
              updateUiFilter('historyDateTo', '')
            }}
            className="mt-2 text-xs text-[#1E3A5F] hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-6 rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 size={14} className="text-[#1E3A5F]" />
          <span className="text-gray-500">核对总数</span>
          <span className="font-bold text-[#1E3A5F]">{summaryStats.total}</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">异常单数</span>
          <span className={`font-bold ${summaryStats.anomalyCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {summaryStats.anomalyCount}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">异常金额合计</span>
          <span className={`font-bold ${summaryStats.anomalyAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            ¥{summaryStats.anomalyAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-400">
          暂无核对记录
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((check) => {
            const room = getRoom(check.roomId)
            const checker = getUserName(check.checkedBy)
            const anomalyItems = check.items.filter((i) => i.isAnomaly)
            const isExpanded = expandedId === check.id

            return (
              <MinibarCheckCard
                key={check.id}
                check={check}
                roomNumber={room?.number ?? '--'}
                checkerName={checker}
                isExpanded={isExpanded}
                onToggle={toggleExpand}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MinibarCheckCard({
  check,
  roomNumber,
  checkerName,
  isExpanded,
  onToggle,
  formatDate,
  formatTime,
}: {
  check: MinibarCheck
  roomNumber: string
  checkerName?: string
  isExpanded: boolean
  onToggle: (id: string) => void
  formatDate: (iso?: string) => string
  formatTime: (iso?: string) => string
}) {
  const anomalyItems = check.items.filter((i) => i.isAnomaly)
  const anomalyAmount = anomalyItems.reduce(
    (sum, i) => sum + (i.expectedCount - i.actualCount) * i.unitPrice, 0
  )

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div
        className="cursor-pointer p-4"
        onClick={() => onToggle(check.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wine size={16} className="text-[#1E3A5F]" />
            <span className="font-serif text-lg font-bold text-[#1E3A5F]">
              {roomNumber}
            </span>
            <StatusBadge status={check.status} category="minibar" />
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
          {check.checkedAt && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(check.checkedAt)}
            </span>
          )}
          {checkerName && <span>核对人：{checkerName}</span>}
        </div>

        {anomalyItems.length > 0 && !isExpanded && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {anomalyItems.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                >
                  {item.name} 少{item.expectedCount - item.actualCount}件
                </span>
              ))}
            </div>
            <span className="text-xs font-semibold text-red-600">
              ¥{anomalyAmount.toFixed(2)}
            </span>
          </div>
        )}

        {check.reviewRemarks && !isExpanded && (
          <div className="mt-1 text-xs text-gray-500">
            审核备注：{check.reviewRemarks}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500">
                <th className="pb-2 text-left font-medium">商品</th>
                <th className="pb-2 text-center font-medium">应有</th>
                <th className="pb-2 text-center font-medium">实际</th>
                <th className="pb-2 text-center font-medium">差异</th>
                <th className="pb-2 text-center font-medium">单价</th>
                <th className="pb-2 text-center font-medium">金额</th>
              </tr>
            </thead>
            <tbody>
              {check.items.map((item) => {
                const diff = item.expectedCount - item.actualCount
                return (
                  <tr
                    key={item.id}
                    className={
                      item.isAnomaly
                        ? 'border-l-4 border-l-amber-400 bg-amber-50/50'
                        : ''
                    }
                  >
                    <td className="py-1.5 px-2 font-medium">{item.name}</td>
                    <td className="py-1.5 px-2 text-center text-gray-600">
                      {item.expectedCount}
                    </td>
                    <td className="py-1.5 px-2 text-center">{item.actualCount}</td>
                    <td className="py-1.5 px-2 text-center">
                      {diff > 0 ? (
                        <span className="text-xs font-medium text-amber-600">
                          少{diff}件
                        </span>
                      ) : diff < 0 ? (
                        <span className="text-xs font-medium text-amber-600">
                          多{Math.abs(diff)}件
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-500">
                          ✓
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center text-gray-400">
                      ¥{item.unitPrice}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {diff !== 0 ? (
                        <span className="text-xs font-semibold text-red-600">
                          ¥{(Math.abs(diff) * item.unitPrice).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {anomalyItems.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-amber-600">
                异常{anomalyItems.length}项，金额合计
              </span>
              <span className="text-sm font-bold text-red-600">
                ¥{anomalyAmount.toFixed(2)}
              </span>
            </div>
          )}
          {check.reviewRemarks && (
            <div className="mt-3 rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-xs text-gray-400">审核备注</p>
              <p className="mt-1 text-sm text-gray-700">{check.reviewRemarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

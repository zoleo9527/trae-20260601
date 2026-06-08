import { useState } from 'react'
import { useAppStore } from '@/store/index'
import StatusBadge from '@/components/StatusBadge'
import { Search, ChevronDown, ChevronUp, Clock, Wine } from 'lucide-react'
import type { MinibarCheckStatus } from '@/types'

const STATUS_OPTIONS: { value: MinibarCheckStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待核对' },
  { value: 'checked', label: '已核对' },
  { value: 'anomaly', label: '异常' },
]

export default function MinibarHistory() {
  const { minibarChecks, rooms, users } = useAppStore()

  const [searchRoom, setSearchRoom] = useState('')
  const [statusFilter, setStatusFilter] = useState<MinibarCheckStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId)
  const getUserName = (userId?: string) =>
    userId ? users.find((u) => u.id === userId)?.name : undefined

  const sortedChecks = [...minibarChecks].sort((a, b) =>
    (b.checkedAt ?? '').localeCompare(a.checkedAt ?? '')
  )

  const filtered = sortedChecks.filter((check) => {
    const room = getRoom(check.roomId)
    if (!room) return false
    if (searchRoom && !room.number.includes(searchRoom)) return false
    if (statusFilter !== 'all' && check.status !== statusFilter) return false
    return true
  })

  const toggleExpand = (checkId: string) => {
    setExpandedId((prev) => (prev === checkId ? null : checkId))
  }

  const formatTime = (iso?: string) => {
    if (!iso) return '--'
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">核对历史</h1>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchRoom}
            onChange={(e) => setSearchRoom(e.target.value)}
            placeholder="搜索房号"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-[#1E3A5F] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MinibarCheckStatus | 'all')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#1E3A5F] focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
              <div
                key={check.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div
                  className="cursor-pointer p-4"
                  onClick={() => toggleExpand(check.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wine size={16} className="text-[#1E3A5F]" />
                      <span className="font-serif text-lg font-bold text-[#1E3A5F]">
                        {room?.number ?? '--'}
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
                        {formatTime(check.checkedAt)}
                      </span>
                    )}
                    {checker && <span>核对人：{checker}</span>}
                  </div>

                  {anomalyItems.length > 0 && !isExpanded && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {anomalyItems.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                        >
                          {item.name} 少{item.expectedCount - item.actualCount}件
                        </span>
                      ))}
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
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {anomalyItems.length > 0 && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                        异常{anomalyItems.length}项，金额合计 ¥
                        {anomalyItems.reduce(
                          (sum, i) => sum + (i.expectedCount - i.actualCount) * i.unitPrice,
                          0
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

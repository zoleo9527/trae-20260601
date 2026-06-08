import { useState } from 'react'
import { useAppStore } from '@/store/index'
import { AlertTriangle, CheckCircle, XCircle, Search, Filter, MessageSquare } from 'lucide-react'

export default function MinibarReview() {
  const { minibarChecks, rooms, users, uiFilters, updateUiFilter, reviewMinibarAnomaly } = useAppStore()

  const searchRoom = uiFilters.reviewSearchRoom
  const showAll = uiFilters.reviewShowAll

  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({})

  const getRoomNumber = (roomId: string) =>
    rooms.find((r) => r.id === roomId)?.number ?? roomId

  const getUserName = (userId?: string) =>
    userId ? users.find((u) => u.id === userId)?.name : undefined

  const displayChecks = showAll
    ? minibarChecks.filter((c) => c.status === 'anomaly' || c.status === 'checked')
    : minibarChecks.filter((c) => c.status === 'anomaly')

  const filtered = displayChecks.filter((check) => {
    if (searchRoom) {
      const roomNumber = getRoomNumber(check.roomId)
      if (!roomNumber.includes(searchRoom)) return false
    }
    return true
  })

  const anomalyCount = filtered.filter((c) => c.status === 'anomaly').length
  const totalAnomalyAmount = filtered
    .filter((c) => c.status === 'anomaly')
    .reduce((total, check) => {
      return total + check.items
        .filter((i) => i.isAnomaly)
        .reduce((sum, i) => sum + (i.expectedCount - i.actualCount) * i.unitPrice, 0)
    }, 0)

  const handleReview = (checkId: string, approved: boolean) => {
    const remarks = remarksMap[checkId] ?? ''
    reviewMinibarAnomaly(checkId, approved, remarks || undefined)
    setRemarksMap((prev) => {
      const next = { ...prev }
      delete next[checkId]
      return next
    })
  }

  const handleRemarksChange = (checkId: string, value: string) => {
    setRemarksMap((prev) => ({ ...prev, [checkId]: value }))
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">迷你吧异常审核</h1>

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter size={14} />
          筛选条件
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-400">房号关键字</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchRoom}
                onChange={(e) => updateUiFilter('reviewSearchRoom', e.target.value)}
                placeholder="输入房号"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">显示范围</label>
            <div className="flex rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => updateUiFilter('reviewShowAll', false)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${!showAll ? 'bg-[#1E3A5F] text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-l-lg`}
              >
                待审核{anomalyCount > 0 && ` (${anomalyCount})`}
              </button>
              <button
                onClick={() => updateUiFilter('reviewShowAll', true)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${showAll ? 'bg-[#1E3A5F] text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-r-lg`}
              >
                全部
              </button>
            </div>
          </div>
        </div>
        {searchRoom && (
          <button
            onClick={() => updateUiFilter('reviewSearchRoom', '')}
            className="mt-2 text-xs text-[#1E3A5F] hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {anomalyCount > 0 && !showAll && (
        <div className="mb-4 flex items-center gap-6 rounded-lg border border-amber-200 bg-amber-50/50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-gray-600">待审核</span>
            <span className="font-bold text-amber-600">{anomalyCount}</span>
            <span className="text-gray-600">单</span>
          </div>
          <div className="h-4 w-px bg-amber-200" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">异常金额合计</span>
            <span className="font-bold text-red-600">¥{totalAnomalyAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckCircle size={48} className="mb-3" />
          <p className="text-lg">{showAll ? '暂无审核记录' : '暂无异常待审核'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((check) => {
            const anomalyItems = check.items.filter((item) => item.isAnomaly)
            const totalAnomalyAmountForCheck = anomalyItems.reduce(
              (sum, item) => sum + (item.expectedCount - item.actualCount) * item.unitPrice,
              0
            )
            const checkerName = getUserName(check.checkedBy)
            const isAnomaly = check.status === 'anomaly'
            const isReviewed = check.status === 'checked' && check.reviewedBy
            const reviewerName = getUserName(check.reviewedBy)

            return (
              <div
                key={check.id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm ${isAnomaly ? 'border-amber-200' : 'border-gray-200'}`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-xl font-bold text-[#1E3A5F]">
                        {getRoomNumber(check.roomId)}
                      </span>
                      {isAnomaly && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <AlertTriangle size={12} />
                          待审核
                        </span>
                      )}
                      {isReviewed && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle size={12} />
                          已审核
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {check.checkedAt
                        ? new Date(check.checkedAt).toLocaleString('zh-CN')
                        : ''}
                    </span>
                  </div>

                  {checkerName && (
                    <p className="mb-3 text-xs text-gray-400">核对人：{checkerName}</p>
                  )}

                  <div className="mb-4 space-y-2">
                    {anomalyItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5"
                      >
                        <span className="text-sm font-medium text-amber-800">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-amber-600">
                            应{item.expectedCount} / 实{item.actualCount}
                          </span>
                          <span className="text-sm font-semibold text-red-600 min-w-[70px] text-right">
                            ¥{((item.expectedCount - item.actualCount) * item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-sm font-semibold text-red-600">
                      异常金额：¥{totalAnomalyAmountForCheck.toFixed(2)}
                    </span>
                    {isAnomaly && (
                      <span className="text-xs text-gray-400">
                        {anomalyItems.length} 项异常
                      </span>
                    )}
                  </div>

                  {isAnomaly && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-1.5 text-sm text-gray-600">
                        <MessageSquare size={14} />
                        处理备注
                      </div>
                      <textarea
                        value={remarksMap[check.id] ?? ''}
                        onChange={(e) => handleRemarksChange(check.id, e.target.value)}
                        placeholder="填写审核备注（选填）..."
                        className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-[#1E3A5F] focus:outline-none"
                        rows={2}
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => handleReview(check.id, false)}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                        >
                          <XCircle size={16} />
                          驳回
                        </button>
                        <button
                          onClick={() => handleReview(check.id, true)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162d4a]"
                        >
                          <CheckCircle size={16} />
                          确认收费
                        </button>
                      </div>
                    </div>
                  )}

                  {isReviewed && check.reviewRemarks && (
                    <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                      <p className="text-xs text-emerald-600">
                        审核备注{reviewerName ? `（${reviewerName}）` : ''}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{check.reviewRemarks}</p>
                    </div>
                  )}

                  {isReviewed && check.reviewedAt && (
                    <div className="mt-2 text-xs text-gray-400">
                      审核时间：{new Date(check.reviewedAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

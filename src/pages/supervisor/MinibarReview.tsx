import { useAppStore } from '@/store/index'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function MinibarReview() {
  const { minibarChecks, rooms, reviewMinibarAnomaly } = useAppStore()

  const anomalyChecks = minibarChecks.filter((c) => c.status === 'anomaly')

  const getRoomNumber = (roomId: string) =>
    rooms.find((r) => r.id === roomId)?.number ?? roomId

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">迷你吧异常审核</h1>

      {anomalyChecks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckCircle size={48} className="mb-3" />
          <p className="text-lg">暂无异常待审核</p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalyChecks.map((check) => {
            const anomalyItems = check.items.filter((item) => item.isAnomaly)
            const totalAnomalyAmount = anomalyItems.reduce(
              (sum, item) => sum + (item.expectedCount - item.actualCount) * item.unitPrice,
              0
            )

            return (
              <div
                key={check.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl font-bold text-[#1E3A5F]">
                      {getRoomNumber(check.roomId)}
                    </span>
                    <AlertTriangle size={18} className="text-amber-500" />
                  </div>
                  <span className="text-sm text-gray-400">
                    {check.checkedAt
                      ? new Date(check.checkedAt).toLocaleString('zh-CN')
                      : ''}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  {anomalyItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-amber-800">
                        {item.name}
                      </span>
                      <span className="text-sm text-amber-600">
                        应{item.expectedCount} / 实{item.actualCount}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        ¥{((item.expectedCount - item.actualCount) * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-semibold text-red-600">
                    异常金额：¥{totalAnomalyAmount.toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewMinibarAnomaly(check.id, false)}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      <XCircle size={16} />
                      驳回
                    </button>
                    <button
                      onClick={() => reviewMinibarAnomaly(check.id, true)}
                      className="flex items-center gap-1 rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162d4a]"
                    >
                      <CheckCircle size={16} />
                      确认收费
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

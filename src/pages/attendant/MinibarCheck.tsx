import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/index'
import { ArrowRight, Info, CheckCircle2, AlertTriangle, Clock, User } from 'lucide-react'
import type { MinibarCheck as MinibarCheckType } from '@/types'

export default function MinibarCheckPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { inspectionTasks, rooms, minibarChecks, inspectionResults, users, submitMinibarCheck } = useAppStore()

  const task = inspectionTasks.find((t) => t.id === taskId)
  const room = task ? rooms.find((r) => r.id === task.roomId) : undefined
  const minibarCheck = [...minibarChecks].reverse().find((c) => c.taskId === taskId)
  const inspectionResult = taskId
    ? inspectionResults.find((r) => r.taskId === taskId)
    : undefined

  const [itemCounts, setItemCounts] = useState<Record<string, number>>(() => {
    if (!minibarCheck) return {}
    return Object.fromEntries(minibarCheck.items.map((item) => [item.id, item.actualCount]))
  })

  const fromInspection = task?.status === 'completed'

  if (!task || !room) {
    return <div className="py-12 text-center text-gray-400">任务不存在</div>
  }

  if (!minibarCheck) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">{room.number} 迷你吧核对</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          未找到迷你吧核对记录，请先完成查房
        </div>
        <button
          onClick={() => navigate('/attendant')}
          className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          返回工作台
        </button>
      </div>
    )
  }

  const checkerName = minibarCheck.checkedBy
    ? users.find((u) => u.id === minibarCheck.checkedBy)?.name
    : undefined

  if (minibarCheck.status === 'checked') {
    return (
      <div>
        <div className="mb-2 text-sm text-gray-500">
          <span className="cursor-pointer text-[#1E3A5F] hover:underline" onClick={() => navigate('/attendant')}>
            工作台
          </span>
          <span className="mx-1">&gt;</span>
          <span>{room.number} 迷你吧</span>
        </div>
        <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">{room.number} 迷你吧核对</h1>

        <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <CheckCircle2 size={24} className="text-emerald-500" />
          <span className="text-base font-medium text-emerald-700">核对完成，无异常</span>
        </div>

        <MinibarItemsReadonly items={minibarCheck.items} />

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          {minibarCheck.checkedAt && (
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(minibarCheck.checkedAt).toLocaleString('zh-CN')}</span>
          )}
          {checkerName && (
            <span className="flex items-center gap-1"><User size={12} /> {checkerName}</span>
          )}
        </div>
      </div>
    )
  }

  if (minibarCheck.status === 'anomaly') {
    const anomalyItems = minibarCheck.items.filter((i) => i.isAnomaly)
    const totalAnomalyAmount = anomalyItems.reduce(
      (sum, item) => sum + (item.expectedCount - item.actualCount) * item.unitPrice, 0
    )

    return (
      <div>
        <div className="mb-2 text-sm text-gray-500">
          <span className="cursor-pointer text-[#1E3A5F] hover:underline" onClick={() => navigate('/attendant')}>
            工作台
          </span>
          <span className="mx-1">&gt;</span>
          <span>{room.number} 迷你吧</span>
        </div>
        <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">{room.number} 迷你吧核对</h1>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={24} className="text-amber-500" />
            <span className="text-base font-medium text-amber-700">异常已上报，等待主管审核</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-red-600">¥{totalAnomalyAmount.toFixed(2)}</p>
            <p className="text-xs text-amber-600">{anomalyItems.length} 项异常</p>
          </div>
        </div>

        <MinibarItemsReadonly items={minibarCheck.items} highlightAnomaly />

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          {minibarCheck.checkedAt && (
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(minibarCheck.checkedAt).toLocaleString('zh-CN')}</span>
          )}
          {checkerName && (
            <span className="flex items-center gap-1"><User size={12} /> {checkerName}</span>
          )}
        </div>
      </div>
    )
  }

  const handleCountChange = (itemId: string, value: number) => {
    setItemCounts((prev) => ({ ...prev, [itemId]: value }))
  }

  const handleSubmit = () => {
    const items = minibarCheck.items.map((item) => ({
      id: item.id,
      actualCount: itemCounts[item.id] ?? item.expectedCount,
    }))
    submitMinibarCheck(minibarCheck.id, items)
    navigate('/attendant')
  }

  const totalItems = minibarCheck.items.length
  const anomalyItems = minibarCheck.items.filter(
    (item) => (itemCounts[item.id] ?? item.expectedCount) !== item.expectedCount
  )
  const anomalyAmount = anomalyItems.reduce((sum, item) => {
    const diff = item.expectedCount - (itemCounts[item.id] ?? item.expectedCount)
    return sum + diff * item.unitPrice
  }, 0)

  return (
    <div className="pb-20">
      <div className="mb-2 text-sm text-gray-500">
        <span className="cursor-pointer text-[#1E3A5F] hover:underline" onClick={() => navigate('/attendant')}>
          工作台
        </span>
        <span className="mx-1">&gt;</span>
        <span>{room.number} 迷你吧核对</span>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">{room.number} 迷你吧核对</h1>

      {fromInspection && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Info size={16} />
          <span>查房已完成，请继续完成迷你吧核对</span>
          <ArrowRight size={14} className="ml-1" />
        </div>
      )}

      {inspectionResult && !inspectionResult.facilityOk && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} />
          <span>查房发现设施问题，维修工单已自动创建</span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500">
              <th className="px-4 py-2.5 text-left font-medium">商品名称</th>
              <th className="px-4 py-2.5 text-center font-medium">应有数量</th>
              <th className="px-4 py-2.5 text-center font-medium">实际数量</th>
              <th className="px-4 py-2.5 text-center font-medium">单价</th>
              <th className="px-4 py-2.5 text-center font-medium">差异</th>
            </tr>
          </thead>
          <tbody>
            {minibarCheck.items.map((item) => {
              const actual = itemCounts[item.id] ?? item.expectedCount
              const diff = item.expectedCount - actual
              const isAnomaly = diff !== 0
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 last:border-0 transition-colors ${isAnomaly ? 'border-l-4 border-l-amber-400 bg-amber-50/50' : ''}`}
                >
                  <td className="px-4 py-2.5 font-medium">{item.name}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{item.expectedCount}</td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      value={actual}
                      onChange={(e) => handleCountChange(item.id, parseInt(e.target.value) || 0)}
                      className={`w-16 rounded border px-2 py-1 text-center text-sm focus:outline-none ${isAnomaly ? 'border-amber-300 bg-amber-50 focus:border-amber-500' : 'border-gray-200 focus:border-[#1E3A5F]'}`}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center text-gray-600">¥{item.unitPrice}</td>
                  <td className="px-4 py-2.5 text-center">
                    {diff > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        少{diff}件
                      </span>
                    ) : diff < 0 ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        多{Math.abs(diff)}件
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-500">✓</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">商品总数</span>
          <span className="font-medium">{totalItems} 项</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-gray-500">异常项数</span>
          <span className={`font-medium ${anomalyItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {anomalyItems.length} 项
          </span>
        </div>
        {anomalyAmount > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm border-t border-gray-100 pt-2">
            <span className="text-gray-500">异常金额</span>
            <span className="text-lg font-bold text-amber-600">¥{anomalyAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 right-0 left-64 border-t border-gray-200 bg-white px-6 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-[#1E3A5F] px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#16304f]"
          >
            提交核对结果
          </button>
          {anomalyItems.length > 0 && (
            <span className="text-xs text-amber-600">
              提交后异常将自动上报主管审核
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MinibarItemsReadonly({
  items,
  highlightAnomaly,
}: {
  items: MinibarCheckType['items']
  highlightAnomaly?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-xs text-gray-500">
            <th className="px-4 py-2.5 text-left font-medium">商品名称</th>
            <th className="px-4 py-2.5 text-center font-medium">应有</th>
            <th className="px-4 py-2.5 text-center font-medium">实际</th>
            <th className="px-4 py-2.5 text-center font-medium">差异</th>
            <th className="px-4 py-2.5 text-center font-medium">金额</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const diff = item.expectedCount - item.actualCount
            return (
              <tr
                key={item.id}
                className={`border-b border-gray-100 last:border-0 ${
                  highlightAnomaly && item.isAnomaly
                    ? 'border-l-4 border-l-amber-400 bg-amber-50/50'
                    : ''
                }`}
              >
                <td className="px-4 py-2.5 font-medium">{item.name}</td>
                <td className="px-4 py-2.5 text-center text-gray-600">{item.expectedCount}</td>
                <td className="px-4 py-2.5 text-center">{item.actualCount}</td>
                <td className="px-4 py-2.5 text-center">
                  {diff > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      少{diff}件
                    </span>
                  ) : diff < 0 ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      多{Math.abs(diff)}件
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-500">✓</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {diff !== 0 ? (
                    <span className="text-xs font-semibold text-red-600">¥{(Math.abs(diff) * item.unitPrice).toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreweryStore } from '../store/useBreweryStore'
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
  ALERT_LEVEL_COLORS,
  USER_ROLE_LABELS,
  BatchStatus,
} from '../types'

const PIPELINE_ORDER: BatchStatus[] = [
  'PENDING',
  'FEEDING',
  'FERMENTING',
  'CONDITIONING',
  'READY',
  'PACKAGED',
]

function MiniPipeline({ current }: { current: BatchStatus }) {
  const isAbnormal = current === 'ABNORMAL'
  const activeIdx = isAbnormal
    ? PIPELINE_ORDER.indexOf('FERMENTING')
    : PIPELINE_ORDER.indexOf(current)

  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_ORDER.map((status, idx) => {
        const reached = idx <= activeIdx && !isAbnormal
        const isCurrent = status === current && !isAbnormal
        return (
          <div key={status} className="flex items-center">
            <div
              className={`h-1.5 rounded-full ${
                isCurrent
                  ? BATCH_STATUS_COLORS[status]
                  : reached
                  ? `${BATCH_STATUS_COLORS[status]} opacity-70`
                  : 'bg-brew-border'
              }`}
              style={{ width: `${100 / PIPELINE_ORDER.length}%`, minWidth: 16 }}
            />
          </div>
        )
      })}
      {isAbnormal && (
        <div className="h-1.5 rounded-full bg-red-500 w-4" />
      )}
    </div>
  )
}

type TimelineEvent = {
  id: string
  time: string
  type: 'status' | 'feeding_change' | 'alert' | 'packaging'
  icon: string
  title: string
  detail: string
  extra?: string
  color: string
}

export default function SalesPage() {
  const navigate = useNavigate()
  const {
    batches,
    recipes,
    packagingRecords,
    feedings,
    feedingChangeLogs,
    batchStateLogs,
    alerts,
  } = useBreweryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)

  const filteredBatches = batches.filter(
    (b) =>
      b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tankId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRecipe = (recipeId: string) => {
    return recipes.find((r) => r.id === recipeId)
  }

  const getPackagingRecords = (batchId: string) => {
    return packagingRecords.filter((p) => p.batchId === batchId)
  }

  const getTotalPackaged = (batchId: string) => {
    return getPackagingRecords(batchId)
      .filter((p) => p.qualityStatus === 'pass')
      .reduce((sum, p) => sum + p.quantity, 0)
  }

  const selectedBatchData = selectedBatch ? batches.find((b) => b.id === selectedBatch) : null
  const selectedRecipe = selectedBatchData ? getRecipe(selectedBatchData.recipeId) : null
  const selectedFeeding = selectedBatch
    ? feedings.find((f) => f.batchId === selectedBatch)
    : null
  const selectedFeedingLogs = selectedFeeding
    ? feedingChangeLogs.filter((l) => l.feedingId === selectedFeeding.id)
    : []
  const selectedBatchLogs = selectedBatch
    ? batchStateLogs
        .filter((l) => l.batchId === selectedBatch)
        .sort((a, b) => new Date(b.changeTime).getTime() - new Date(a.changeTime).getTime())
    : []
  const selectedAlerts = selectedBatch
    ? alerts
        .filter((a) => a.batchId === selectedBatch)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []
  const selectedPackaging = selectedBatch
    ? packagingRecords
        .filter((p) => p.batchId === selectedBatch)
        .sort((a, b) => new Date(b.packagingTime).getTime() - new Date(a.packagingTime).getTime())
    : []

  const selectedAllEvents: TimelineEvent[] = selectedBatch
    ? [
        ...selectedBatchLogs.map((log) => ({
          id: log.id,
          time: log.changeTime,
          type: 'status' as const,
          icon: '🔄',
          title: `${BATCH_STATUS_LABELS[log.fromStatus]} → ${BATCH_STATUS_LABELS[log.toStatus]}`,
          detail: log.reason,
          extra: `${log.operator}（${USER_ROLE_LABELS[log.operatorRole]}）`,
          color: BATCH_STATUS_COLORS[log.toStatus],
        })),
        ...selectedFeedingLogs.map((log) => ({
          id: log.id,
          time: log.changeTime,
          type: 'feeding_change' as const,
          icon: '✏️',
          title: `投料修改：${log.fieldName === 'ingredients' ? '原料明细' : log.fieldName}`,
          detail: `${log.oldValue} → ${log.newValue}`,
          extra: `${log.operator}${log.reason ? `，原因：${log.reason}` : ''}`,
          color: 'bg-amber-600',
        })),
        ...selectedAlerts.map((alert) => ({
          id: alert.id,
          time: alert.createdAt,
          type: 'alert' as const,
          icon: alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '🟡' : '🔵',
          title: alert.message,
          detail: alert.status === 'pending' ? '待处理' : alert.status === 'resolved' ? '已解决' : '已退回',
          extra: alert.resolution ? `处理：${alert.resolution}` : undefined,
          color: ALERT_LEVEL_COLORS[alert.level],
        })),
        ...selectedPackaging.map((pkg) => ({
          id: pkg.id,
          time: pkg.packagingTime,
          type: 'packaging' as const,
          icon: '📦',
          title: `包装：${pkg.packagingType} × ${pkg.quantity}`,
          detail: `质检：${pkg.qualityStatus === 'pass' ? '✅ 通过' : pkg.qualityStatus === 'fail' ? '❌ 不合格' : '⏳ 待检'}`,
          extra: pkg.operator,
          color: pkg.qualityStatus === 'pass' ? 'bg-green-600' : pkg.qualityStatus === 'fail' ? 'bg-red-600' : 'bg-gray-600',
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🔍 销售查询与追溯</h2>
        <div className="w-64">
          <input
            type="text"
            className="input"
            placeholder="搜索批次号、名称、罐号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-brew-border font-medium">
          批次库存列表 ({filteredBatches.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brew-lighter">
                <th className="table-cell text-left">批次号</th>
                <th className="table-cell text-left">名称</th>
                <th className="table-cell text-left">状态</th>
                <th className="table-cell text-left">流程进度</th>
                <th className="table-cell text-left">配方</th>
                <th className="table-cell text-left">发酵罐</th>
                <th className="table-cell text-left">容量</th>
                <th className="table-cell text-left">已包装</th>
                <th className="table-cell text-left">开始时间</th>
                <th className="table-cell text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches
                .slice()
                .sort((a, b) => b.startTime.localeCompare(a.startTime))
                .map((batch) => {
                  const recipe = getRecipe(batch.recipeId)
                  const totalPackaged = getTotalPackaged(batch.id)
                  const batchAlerts = alerts.filter(
                    (a) => a.batchId === batch.id && a.status === 'pending'
                  )
                  const batchFeeding = feedings.find((f) => f.batchId === batch.id)
                  const batchFeedingLogs = batchFeeding
                    ? feedingChangeLogs.filter((l) => l.feedingId === batchFeeding.id)
                    : []

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-brew-lighter/50 cursor-pointer ${
                        selectedBatch === batch.id ? 'bg-amber-900/20' : ''
                      }`}
                      onClick={() =>
                        setSelectedBatch(selectedBatch === batch.id ? null : batch.id)
                      }
                    >
                      <td className="table-cell font-mono font-bold">
                        {batch.batchNumber}
                        {batchAlerts.length > 0 && (
                          <span className="ml-1 text-xs text-red-400">⚠{batchAlerts.length}</span>
                        )}
                        {batchFeedingLogs.length > 0 && (
                          <span className="ml-1 text-xs text-amber-400">✏{batchFeedingLogs.length}</span>
                        )}
                      </td>
                      <td className="table-cell">{batch.name}</td>
                      <td className="table-cell">
                        <span className={`status-badge ${BATCH_STATUS_COLORS[batch.status]}`}>
                          {BATCH_STATUS_LABELS[batch.status]}
                        </span>
                      </td>
                      <td className="table-cell w-32">
                        <MiniPipeline current={batch.status} />
                      </td>
                      <td className="table-cell">{recipe?.name || '-'}</td>
                      <td className="table-cell">{batch.tankId}</td>
                      <td className="table-cell">{batch.volume}L</td>
                      <td className="table-cell">{totalPackaged > 0 ? totalPackaged : '-'}</td>
                      <td className="table-cell text-xs text-gray-400">
                        {new Date(batch.startTime).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/batches/${batch.id}`)}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          完整追溯 →
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBatchData && (
        <div className="card">
          <div className="px-4 py-3 border-b border-brew-border font-medium flex items-center justify-between">
            <span>
              📋 批次追溯：{selectedBatchData.batchNumber} — {selectedBatchData.name}
            </span>
            <button
              onClick={() => navigate(`/batches/${selectedBatchData.id}`)}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              打开完整追溯页 →
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-brew-lighter p-3 rounded">
                <div className="text-xs text-gray-400">当前状态</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`status-badge ${BATCH_STATUS_COLORS[selectedBatchData.status]}`}>
                    {BATCH_STATUS_LABELS[selectedBatchData.status]}
                  </span>
                </div>
                <div className="mt-2">
                  <MiniPipeline current={selectedBatchData.status} />
                </div>
              </div>

              <div className="bg-brew-lighter p-3 rounded">
                <div className="text-xs text-gray-400">投料</div>
                <div className="mt-1">
                  {selectedFeeding ? (
                    <div>
                      <span
                        className={`status-badge text-xs ${
                          selectedFeeding.status === 'modified'
                            ? 'bg-amber-600'
                            : selectedFeeding.status === 'confirmed'
                            ? 'bg-green-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        {selectedFeeding.status === 'modified'
                          ? '已修改'
                          : selectedFeeding.status === 'confirmed'
                          ? '已确认'
                          : '草稿'}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {selectedFeeding.brewerName} · {selectedFeeding.totalWeight.toFixed(2)}kg
                      </div>
                      {selectedFeedingLogs.length > 0 && (
                        <div className="text-xs text-amber-400 mt-0.5">
                          {selectedFeedingLogs.length}次变更
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">未投料</span>
                  )}
                </div>
              </div>

              <div className="bg-brew-lighter p-3 rounded">
                <div className="text-xs text-gray-400">包装</div>
                <div className="mt-1">
                  {selectedPackaging.length > 0 ? (
                    <div>
                      <div className="text-sm font-medium text-green-400">
                        {getTotalPackaged(selectedBatchData.id)} 件
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        共 {selectedPackaging.length} 次包装
                      </div>
                      {selectedPackaging.some((p) => p.qualityStatus === 'fail') && (
                        <div className="text-xs text-red-400">有不合格</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">未包装</span>
                  )}
                </div>
              </div>

              <div className="bg-brew-lighter p-3 rounded">
                <div className="text-xs text-gray-400">异常</div>
                <div className="mt-1">
                  {selectedAlerts.length > 0 ? (
                    <div>
                      {selectedAlerts.filter((a) => a.status === 'pending').length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-700 rounded text-white">
                          {selectedAlerts.filter((a) => a.status === 'pending').length} 待处理
                        </span>
                      )}
                      {selectedAlerts.filter((a) => a.status === 'resolved').length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-700 rounded text-white ml-1">
                          {selectedAlerts.filter((a) => a.status === 'resolved').length} 已解决
                        </span>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        共 {selectedAlerts.length} 条
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">无异常</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  📋 追溯时间线 ({selectedAllEvents.length})
                </h4>
                <div className="bg-brew-lighter rounded p-3 max-h-64 overflow-y-auto">
                  {selectedAllEvents.length > 0 ? (
                    <div className="relative">
                      {selectedAllEvents.map((event, index) => (
                        <div key={event.id} className="flex gap-2 mb-3 last:mb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${event.color} shrink-0`} />
                            {index < selectedAllEvents.length - 1 && (
                              <div className="w-0.5 flex-1 bg-brew-border my-0.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{event.icon}</span>
                              <span className="text-xs font-medium">{event.title}</span>
                            </div>
                            <div className="text-xs text-gray-400 break-words">{event.detail}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(event.time).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-2 text-sm">暂无记录</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">🍺 投料摘要</h4>
                <div className="bg-brew-lighter rounded p-3">
                  {selectedFeeding ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">酿酒师</span>
                        <span>{selectedFeeding.brewerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">投料时间</span>
                        <span className="text-xs">
                          {new Date(selectedFeeding.feedingTime).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">总重量</span>
                        <span>{selectedFeeding.totalWeight.toFixed(3)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">原料种数</span>
                        <span>{selectedFeeding.ingredients.length} 种</span>
                      </div>
                      {selectedFeedingLogs.length > 0 && (
                        <div className="border-t border-brew-border pt-2 mt-2">
                          <div className="text-xs text-amber-400 mb-1">
                            变更记录 ({selectedFeedingLogs.length})
                          </div>
                          <div className="space-y-1">
                            {selectedFeedingLogs.slice(0, 3).map((log) => (
                              <div key={log.id} className="text-xs">
                                <span className="text-amber-300">
                                  {log.fieldName === 'ingredients' ? '原料明细' : log.fieldName}
                                </span>
                                <span className="text-gray-500 ml-1">
                                  {new Date(log.changeTime).toLocaleDateString('zh-CN')}
                                </span>
                                {log.reason && (
                                  <div className="text-gray-400">原因：{log.reason}</div>
                                )}
                              </div>
                            ))}
                            {selectedFeedingLogs.length > 3 && (
                              <div className="text-xs text-gray-500">
                                还有 {selectedFeedingLogs.length - 3} 条...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-2 text-sm">未投料</div>
                  )}
                </div>

                {selectedRecipe && (
                  <>
                    <h4 className="text-sm font-medium text-gray-400 mb-2 mt-3">
                      📖 配方：{selectedRecipe.name}
                    </h4>
                    <div className="bg-brew-lighter rounded p-3">
                      <div className="space-y-1 text-xs">
                        {selectedRecipe.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{ing.name}</span>
                            <span>
                              {ing.amount} {ing.unit}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-brew-border pt-1 mt-1 text-gray-400">
                          目标容量: {selectedRecipe.targetVolume}L · 发酵周期: {selectedRecipe.fermentationDays}天
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="px-4 py-3 border-b border-brew-border font-medium">
          📦 包装记录汇总
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brew-lighter">
                <th className="table-cell text-left">包装时间</th>
                <th className="table-cell text-left">批次号</th>
                <th className="table-cell text-left">包装类型</th>
                <th className="table-cell text-left">数量</th>
                <th className="table-cell text-left">操作人</th>
                <th className="table-cell text-left">质检状态</th>
              </tr>
            </thead>
            <tbody>
              {packagingRecords
                .slice()
                .reverse()
                .slice(0, 20)
                .map((record) => {
                  const batch = batches.find((b) => b.id === record.batchId)
                  return (
                    <tr key={record.id} className="hover:bg-brew-lighter/50">
                      <td className="table-cell text-xs text-gray-400">
                        {new Date(record.packagingTime).toLocaleString('zh-CN')}
                      </td>
                      <td className="table-cell font-mono">{batch?.batchNumber || '-'}</td>
                      <td className="table-cell">{record.packagingType}</td>
                      <td className="table-cell">{record.quantity}</td>
                      <td className="table-cell">{record.operator}</td>
                      <td className="table-cell">
                        <span
                          className={`status-badge ${
                            record.qualityStatus === 'pass'
                              ? 'bg-green-600'
                              : record.qualityStatus === 'fail'
                              ? 'bg-red-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {record.qualityStatus === 'pass'
                            ? '通过'
                            : record.qualityStatus === 'fail'
                            ? '不合格'
                            : '待检'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

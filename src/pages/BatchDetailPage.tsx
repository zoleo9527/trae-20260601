import { useParams, useNavigate } from 'react-router-dom'
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

function PipelineBar({ current }: { current: BatchStatus }) {
  const isAbnormal = current === 'ABNORMAL'
  const activeIdx = isAbnormal
    ? PIPELINE_ORDER.indexOf('FERMENTING')
    : PIPELINE_ORDER.indexOf(current)

  return (
    <div className="card p-4">
      <div className="flex items-center gap-1">
        {PIPELINE_ORDER.map((status, idx) => {
          const reached = idx <= activeIdx && !isAbnormal
          const isCurrent = status === current && !isAbnormal
          return (
            <div key={status} className="flex-1 flex items-center">
              <div
                className={`flex-1 py-2 px-1 text-center text-xs rounded transition-colors ${
                  isCurrent
                    ? `${BATCH_STATUS_COLORS[status]} text-white font-bold ring-2 ring-amber-400`
                    : reached
                    ? `${BATCH_STATUS_COLORS[status]} text-white/80`
                    : 'bg-brew-lighter text-gray-500'
                }`}
              >
                {BATCH_STATUS_LABELS[status]}
              </div>
              {idx < PIPELINE_ORDER.length - 1 && (
                <div
                  className={`w-4 h-0.5 ${
                    reached && idx < activeIdx ? 'bg-amber-500' : 'bg-brew-border'
                  }`}
                />
              )}
            </div>
          )
        })}
        {isAbnormal && (
          <>
            <div className="w-4 h-0.5 bg-red-500" />
            <div className="py-2 px-3 text-center text-xs rounded bg-red-600 text-white font-bold ring-2 ring-red-400 animate-pulse">
              {BATCH_STATUS_LABELS['ABNORMAL']}
            </div>
          </>
        )}
      </div>
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

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    batches,
    batchStateLogs,
    feedings,
    feedingChangeLogs,
    recipes,
    alerts,
    packagingRecords,
  } = useBreweryStore()

  const batch = batches.find((b) => b.id === id)
  const recipe = recipes.find((r) => r.id === batch?.recipeId)
  const feeding = feedings.find((f) => f.batchId === id)
  const feedingLogs = feeding
    ? feedingChangeLogs.filter((l) => l.feedingId === feeding.id)
    : []
  const batchAlerts = alerts
    .filter((a) => a.batchId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const batchPackaging = packagingRecords
    .filter((p) => p.batchId === id)
    .sort((a, b) => new Date(b.packagingTime).getTime() - new Date(a.packagingTime).getTime())
  const batchLogs = batchStateLogs
    .filter((l) => l.batchId === id)
    .sort((a, b) => new Date(b.changeTime).getTime() - new Date(a.changeTime).getTime())

  if (!batch) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">批次不存在</p>
        <button onClick={() => navigate('/batches')} className="btn-primary mt-4">
          返回批次列表
        </button>
      </div>
    )
  }

  const totalPackaged = batchPackaging
    .filter((p) => p.qualityStatus === 'pass')
    .reduce((sum, p) => sum + p.quantity, 0)
  const hasPackagingFail = batchPackaging.some((p) => p.qualityStatus === 'fail')
  const pendingAlertCount = batchAlerts.filter((a) => a.status === 'pending').length

  const allEvents: TimelineEvent[] = [
    ...batchLogs.map((log) => ({
      id: log.id,
      time: log.changeTime,
      type: 'status' as const,
      icon: '🔄',
      title: `${BATCH_STATUS_LABELS[log.fromStatus]} → ${BATCH_STATUS_LABELS[log.toStatus]}`,
      detail: log.reason,
      extra: `${log.operator}（${USER_ROLE_LABELS[log.operatorRole]}）`,
      color: BATCH_STATUS_COLORS[log.toStatus],
    })),
    ...feedingLogs.map((log) => ({
      id: log.id,
      time: log.changeTime,
      type: 'feeding_change' as const,
      icon: '✏️',
      title: `投料修改：${log.fieldName === 'ingredients' ? '原料明细' : log.fieldName}`,
      detail: `${log.oldValue} → ${log.newValue}`,
      extra: `${log.operator}（${USER_ROLE_LABELS[log.operatorRole]}）${log.reason ? `，原因：${log.reason}` : ''}`,
      color: 'bg-amber-600',
    })),
    ...batchAlerts.map((alert) => ({
      id: alert.id,
      time: alert.createdAt,
      type: 'alert' as const,
      icon: alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '🟡' : '🔵',
      title: alert.message,
      detail: alert.status === 'pending' ? '待处理' : alert.status === 'resolved' ? '已解决' : '已退回',
      extra: alert.resolution
        ? `处理：${alert.resolution}${alert.handler ? `（${alert.handler}）` : ''}`
        : undefined,
      color: ALERT_LEVEL_COLORS[alert.level],
    })),
    ...batchPackaging.map((pkg) => ({
      id: pkg.id,
      time: pkg.packagingTime,
      type: 'packaging' as const,
      icon: '📦',
      title: `包装：${pkg.packagingType} × ${pkg.quantity}`,
      detail: `质检：${pkg.qualityStatus === 'pass' ? '✅ 通过' : pkg.qualityStatus === 'fail' ? '❌ 不合格' : '⏳ 待检'}${pkg.notes ? `，${pkg.notes}` : ''}`,
      extra: pkg.operator,
      color: pkg.qualityStatus === 'pass' ? 'bg-green-600' : pkg.qualityStatus === 'fail' ? 'bg-red-600' : 'bg-gray-600',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/batches')}
            className="text-gray-400 hover:text-gray-200"
          >
            ← 返回
          </button>
          <h2 className="text-xl font-bold">批次追溯: {batch.batchNumber}</h2>
          <span className={`status-badge ${BATCH_STATUS_COLORS[batch.status]}`}>
            {BATCH_STATUS_LABELS[batch.status]}
          </span>
          {pendingAlertCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-red-600 rounded animate-pulse">
              {pendingAlertCount} 条待处理
            </span>
          )}
        </div>
      </div>

      <PipelineBar current={batch.status} />

      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">批次名称</div>
          <div className="font-bold">{batch.name}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">发酵罐</div>
          <div className="font-bold">{batch.tankId}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">配方</div>
          <div className="font-bold">{recipe?.name || '-'}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">容量</div>
          <div className="font-bold">{batch.volume} L</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">温度</div>
          <div
            className={`font-bold ${
              Math.abs(batch.temperature - batch.targetTemperature) > 2 ? 'text-red-400' : ''
            }`}
          >
            {batch.temperature}°C
            <span className="text-gray-500 text-sm ml-1">/ {batch.targetTemperature}°C</span>
          </div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">比重 OG / 当前</div>
          <div className="font-bold">
            {batch.originalGravity > 0 ? batch.originalGravity.toFixed(3) : '-'}
            <span className="text-gray-500 text-sm mx-1">/</span>
            {batch.gravity > 0 ? batch.gravity.toFixed(3) : '-'}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">投料 / 变更</div>
          <div className="font-bold">
            {feeding ? (
              <span className="flex items-center gap-1">
                <span
                  className={`status-badge text-xs ${
                    feeding.status === 'modified'
                      ? 'bg-amber-600'
                      : feeding.status === 'confirmed'
                      ? 'bg-green-600'
                      : 'bg-gray-600'
                  }`}
                >
                  {feeding.status === 'modified' ? '已修改' : feeding.status === 'confirmed' ? '已确认' : '草稿'}
                </span>
                {feedingLogs.length > 0 && (
                  <span className="text-amber-400 text-xs">({feedingLogs.length}次变更)</span>
                )}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">未投料</span>
            )}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-400 mb-1">包装 / 异常</div>
          <div className="font-bold text-sm">
            {totalPackaged > 0 && <span className="text-green-400">{totalPackaged}件</span>}
            {hasPackagingFail && <span className="text-red-400 ml-2">有不合格</span>}
            {pendingAlertCount > 0 && (
              <span className="text-red-400 ml-2">{pendingAlertCount}异常</span>
            )}
            {totalPackaged === 0 && !hasPackagingFail && pendingAlertCount === 0 && (
              <span className="text-gray-500">-</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium">
              完整追溯时间线 ({allEvents.length})
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {allEvents.length > 0 ? (
                <div className="relative">
                  {allEvents.map((event, index) => (
                    <div key={event.id} className="flex gap-3 mb-4 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${event.color} shrink-0`} />
                        {index < allEvents.length - 1 && (
                          <div className="w-0.5 flex-1 bg-brew-border my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-2 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm">{event.icon}</span>
                          <span className="text-sm font-medium">{event.title}</span>
                        </div>
                        <div className="text-sm text-gray-300 break-words">{event.detail}</div>
                        {event.extra && (
                          <div className="text-xs text-gray-500 mt-0.5">{event.extra}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(event.time).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">暂无记录</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium">
              🍺 投料记录
            </div>
            <div className="p-4">
              {feeding ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">投料时间</span>
                      <div>{new Date(feeding.feedingTime).toLocaleString('zh-CN')}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">酿酒师</span>
                      <div>{feeding.brewerName}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">总重量</span>
                      <div>{feeding.totalWeight.toFixed(3)} kg</div>
                    </div>
                    <div>
                      <span className="text-gray-400">状态</span>
                      <div>
                        <span
                          className={`status-badge text-xs ${
                            feeding.status === 'modified'
                              ? 'bg-amber-600'
                              : feeding.status === 'confirmed'
                              ? 'bg-green-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {feeding.status === 'modified' ? '已修改' : feeding.status === 'confirmed' ? '已确认' : '草稿'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-brew-border pt-3">
                    <div className="text-sm text-gray-400 mb-2">原料明细</div>
                    <div className="space-y-1 text-sm">
                      {feeding.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{ing.name}</span>
                          <span className="flex items-center gap-2">
                            {ing.amount} {ing.unit}
                            {ing.deviation && Math.abs(ing.deviation) >= 5 && (
                              <span
                                className={`text-xs ${
                                  Math.abs(ing.deviation) >= 10 ? 'text-red-400' : 'text-amber-400'
                                }`}
                              >
                                ({ing.deviation > 0 ? '+' : ''}
                                {ing.deviation.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {feedingLogs.length > 0 && (
                    <div className="border-t border-brew-border pt-3">
                      <div className="text-sm text-gray-400 mb-2">
                        投料变更记录 ({feedingLogs.length})
                      </div>
                      <div className="space-y-2">
                        {feedingLogs.map((log) => (
                          <div key={log.id} className="bg-brew-lighter p-2 rounded text-xs">
                            <div className="flex justify-between text-gray-500 mb-1">
                              <span>{log.operator}（{USER_ROLE_LABELS[log.operatorRole]}）</span>
                              <span>{new Date(log.changeTime).toLocaleString('zh-CN')}</span>
                            </div>
                            <div className="text-amber-300 font-medium mb-1">
                              {log.fieldName === 'ingredients' ? '原料明细' : log.fieldName}
                            </div>
                            <div className="text-red-400">旧: {log.oldValue}</div>
                            <div className="text-green-400">新: {log.newValue}</div>
                            {log.reason && (
                              <div className="text-amber-400 mt-1">原因: {log.reason}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {feeding.notes && (
                    <div className="border-t border-brew-border pt-3">
                      <div className="text-sm text-gray-400 mb-1">备注</div>
                      <div className="text-sm">{feeding.notes}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">暂无投料记录</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium">
              📦 包装记录 ({batchPackaging.length})
            </div>
            <div className="p-4">
              {batchPackaging.length > 0 ? (
                <div className="space-y-2">
                  {batchPackaging.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-3 rounded border ${
                        pkg.qualityStatus === 'fail'
                          ? 'bg-red-900/20 border-red-800'
                          : pkg.qualityStatus === 'pass'
                          ? 'bg-green-900/10 border-green-900'
                          : 'bg-brew-lighter border-brew-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {pkg.packagingType} × {pkg.quantity}
                        </span>
                        <span
                          className={`status-badge text-xs ${
                            pkg.qualityStatus === 'pass'
                              ? 'bg-green-600'
                              : pkg.qualityStatus === 'fail'
                              ? 'bg-red-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {pkg.qualityStatus === 'pass' ? '✅ 通过' : pkg.qualityStatus === 'fail' ? '❌ 不合格' : '⏳ 待检'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pkg.packagingTime).toLocaleString('zh-CN')} · {pkg.operator}
                      </div>
                      {pkg.notes && (
                        <div className="text-xs text-gray-400 mt-1">{pkg.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">暂无包装记录</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium">
              ⚠️ 异常提醒 ({batchAlerts.length})
            </div>
            <div className="p-4">
              {batchAlerts.length > 0 ? (
                <div className="space-y-2">
                  {batchAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded border ${
                        alert.status === 'pending'
                          ? 'bg-red-900/20 border-red-800'
                          : alert.status === 'resolved'
                          ? 'bg-green-900/20 border-green-800'
                          : 'bg-gray-800/20 border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`status-badge ${ALERT_LEVEL_COLORS[alert.level]} text-xs`}>
                            {alert.level === 'critical' ? '严重' : alert.level === 'warning' ? '警告' : '提示'}
                          </span>
                          <span className="text-sm">{alert.message}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                            alert.status === 'pending'
                              ? 'bg-red-700'
                              : alert.status === 'resolved'
                              ? 'bg-green-700'
                              : 'bg-gray-600'
                          }`}
                        >
                          {alert.status === 'pending' ? '待处理' : alert.status === 'resolved' ? '已解决' : '已退回'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString('zh-CN')}
                        {alert.handler && ` · 处理人: ${alert.handler}`}
                      </div>
                      {alert.resolution && (
                        <div className="text-sm text-gray-300 mt-2 border-t border-brew-border pt-2">
                          处理结果: {alert.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">暂无异常记录</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {batch.notes && (
        <div className="card p-4">
          <h3 className="font-bold mb-2 text-amber-400">📝 批次备注</h3>
          <div className="text-gray-300">{batch.notes}</div>
        </div>
      )}
    </div>
  )
}

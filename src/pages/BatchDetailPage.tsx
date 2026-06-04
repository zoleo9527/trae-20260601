import { useParams, useNavigate } from 'react-router-dom'
import { useBreweryStore } from '../store/useBreweryStore'
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
  ALERT_LEVEL_COLORS,
  USER_ROLE_LABELS,
} from '../types'

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { batches, batchStateLogs, feedings, feedingChangeLogs, recipes, alerts } =
    useBreweryStore()

  const batch = batches.find((b) => b.id === id)
  const recipe = recipes.find((r) => r.id === batch?.recipeId)
  const batchLogs = batchStateLogs.filter((l) => l.batchId === id).sort(
    (a, b) => new Date(b.changeTime).getTime() - new Date(a.changeTime).getTime()
  )
  const feeding = feedings.find((f) => f.batchId === id)
  const feedingLogs = feedingChangeLogs.filter((l) => l.feedingId === feeding?.id)
  const batchAlerts = alerts.filter((a) => a.batchId === id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

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
          <h2 className="text-xl font-bold">批次详情: {batch.batchNumber}</h2>
          <span className={`status-badge ${BATCH_STATUS_COLORS[batch.status]}`}>
            {BATCH_STATUS_LABELS[batch.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">批次名称</div>
          <div className="font-bold">{batch.name}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">发酵罐</div>
          <div className="font-bold">{batch.tankId}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">配方</div>
          <div className="font-bold">{recipe?.name || '-'}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">容量</div>
          <div className="font-bold">{batch.volume} L</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">当前温度</div>
          <div
            className={`font-bold ${
              Math.abs(batch.temperature - batch.targetTemperature) > 2 ? 'text-red-400' : ''
            }`}
          >
            {batch.temperature}°C
            <span className="text-gray-500 text-sm ml-1">/ {batch.targetTemperature}°C</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">当前比重</div>
          <div className="font-bold">
            {batch.gravity > 0 ? batch.gravity.toFixed(3) : '-'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">原比重</div>
          <div className="font-bold">
            {batch.originalGravity > 0 ? batch.originalGravity.toFixed(3) : '-'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">开始时间</div>
          <div className="font-bold text-sm">
            {new Date(batch.startTime).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-bold mb-3 text-amber-400">📊 状态流转时间线</h3>
          <div className="relative">
            {batchLogs.map((log, index) => (
              <div key={log.id} className="flex gap-3 mb-4 last:mb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${BATCH_STATUS_COLORS[log.toStatus]}`}
                  ></div>
                  {index < batchLogs.length - 1 && (
                    <div className="w-0.5 h-full bg-brew-border my-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`status-badge ${BATCH_STATUS_COLORS[log.toStatus]} text-xs`}>
                      {BATCH_STATUS_LABELS[log.toStatus]}
                    </span>
                    <span className="text-xs text-gray-500">
                      ← {BATCH_STATUS_LABELS[log.fromStatus]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">{log.reason}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {log.operator} ({USER_ROLE_LABELS[log.operatorRole]}) ·{' '}
                    {new Date(log.changeTime).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-bold mb-3 text-amber-400">🍺 投料记录</h3>
          {feeding ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">投料时间</span>
                <span>{new Date(feeding.feedingTime).toLocaleString('zh-CN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">酿酒师</span>
                <span>{feeding.brewerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">总重量</span>
                <span>{feeding.totalWeight.toFixed(3)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">状态</span>
                <span
                  className={`status-badge ${
                    feeding.status === 'modified'
                      ? 'bg-amber-600'
                      : feeding.status === 'confirmed'
                      ? 'bg-green-600'
                      : 'bg-gray-600'
                  }`}
                >
                  {feeding.status === 'modified'
                    ? '已修改'
                    : feeding.status === 'confirmed'
                    ? '已确认'
                    : '草稿'}
                </span>
              </div>

              <div className="border-t border-brew-border pt-3 mt-2">
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
                              Math.abs(ing.deviation) >= 10
                                ? 'text-red-400'
                                : 'text-amber-400'
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
                <div className="border-t border-brew-border pt-3 mt-2">
                  <div className="text-sm text-gray-400 mb-2">
                    投料变更记录 ({feedingLogs.length})
                  </div>
                  <div className="space-y-2">
                    {feedingLogs.map((log) => (
                      <div key={log.id} className="bg-brew-lighter p-2 rounded text-xs">
                        <div className="flex justify-between text-gray-500 mb-1">
                          <span>
                            {log.operator} ({USER_ROLE_LABELS[log.operatorRole]})
                          </span>
                          <span>{new Date(log.changeTime).toLocaleString('zh-CN')}</span>
                        </div>
                        <div className="text-red-400">旧: {log.oldValue}</div>
                        <div className="text-green-400">新: {log.newValue}</div>
                        {log.reason && <div className="text-amber-400">原因: {log.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feeding.notes && (
                <div className="border-t border-brew-border pt-3 mt-2">
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

      <div className="card p-4">
        <h3 className="font-bold mb-3 text-amber-400">⚠️ 异常提醒记录</h3>
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
                    <span className={`status-badge ${ALERT_LEVEL_COLORS[alert.level]}`}>
                      {alert.level === 'critical' ? '严重' : alert.level === 'warning' ? '警告' : '提示'}
                    </span>
                    <span className="font-medium">{alert.message}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      alert.status === 'pending'
                        ? 'bg-red-700'
                        : alert.status === 'resolved'
                        ? 'bg-green-700'
                        : 'bg-gray-600'
                    }`}
                  >
                    {alert.status === 'pending'
                      ? '待处理'
                      : alert.status === 'resolved'
                      ? '已解决'
                      : '已退回'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
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

      {batch.notes && (
        <div className="card p-4">
          <h3 className="font-bold mb-2 text-amber-400">📝 批次备注</h3>
          <div className="text-gray-300">{batch.notes}</div>
        </div>
      )}
    </div>
  )
}

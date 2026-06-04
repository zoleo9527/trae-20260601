import { useNavigate } from 'react-router-dom'
import { useBreweryStore } from '../store/useBreweryStore'
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
  ALERT_LEVEL_COLORS,
  USER_ROLE_LABELS,
} from '../types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const {
    batches,
    feedings,
    alerts,
    packagingRecords,
    recipes,
    currentRole,
    currentUser,
    batchStateLogs,
    createAlert,
    updateBatch,
  } = useBreweryStore()

  const pendingBatches = batches.filter((b) => b.status === 'PENDING')
  const fermentingBatches = batches.filter((b) => b.status === 'FERMENTING')
  const conditioningBatches = batches.filter((b) => b.status === 'CONDITIONING')
  const readyBatches = batches.filter((b) => b.status === 'READY')
  const abnormalBatches = batches.filter((b) => b.status === 'ABNORMAL')
  const packagedBatches = batches.filter((b) => b.status === 'PACKAGED')

  const pendingAlerts = alerts.filter((a) => a.status === 'pending')

  const recentLogs = [...batchStateLogs]
    .sort((a, b) => new Date(b.changeTime).getTime() - new Date(a.changeTime).getTime())
    .slice(0, 8)

  const recentFeedings = [...feedings]
    .sort((a, b) => new Date(b.feedingTime).getTime() - new Date(a.feedingTime).getTime())
    .slice(0, 5)

  const brewerTasks = [
    { count: pendingBatches.length, label: '待投料批次', action: '去投料', path: '/feeding' },
    { count: fermentingBatches.length, label: '发酵中批次', action: '查看', path: '/batches' },
    { count: abnormalBatches.length, label: '异常批次', action: '处理', path: '/system' },
  ]

  const packagerTasks = [
    { count: readyBatches.length, label: '待包装批次', action: '去包装', path: '/packaging' },
    { count: conditioningBatches.length, label: '后熟中批次', action: '查看', path: '/batches' },
    { count: abnormalBatches.length, label: '质检不合格', action: '处理', path: '/packaging' },
  ]

  const salesTasks = [
    { count: packagedBatches.length, label: '已包装可售', action: '查看库存', path: '/sales' },
    { count: readyBatches.length + conditioningBatches.length, label: '即将就绪', action: '追踪', path: '/batches' },
  ]

  const getRoleTasks = () => {
    switch (currentRole) {
      case 'brewer':
        return brewerTasks
      case 'packager':
        return packagerTasks
      case 'sales':
        return salesTasks
      default:
        return [
          { count: pendingBatches.length, label: '待投料', action: '投料', path: '/feeding' },
          { count: fermentingBatches.length, label: '发酵中', action: '查看', path: '/batches' },
          { count: readyBatches.length, label: '待包装', action: '包装', path: '/packaging' },
          { count: pendingAlerts.length, label: '待处理异常', action: '处理', path: '/system' },
        ]
    }
  }

  const tasks = getRoleTasks()

  const triggerTempAlert = () => {
    const fermenting = fermentingBatches[0]
    if (fermenting) {
      updateBatch(fermenting.id, { temperature: fermenting.targetTemperature + 5 })
      createAlert({
        batchId: fermenting.id,
        type: 'temp_abnormal',
        level: 'critical',
        message: `温度异常：当前${fermenting.targetTemperature + 5}°C，目标${fermenting.targetTemperature}°C`,
      })
      alert('已触发温度异常样例')
    } else {
      alert('没有发酵中的批次可用于测试')
    }
  }

  const triggerPackagingFail = () => {
    const ready = readyBatches[0]
    if (ready) {
      createAlert({
        batchId: ready.id,
        type: 'quality_issue',
        level: 'critical',
        message: '包装质检不合格模拟：酒体浑浊，需重新过滤',
      })
      updateBatch(ready.id, { status: 'ABNORMAL', notes: '包装质检不合格：酒体浑浊，需重新过滤' })
      alert('已触发包装质检不合格样例')
    } else {
      alert('没有待包装批次可用于测试')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">🏠 工作台</h2>
          <p className="text-sm text-gray-400 mt-1">
            欢迎，{currentUser}（{USER_ROLE_LABELS[currentRole]}）
          </p>
        </div>
        {currentRole === 'admin' && (
          <div className="flex gap-2">
            <button onClick={triggerTempAlert} className="btn-secondary text-xs">
              🧪 模拟温度异常
            </button>
            <button onClick={triggerPackagingFail} className="btn-secondary text-xs">
              🧪 模拟质检不合格
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {tasks.map((task, idx) => (
          <div
            key={idx}
            onClick={() => navigate(task.path)}
            className="card p-4 cursor-pointer hover:border-amber-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-amber-400">{task.count}</div>
              <button className="text-xs text-amber-400 hover:text-amber-300">
                {task.action} →
              </button>
            </div>
            <div className="text-sm text-gray-400">{task.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium flex items-center justify-between">
              <span>📊 批次状态总览</span>
              <span className="text-xs text-gray-400">共 {batches.length} 批次</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {(['PENDING', 'FEEDING', 'FERMENTING', 'CONDITIONING', 'READY', 'PACKAGED', 'ABNORMAL'] as const).map(
                  (status) => {
                    const count = batches.filter((b) => b.status === status).length
                    return (
                      <div
                        key={status}
                        onClick={() => navigate('/batches')}
                        className="bg-brew-lighter p-3 rounded text-center cursor-pointer hover:bg-brew-border transition-colors"
                      >
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className={`w-2 h-2 rounded ${BATCH_STATUS_COLORS[status]}`}></span>
                          <span className="text-xs text-gray-400">{BATCH_STATUS_LABELS[status]}</span>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium">
              🕒 最近状态变更
            </div>
            <div className="divide-y divide-brew-border">
              {recentLogs.map((log) => {
                const batch = batches.find((b) => b.id === log.batchId)
                return (
                  <div
                    key={log.id}
                    onClick={() => navigate(`/batches/${log.batchId}`)}
                    className="px-4 py-3 hover:bg-brew-lighter cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`status-badge ${BATCH_STATUS_COLORS[log.toStatus]} text-xs`}>
                        {BATCH_STATUS_LABELS[log.toStatus]}
                      </span>
                      <div>
                        <div className="text-sm">
                          <span className="font-mono text-amber-400">{batch?.batchNumber}</span>
                          <span className="text-gray-400 mx-2">←</span>
                          <span className="text-gray-400">{BATCH_STATUS_LABELS[log.fromStatus]}</span>
                        </div>
                        <div className="text-xs text-gray-500">{log.reason}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{log.operator}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.changeTime).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                )
              })}
              {recentLogs.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">暂无状态变更记录</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {pendingAlerts.length > 0 && (
            <div className="card border-red-800">
              <div className="px-4 py-3 border-b border-brew-border font-medium text-red-400 flex items-center justify-between">
                <span>⚠️ 待处理异常 ({pendingAlerts.length})</span>
                <button
                  onClick={() => navigate('/system')}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  全部处理 →
                </button>
              </div>
              <div className="divide-y divide-brew-border max-h-64 overflow-y-auto">
                {pendingAlerts.slice(0, 5).map((alert) => {
                  const batch = batches.find((b) => b.id === alert.batchId)
                  return (
                    <div
                      key={alert.id}
                      className="px-4 py-3 hover:bg-red-900/10 cursor-pointer"
                      onClick={() => navigate(`/batches/${alert.batchId}`)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`status-badge ${ALERT_LEVEL_COLORS[alert.level]} text-xs`}>
                          {alert.level === 'critical' ? '严重' : alert.level === 'warning' ? '警告' : '提示'}
                        </span>
                        {batch && (
                          <span className="text-xs font-mono text-amber-400">{batch.batchNumber}</span>
                        )}
                      </div>
                      <div className="text-sm">{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium">
              🍺 最近投料记录
            </div>
            <div className="divide-y divide-brew-border">
              {recentFeedings.map((feeding) => {
                const batch = batches.find((b) => b.id === feeding.batchId)
                const recipe = recipes.find((r) => r.id === feeding.recipeId)
                return (
                  <div
                    key={feeding.id}
                    onClick={() => navigate(`/batches/${feeding.batchId}`)}
                    className="px-4 py-3 hover:bg-brew-lighter cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-amber-400 text-sm">{batch?.batchNumber}</span>
                      <span
                        className={`status-badge text-xs ${
                          feeding.status === 'modified'
                            ? 'bg-amber-600'
                            : feeding.status === 'confirmed'
                            ? 'bg-green-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        {feeding.status === 'modified' ? '已修改' : '已确认'}
                      </span>
                    </div>
                    <div className="text-sm">{recipe?.name}</div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{feeding.brewerName}</span>
                      <span>{feeding.totalWeight.toFixed(2)} kg</span>
                    </div>
                  </div>
                )
              })}
              {recentFeedings.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">暂无投料记录</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-3 border-b border-brew-border font-medium">
              📦 最近包装记录
            </div>
            <div className="divide-y divide-brew-border">
              {[...packagingRecords]
                .sort((a, b) => new Date(b.packagingTime).getTime() - new Date(a.packagingTime).getTime())
                .slice(0, 5)
                .map((record) => {
                  const batch = batches.find((b) => b.id === record.batchId)
                  return (
                    <div
                      key={record.id}
                      onClick={() => navigate(`/batches/${record.batchId}`)}
                      className="px-4 py-3 hover:bg-brew-lighter cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-amber-400 text-sm">{batch?.batchNumber}</span>
                        <span
                          className={`status-badge text-xs ${
                            record.qualityStatus === 'pass'
                              ? 'bg-green-600'
                              : record.qualityStatus === 'fail'
                              ? 'bg-red-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {record.qualityStatus === 'pass'
                            ? '质检通过'
                            : record.qualityStatus === 'fail'
                            ? '不合格'
                            : '待检'}
                        </span>
                      </div>
                      <div className="text-sm">
                        {record.packagingType} × {record.quantity}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(record.packagingTime).toLocaleDateString('zh-CN')} · {record.operator}
                      </div>
                    </div>
                  )
                })}
              {packagingRecords.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">暂无包装记录</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import { useBreweryStore } from '../store/useBreweryStore'
import { ALERT_LEVEL_COLORS, USER_ROLE_LABELS } from '../types'

type TabType = 'alerts' | 'backup' | 'data' | 'test'

export default function SystemPage() {
  const {
    alerts,
    currentUser,
    currentRole,
    resolveAlert,
    rejectAlert,
    exportData,
    importData,
    createBackup,
    restoreBackup,
    deleteBackup,
    resetToMockData,
    batches,
    feedings,
    recipes,
    packagingRecords,
    createAlert,
    updateBatch,
    updateBatchStatus,
  } = useBreweryStore()

  const [activeTab, setActiveTab] = useState<TabType>('alerts')
  const [backupList, setBackupList] = useState<Array<{ id: string; name: string; createdAt: string; size: number }>>([])
  const [resolution, setResolution] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pendingAlerts = alerts.filter((a) => a.status === 'pending')
  const resolvedAlerts = alerts.filter((a) => a.status !== 'pending')

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brewery-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const success = importData(content)
      if (success) {
        alert('数据导入成功！')
      } else {
        alert('数据导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleCreateBackup = () => {
    const backup = createBackup()
    setBackupList([
      ...backupList,
      { id: backup.id, name: backup.name, createdAt: backup.createdAt, size: backup.size },
    ])
    alert('备份创建成功！')
  }

  const loadBackups = () => {
    const stored = localStorage.getItem('brewery-backups')
    if (stored) {
      const backups = JSON.parse(stored)
      setBackupList(backups.map((b: { id: string; name: string; createdAt: string; size: number }) => ({
        id: b.id,
        name: b.name,
        createdAt: b.createdAt,
        size: b.size,
      })))
    }
  }

  useState(() => {
    loadBackups()
  })

  const handleRestore = (backupId: string) => {
    if (confirm('确定要恢复此备份吗？当前数据将被覆盖。')) {
      const success = restoreBackup(backupId)
      if (success) {
        alert('备份恢复成功！')
      } else {
        alert('备份恢复失败')
      }
    }
  }

  const handleDeleteBackup = (backupId: string) => {
    if (confirm('确定要删除此备份吗？')) {
      deleteBackup(backupId)
      setBackupList(backupList.filter((b) => b.id !== backupId))
    }
  }

  const handleResolve = (alertId: string) => {
    const res = resolution[alertId] || '已处理'
    resolveAlert(alertId, currentUser, res)
    setResolution((prev) => ({ ...prev, [alertId]: '' }))
  }

  const handleReject = (alertId: string) => {
    const res = resolution[alertId] || '退回，无需处理'
    rejectAlert(alertId, currentUser, res)
    setResolution((prev) => ({ ...prev, [alertId]: '' }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">⚙️ 系统中心</h2>
        <div className="text-sm text-gray-400">
          当前角色: <span className="text-amber-400">{USER_ROLE_LABELS[currentRole]}</span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-brew-border">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'alerts'
              ? 'text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          异常提醒
          {pendingAlerts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-600 rounded-full text-xs">
              {pendingAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'backup'
              ? 'text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          备份恢复
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'data'
              ? 'text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          数据统计
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'test'
              ? 'text-amber-400 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🧪 测试工具
        </button>
      </div>

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-bold mb-3 text-red-400">⚠️ 待处理异常</h3>
            {pendingAlerts.length > 0 ? (
              <div className="space-y-3">
                {pendingAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded bg-red-900/20 border border-red-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`status-badge ${ALERT_LEVEL_COLORS[alert.level]}`}>
                          {alert.level === 'critical'
                            ? '严重'
                            : alert.level === 'warning'
                            ? '警告'
                            : '提示'}
                        </span>
                        <span className="font-medium">{alert.message}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      类型: {alert.type} | 关联批次: {alert.batchId || '-'}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        placeholder="处理说明..."
                        value={resolution[alert.id] || ''}
                        onChange={(e) =>
                          setResolution((prev) => ({ ...prev, [alert.id]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="btn-success"
                      >
                        标记解决
                      </button>
                      <button onClick={() => handleReject(alert.id)} className="btn-secondary">
                        退回
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                🎉 暂无待处理异常
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3 text-gray-400">📋 已处理记录</h3>
            {resolvedAlerts.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {resolvedAlerts
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded border ${
                        alert.status === 'resolved'
                          ? 'bg-green-900/20 border-green-800'
                          : 'bg-gray-800/20 border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`status-badge ${ALERT_LEVEL_COLORS[alert.level]}`}>
                            {alert.level === 'critical'
                              ? '严重'
                              : alert.level === 'warning'
                              ? '警告'
                              : '提示'}
                          </span>
                          <span className="text-sm">{alert.message}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            alert.status === 'resolved' ? 'bg-green-700' : 'bg-gray-600'
                          }`}
                        >
                          {alert.status === 'resolved' ? '已解决' : '已退回'}
                        </span>
                      </div>
                      {alert.resolution && (
                        <div className="text-xs text-gray-400 mt-2">
                          {alert.handler} · {alert.resolution}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">暂无处理记录</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-bold mb-4 text-amber-400">💾 数据导出 / 导入</h3>
            <div className="flex gap-4 mb-4">
              <button onClick={handleExport} className="btn-primary">
                导出全部数据
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                导入数据
              </button>
              <button onClick={handleCreateBackup} className="btn-secondary">
                创建本地备份
              </button>
            </div>
            <p className="text-xs text-gray-500">
              导出功能将所有数据保存为 JSON 文件。导入功能将覆盖当前数据。备份保存在浏览器本地存储中。
            </p>
          </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3 text-amber-400">📦 本地备份列表</h3>
            {backupList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brew-lighter">
                      <th className="table-cell text-left">备份名称</th>
                      <th className="table-cell text-left">创建时间</th>
                      <th className="table-cell text-left">大小</th>
                      <th className="table-cell text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupList
                      .slice()
                      .reverse()
                      .map((backup) => (
                        <tr key={backup.id} className="hover:bg-brew-lighter/50">
                          <td className="table-cell">{backup.name}</td>
                          <td className="table-cell text-gray-400">
                            {new Date(backup.createdAt).toLocaleString('zh-CN')}
                          </td>
                          <td className="table-cell">{(backup.size / 1024).toFixed(2)} KB</td>
                          <td className="table-cell">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRestore(backup.id)}
                                className="text-xs text-green-400 hover:text-green-300"
                              >
                                恢复
                              </button>
                              <button
                                onClick={() => handleDeleteBackup(backup.id)}
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无本地备份
                <button
                  onClick={loadBackups}
                  className="block mx-auto mt-2 text-xs text-amber-400 hover:text-amber-300"
                >
                  刷新列表
                </button>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3 text-amber-400">🔄 重置数据</h3>
            <p className="text-sm text-gray-400 mb-3">
              重置为初始模拟数据，用于测试或演示。此操作不可撤销！
            </p>
            <button
              onClick={() => {
                if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
                  resetToMockData()
                  alert('数据已重置')
                }
              }}
              className="btn-danger"
            >
              重置为模拟数据
            </button>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{batches.length}</div>
              <div className="text-sm text-gray-400 mt-1">总批次</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{feedings.length}</div>
              <div className="text-sm text-gray-400 mt-1">投料记录</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{recipes.length}</div>
              <div className="text-sm text-gray-400 mt-1">配方数量</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{packagingRecords.length}</div>
              <div className="text-sm text-gray-400 mt-1">包装记录</div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3 text-amber-400">📊 批次状态分布</h3>
            <div className="grid grid-cols-7 gap-2">
              {['PENDING', 'FEEDING', 'FERMENTING', 'CONDITIONING', 'READY', 'PACKAGED', 'ABNORMAL'].map(
                (status) => {
                  const count = batches.filter((b) => b.status === status).length
                  const labels: Record<string, string> = {
                    PENDING: '待投料',
                    FEEDING: '投料中',
                    FERMENTING: '发酵中',
                    CONDITIONING: '后熟',
                    READY: '待包装',
                    PACKAGED: '已包装',
                    ABNORMAL: '异常',
                  }
                  return (
                    <div key={status} className="bg-brew-lighter p-3 rounded text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs text-gray-400 mt-1">{labels[status]}</div>
                    </div>
                  )
                }
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3 text-amber-400">📋 配方列表</h3>
            <div className="grid grid-cols-3 gap-4">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="bg-brew-lighter p-4 rounded">
                  <div className="font-bold text-amber-400">{recipe.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{recipe.description}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    目标容量: {recipe.targetVolume}L | 发酵周期: {recipe.fermentationDays}天
                  </div>
                  <div className="text-xs mt-2 space-y-1">
                    {recipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="text-gray-400">
                        {ing.name}: {ing.amount} {ing.unit}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="space-y-4">
          <div className="card p-4">
          <h3 className="font-bold mb-4 text-amber-400">🧪 异常样例触发</h3>
          <p className="text-sm text-gray-400 mb-4">
            点击下方按钮可直接触发各种异常场景，用于测试流程是否能正确处理。
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brew-lighter p-4 rounded">
              <div className="font-medium mb-2">🌡️ 温度异常</div>
              <p className="text-xs text-gray-400 mb-3">
                模拟发酵温度超出正常范围</p>
              <button
                onClick={() => {
                  const fermenting = batches.filter(b => b.status === 'FERMENTING')
                  if (fermenting.length > 0) {
                    const batch = fermenting[0]
                    updateBatch(batch.id, { temperature: batch.targetTemperature + 6 })
                    createAlert({
                      batchId: batch.id,
                      type: 'temp_abnormal',
                      level: 'critical',
                      message: `温度异常：当前${batch.targetTemperature + 6}°C，目标${batch.targetTemperature}°C，偏差超过5°C`,
                    })
                    alert('已触发温度异常！')
                  } else {
                    alert('没有发酵中的批次可用于测试')
                  }
                }}
                className="btn-primary w-full text-sm"
              >
                触发温度异常
              </button>
            </div>

            <div className="bg-brew-lighter p-4 rounded">
              <div className="font-medium mb-2">🍺 投料偏差</div>
              <p className="text-xs text-gray-400 mb-3">
                模拟投料量超出配方允许偏差</p>
              <button
                onClick={() => {
                  const feeding = feedings[feedings.length - 1]
                  if (feeding) {
                    createAlert({
                      batchId: feeding.batchId,
                      feedingId: feeding.id,
                      type: 'feeding_deviation',
                      level: 'warning',
                      message: '投料偏差模拟：基础麦芽+12%，西楚酒花-8%',
                    })
                    alert('已触发投料偏差警告！')
                  } else {
                    alert('没有投料记录可用于测试')
                  }
                }}
                className="btn-primary w-full text-sm"
              >
                触发投料偏差
              </button>
            </div>

            <div className="bg-brew-lighter p-4 rounded">
              <div className="font-medium mb-2">📦 包装质检不合格</div>
              <p className="text-xs text-gray-400 mb-3">模拟包装质检发现质量问题</p>
              <button
                onClick={() => {
                  const ready = batches.filter(b => b.status === 'READY' || b.status === 'CONDITIONING')
                  if (ready.length > 0) {
                    const batch = ready[0]
                    updateBatchStatus(batch.id, 'ABNORMAL', '包装质检不合格：酒体浑浊，需重新过滤')
                    createAlert({
                      batchId: batch.id,
                      type: 'quality_issue',
                      level: 'critical',
                      message: '包装质检不合格：酒体浑浊，需重新过滤',
                    })
                    alert('已触发包装质检不合格！')
                  } else {
                    alert('没有待包装批次可用于测试')
                  }
                }}
                className="btn-danger w-full text-sm"
              >
                触发质检不合格
              </button>
            </div>

            <div className="bg-brew-lighter p-4 rounded">
              <div className="font-medium mb-2">📝 投料变更</div>
              <p className="text-xs text-gray-400 mb-3">模拟投料记录被修改</p>
              <button
                onClick={() => {
                  const confirmed = feedings.filter(f => f.status === 'confirmed')
                  if (confirmed.length > 0) {
                    const feeding = confirmed[0]
                    createAlert({
                      batchId: feeding.batchId,
                      feedingId: feeding.id,
                      type: 'feeding_changed',
                      level: 'warning',
                      message: '投料记录已修改：巧克力麦芽用量调整',
                    })
                    alert('已触发投料变更提醒！')
                  } else {
                    alert('没有已确认的投料记录可用于测试')
                  }
                }}
                className="btn-secondary w-full text-sm"
              >
                触发投料变更
              </button>
            </div>
          </div>
        </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3 text-amber-400">📋 流程验证清单</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-2 bg-brew-lighter rounded">
                <span className="text-green-400">✓</span>
                <span>创建批次 → 投料录入 → 自动转入发酵</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-brew-lighter rounded">
                <span className="text-green-400">✓</span>
                <span>投料偏差 → 自动触发异常提醒</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-brew-lighter rounded">
                <span className="text-green-400">✓</span>
                <span>投料修改 → 批次变更记录 + 提醒</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-brew-lighter rounded">
                <span className="text-green-400">✓</span>
                <span>发酵 → 后熟 → 待包装 → 包装完成</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-brew-lighter rounded">
                <span className="text-green-400">✓</span>
                <span>包装质检不合格 → 标记异常 + 可退回处理</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-brew-lighter rounded">
                <span className="text-green-400">✓</span>
                <span>异常处理 → 标记解决或退回</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-brew-lighter rounded">
                <span className="text-green-400">✓</span>
                <span>销售查询 → 批次全链路追溯</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3 text-amber-400">🔄 快捷操作</h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirm('确定要重置所有数据吗？')) {
                    resetToMockData()
                    alert('数据已重置为模拟数据')
                  }
                }}
                className="btn-danger"
              >
                重置为模拟数据
              </button>
              <button
                onClick={() => {
                  const backup = createBackup()
                  alert(`已创建备份：${backup.name}`)
                }}
                className="btn-secondary"
              >
                快速备份
              </button>
              <button
                onClick={handleExport}
                className="btn-secondary"
              >
                导出数据
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

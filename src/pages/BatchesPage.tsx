import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreweryStore } from '../store/useBreweryStore'
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
  BatchStatus,
  ALERT_LEVEL_COLORS,
} from '../types'

export default function BatchesPage() {
  const navigate = useNavigate()
  const { batches, recipes, alerts, feedings, feedingChangeLogs, currentRole, addBatch, updateBatchStatus, createAlert } =
    useBreweryStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    name: '',
    tankId: '',
    recipeId: '',
    targetTemperature: 20,
    volume: 20,
  })
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all')
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)

  const filteredBatches =
    statusFilter === 'all' ? batches : batches.filter((b) => b.status === statusFilter)

  const handleCreateBatch = () => {
    if (!newBatch.batchNumber || !newBatch.name || !newBatch.recipeId) {
      alert('请填写必填信息')
      return
    }

    const recipe = recipes.find((r) => r.id === newBatch.recipeId)

    addBatch({
      batchNumber: newBatch.batchNumber,
      name: newBatch.name,
      status: 'PENDING',
      startTime: new Date().toISOString(),
      tankId: newBatch.tankId || '未分配',
      temperature: newBatch.targetTemperature,
      targetTemperature: newBatch.targetTemperature,
      gravity: 0,
      originalGravity: 0,
      volume: newBatch.volume,
      recipeId: newBatch.recipeId,
      notes: `配方：${recipe?.name || ''}`,
    })

    setShowCreateForm(false)
    setNewBatch({
      batchNumber: '',
      name: '',
      tankId: '',
      recipeId: '',
      targetTemperature: 20,
      volume: 20,
    })
  }

  const handleStatusChange = (batchId: string, newStatus: BatchStatus, reason: string) => {
    updateBatchStatus(batchId, newStatus, reason)
    if (newStatus === 'ABNORMAL') {
      createAlert({
        batchId,
        type: 'status_timeout',
        level: 'critical',
        message: `批次状态标记为异常：${reason}`,
      })
    }
  }

  const getBatchAlerts = (batchId: string) => {
    return alerts.filter((a) => a.batchId === batchId)
  }

  const getRecipe = (recipeId: string) => {
    return recipes.find((r) => r.id === recipeId)
  }

  const getFeedingInfo = (batchId: string) => {
    return feedings.find((f) => f.batchId === batchId)
  }

  const getFeedingChangeCount = (feedingId: string) => {
    return feedingChangeLogs.filter((l) => l.feedingId === feedingId).length
  }

  const generateBatchNumber = () => {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const todayBatches = batches.filter((b) => b.batchNumber.startsWith(`B${dateStr}`)).length
    return `B${dateStr}-${String(todayBatches + 1).padStart(3, '0')}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">📊 发酵批次管理</h2>
        <div className="flex items-center gap-3">
          <select
            className="input w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BatchStatus | 'all')}
          >
            <option value="all">全部状态</option>
            {Object.entries(BATCH_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {currentRole === 'brewer' || currentRole === 'admin' ? (
            <button onClick={() => setShowCreateForm(true)} className="btn-primary">
              + 新建批次
            </button>
          ) : null}
        </div>
      </div>

      {showCreateForm && (
        <div className="card p-4">
          <h3 className="font-bold mb-4 text-amber-400">新建发酵批次</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">批次号 *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={newBatch.batchNumber}
                  onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                  placeholder="B20240601-001"
                />
                <button
                  onClick={() => setNewBatch({ ...newBatch, batchNumber: generateBatchNumber() })}
                  className="btn-secondary"
                  title="自动生成"
                >
                  #
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">批次名称 *</label>
              <input
                type="text"
                className="input"
                value={newBatch.name}
                onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                placeholder="经典IPA-0601"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">发酵罐</label>
              <select
                className="input"
                value={newBatch.tankId}
                onChange={(e) => setNewBatch({ ...newBatch, tankId: e.target.value })}
              >
                <option value="">选择发酵罐</option>
                <option value="TANK-01">TANK-01</option>
                <option value="TANK-02">TANK-02</option>
                <option value="TANK-03">TANK-03</option>
                <option value="TANK-04">TANK-04</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">配方 *</label>
              <select
                className="input"
                value={newBatch.recipeId}
                onChange={(e) => setNewBatch({ ...newBatch, recipeId: e.target.value })}
              >
                <option value="">-- 请选择配方 --</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">目标温度 (°C)</label>
              <input
                type="number"
                className="input"
                value={newBatch.targetTemperature}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, targetTemperature: parseFloat(e.target.value) || 20 })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">批次容量 (L)</label>
              <input
                type="number"
                className="input"
                value={newBatch.volume}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, volume: parseFloat(e.target.value) || 20 })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateBatch} className="btn-primary">
              创建批次
            </button>
            <button onClick={() => setShowCreateForm(false)} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="px-4 py-3 border-b border-brew-border font-medium">
          批次列表 ({filteredBatches.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brew-lighter">
                <th className="table-cell text-left">批次号</th>
                <th className="table-cell text-left">名称</th>
                <th className="table-cell text-left">状态</th>
                <th className="table-cell text-left">配方</th>
                <th className="table-cell text-left">罐号</th>
                <th className="table-cell text-left">投料</th>
                <th className="table-cell text-left">温度</th>
                <th className="table-cell text-left">比重</th>
                <th className="table-cell text-left">容量</th>
                <th className="table-cell text-left">开始时间</th>
                <th className="table-cell text-left">异常</th>
                <th className="table-cell text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches
                .slice()
                .sort((a, b) => b.startTime.localeCompare(a.startTime))
                .map((batch) => {
                  const batchAlerts = getBatchAlerts(batch.id)
                  const pendingAlerts = batchAlerts.filter((a) => a.status === 'pending')
                  const recipe = getRecipe(batch.recipeId)
                  const feeding = getFeedingInfo(batch.id)
                  const feedingChangeCount = feeding ? getFeedingChangeCount(feeding.id) : 0

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-brew-lighter/50 cursor-pointer ${
                        batch.status === 'ABNORMAL' ? 'bg-red-900/20' : ''
                      } ${feeding?.status === 'modified' ? 'bg-amber-900/10' : ''}`}
                      onClick={() => navigate(`/batches/${batch.id}`)}
                    >
                      <td className="table-cell font-mono font-bold">{batch.batchNumber}</td>
                      <td className="table-cell">{batch.name}</td>
                      <td className="table-cell">
                        <span
                          className={`status-badge ${BATCH_STATUS_COLORS[batch.status]}`}
                        >
                          {BATCH_STATUS_LABELS[batch.status]}
                        </span>
                      </td>
                      <td className="table-cell">{recipe?.name || '-'}</td>
                      <td className="table-cell">{batch.tankId}</td>
                      <td className="table-cell">
                        {feeding ? (
                          <div className="flex items-center gap-1">
                            <span
                              className={`status-badge text-xs ${
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
                            {feedingChangeCount > 0 && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/batches/${batch.id}`)
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                              >
                                ({feedingChangeCount}次变更)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">未投料</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span
                          className={
                            Math.abs(batch.temperature - batch.targetTemperature) > 2
                              ? 'text-red-400'
                              : ''
                          }
                        >
                          {batch.temperature}°C
                        </span>
                        <span className="text-gray-500 text-xs ml-1">
                          /{batch.targetTemperature}
                        </span>
                      </td>
                      <td className="table-cell">
                        {batch.gravity > 0 ? batch.gravity.toFixed(3) : '-'}
                      </td>
                      <td className="table-cell">{batch.volume}L</td>
                      <td className="table-cell text-xs text-gray-400">
                        {new Date(batch.startTime).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="table-cell">
                        {pendingAlerts.length > 0 && (
                          <span
                            className={`status-badge ${
                              ALERT_LEVEL_COLORS[
                                pendingAlerts.some((a) => a.level === 'critical')
                                  ? 'critical'
                                  : pendingAlerts.some((a) => a.level === 'warning')
                                  ? 'warning'
                                  : 'info'
                              ]
                            }`}
                          >
                            {pendingAlerts.length}
                          </span>
                        )}
                      </td>
                      <td
                        className="table-cell"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBatch(selectedBatch === batch.id ? null : batch.id)
                        }}
                      >
                        {(currentRole === 'brewer' || currentRole === 'admin') && (
                          <div className="flex flex-col gap-1">
                            {batch.status === 'FERMENTING' && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      batch.id,
                                      'CONDITIONING',
                                      '主发酵完成，转入后熟'
                                    )
                                  }
                                  className="text-xs text-blue-400 hover:text-blue-300 text-left"
                                >
                                  → 后熟
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(batch.id, 'ABNORMAL', '手动标记异常')
                                  }
                                  className="text-xs text-red-400 hover:text-red-300 text-left"
                                >
                                  标记异常
                                </button>
                              </>
                            )}
                            {batch.status === 'CONDITIONING' && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    batch.id,
                                    'READY',
                                    '后熟完成，待包装'
                                  )
                                }
                                className="text-xs text-purple-400 hover:text-purple-300 text-left"
                              >
                                → 待包装
                              </button>
                            )}
                            {batch.status === 'ABNORMAL' && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    batch.id,
                                    'FERMENTING',
                                    '异常已解决，恢复发酵'
                                  )
                                }
                                className="text-xs text-green-400 hover:text-green-300 text-left"
                              >
                                恢复正常
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-bold mb-3 text-sm">状态说明</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(BATCH_STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${BATCH_STATUS_COLORS[status as BatchStatus]}`}></span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

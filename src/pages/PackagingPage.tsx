import { useState } from 'react'
import { useBreweryStore } from '../store/useBreweryStore'
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from '../types'

export default function PackagingPage() {
  const { batches, packagingRecords, recipes, currentUser, currentRole, addPackaging, rejectPackaging } = useBreweryStore()
  const [showForm, setShowForm] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState('')
  const [packagingType, setPackagingType] = useState('330ml瓶装')
  const [quantity, setQuantity] = useState(0)
  const [qualityStatus, setQualityStatus] = useState<'pass' | 'fail' | 'pending'>('pending')
  const [notes, setNotes] = useState('')
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null)

  const readyBatches = batches.filter((b) => b.status === 'READY' || b.status === 'CONDITIONING')
  const abnormalBatches = batches.filter((b) => b.status === 'ABNORMAL' && b.notes?.includes('包装质检不合格'))

  const handleSubmit = () => {
    if (!selectedBatch || quantity <= 0) {
      alert('请填写完整信息')
      return
    }

    addPackaging({
      batchId: selectedBatch,
      packagingType,
      quantity,
      operator: currentUser,
      packagingTime: new Date().toISOString(),
      qualityStatus,
      notes,
    })

    setShowForm(false)
    setSelectedBatch('')
    setQuantity(0)
    setNotes('')
  }

  const getBatchInfo = (batchId: string) => {
    return batches.find((b) => b.id === batchId)
  }

  const getRecipe = (recipeId: string) => {
    return recipes.find((r) => r.id === recipeId)
  }

  const handleReject = (batchId: string) => {
    const reason = rejectReason[batchId] || '未说明原因'
    rejectPackaging(batchId, reason)
    setRejectReason((prev) => ({ ...prev, [batchId]: '' }))
    setShowRejectForm(null)
    alert('批次已退回处理')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">📦 包装管理</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + 新增包装
        </button>
      </div>

      {showForm && (
        <div className="card p-4">
          <h3 className="font-bold mb-4 text-amber-400">包装记录录入</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">选择批次 *</label>
              <select
                className="input"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">-- 请选择批次 --</option>
                {readyBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} - {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">包装类型</label>
              <select
                className="input"
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
              >
                <option value="330ml瓶装">330ml 瓶装</option>
                <option value="500ml瓶装">500ml 瓶装</option>
                <option value="330ml听装">330ml 听装</option>
                <option value="5L桶装">5L 桶装</option>
                <option value="20L桶装">20L 桶装</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">包装数量 *</label>
              <input
                type="number"
                className="input"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="输入数量"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">质检状态</label>
              <select
                className="input"
                value={qualityStatus}
                onChange={(e) => setQualityStatus(e.target.value as 'pass' | 'fail' | 'pending')}
              >
                <option value="pending">待质检</option>
                <option value="pass">通过</option>
                <option value="fail">不合格</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">备注</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="包装备注..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary">
              确认包装
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      {abnormalBatches.length > 0 && (
        <div className="card border-red-800">
          <div className="px-4 py-3 border-b border-brew-border font-medium text-red-400">
            ⚠️ 质检不合格待处理 ({abnormalBatches.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brew-lighter">
                  <th className="table-cell text-left">批次号</th>
                  <th className="table-cell text-left">名称</th>
                  <th className="table-cell text-left">状态</th>
                  <th className="table-cell text-left">配方</th>
                  <th className="table-cell text-left">不合格原因</th>
                  <th className="table-cell text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {abnormalBatches.map((batch) => {
                  const recipe = getRecipe(batch.recipeId)
                  return (
                    <tr key={batch.id} className="bg-red-900/10">
                      <td className="table-cell font-mono font-bold">{batch.batchNumber}</td>
                      <td className="table-cell">{batch.name}</td>
                      <td className="table-cell">
                        <span className={`status-badge ${BATCH_STATUS_COLORS[batch.status]}`}>
                          {BATCH_STATUS_LABELS[batch.status]}
                        </span>
                      </td>
                      <td className="table-cell">{recipe?.name || '-'}</td>
                      <td className="table-cell text-red-400 text-xs">{batch.notes}</td>
                      <td className="table-cell">
                        {(currentRole === 'packager' || currentRole === 'admin') && (
                          <div className="flex flex-col gap-1">
                            {showRejectForm === batch.id ? (
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  className="input py-0.5 text-xs w-40"
                                  placeholder="退回原因..."
                                  value={rejectReason[batch.id] || ''}
                                  onChange={(e) =>
                                    setRejectReason((prev) => ({
                                      ...prev,
                                      [batch.id]: e.target.value,
                                    }))
                                  }
                                />
                                <button
                                  onClick={() => handleReject(batch.id)}
                                  className="text-xs text-amber-400 hover:text-amber-300"
                                >
                                  确认退回
                                </button>
                                <button
                                  onClick={() => setShowRejectForm(null)}
                                  className="text-xs text-gray-400 hover:text-gray-300"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowRejectForm(batch.id)}
                                className="text-xs text-amber-400 hover:text-amber-300 text-left"
                              >
                                → 退回处理
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
      )}

      <div className="card">
        <div className="px-4 py-3 border-b border-brew-border font-medium">
          待包装批次 ({readyBatches.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brew-lighter">
                <th className="table-cell text-left">批次号</th>
                <th className="table-cell text-left">名称</th>
                <th className="table-cell text-left">状态</th>
                <th className="table-cell text-left">配方</th>
                <th className="table-cell text-left">发酵罐</th>
                <th className="table-cell text-left">容量</th>
                <th className="table-cell text-left">开始时间</th>
              </tr>
            </thead>
            <tbody>
              {readyBatches.map((batch) => {
                const recipe = getRecipe(batch.recipeId)
                return (
                  <tr key={batch.id} className="hover:bg-brew-lighter/50">
                    <td className="table-cell font-mono font-bold">{batch.batchNumber}</td>
                    <td className="table-cell">{batch.name}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${BATCH_STATUS_COLORS[batch.status]}`}>
                        {BATCH_STATUS_LABELS[batch.status]}
                      </span>
                    </td>
                    <td className="table-cell">{recipe?.name || '-'}</td>
                    <td className="table-cell">{batch.tankId}</td>
                    <td className="table-cell">{batch.volume}L</td>
                    <td className="table-cell text-xs text-gray-400">
                      {new Date(batch.startTime).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-brew-border font-medium">
          包装历史记录
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brew-lighter">
                <th className="table-cell text-left">时间</th>
                <th className="table-cell text-left">批次号</th>
                <th className="table-cell text-left">包装类型</th>
                <th className="table-cell text-left">数量</th>
                <th className="table-cell text-left">操作人</th>
                <th className="table-cell text-left">质检</th>
                <th className="table-cell text-left">备注</th>
              </tr>
            </thead>
            <tbody>
              {packagingRecords
                .slice()
                .reverse()
                .map((record) => {
                  const batch = getBatchInfo(record.batchId)
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
                      <td className="table-cell text-gray-400">{record.notes || '-'}</td>
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

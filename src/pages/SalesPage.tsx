import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreweryStore } from '../store/useBreweryStore'
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from '../types'

export default function SalesPage() {
  const navigate = useNavigate()
  const { batches, recipes, packagingRecords } = useBreweryStore()
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
    return getPackagingRecords(batchId).reduce((sum, p) => sum + p.quantity, 0)
  }

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
                      <td className="table-cell">{totalPackaged > 0 ? totalPackaged : '-'}</td>
                      <td className="table-cell text-xs text-gray-400">
                        {new Date(batch.startTime).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/batches/${batch.id}`)}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBatch && (
        <div className="card p-4">
          <h3 className="font-bold mb-4 text-amber-400">📋 批次追溯信息</h3>
          {(() => {
            const batch = batches.find((b) => b.id === selectedBatch)
            if (!batch) return null
            const recipe = getRecipe(batch.recipeId)

            return (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-sm text-gray-400">批次基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">批次号</span>
                      <span className="font-mono">{batch.batchNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">名称</span>
                      <span>{batch.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">状态</span>
                      <span className={`status-badge ${BATCH_STATUS_COLORS[batch.status]}`}>
                        {BATCH_STATUS_LABELS[batch.status]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">配方</span>
                      <span>{recipe?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">发酵罐</span>
                      <span>{batch.tankId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">容量</span>
                      <span>{batch.volume}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">开始时间</span>
                      <span>{new Date(batch.startTime).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm text-gray-400">配方原料明细</h4>
                  {recipe ? (
                    <div className="space-y-1 text-sm">
                      {recipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{ing.name}</span>
                          <span>
                            {ing.amount} {ing.unit}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-brew-border pt-2 mt-2 text-xs text-gray-400">
                        目标容量: {recipe.targetVolume}L | 发酵周期: {recipe.fermentationDays}天
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">无配方信息</div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div className="card p-4">
        <h3 className="font-bold mb-3 text-amber-400">📦 包装记录汇总</h3>
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

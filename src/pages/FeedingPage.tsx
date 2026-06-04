import { useState } from 'react'
import { useBreweryStore } from '../store/useBreweryStore'
import { FeedingIngredient, BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from '../types'

export default function FeedingPage() {
  const {
    recipes,
    batches,
    feedings,
    feedingChangeLogs,
    currentUser,
    currentRole,
    addFeeding,
    updateFeeding,
    batches: allBatches,
  } = useBreweryStore()

  const [showForm, setShowForm] = useState(false)
  const [editingFeeding, setEditingFeeding] = useState<string | null>(null)
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState('')
  const [ingredients, setIngredients] = useState<FeedingIngredient[]>([])
  const [notes, setNotes] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [showChangeLog, setShowChangeLog] = useState<string | null>(null)

  const pendingBatches = batches.filter((b) => b.status === 'PENDING' || b.status === 'FEEDING')

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipe(recipeId)
    const recipe = recipes.find((r) => r.id === recipeId)
    if (recipe) {
      setIngredients(
        recipe.ingredients.map((i) => ({
          ...i,
          deviation: 0,
        }))
      )
    }
  }

  const handleIngredientChange = (index: number, field: 'amount' | 'unit', value: string) => {
    setIngredients((prev) => {
      const newIngs = [...prev]
      const recipe = recipes.find((r) => r.id === selectedRecipe)
      const recipeIng = recipe?.ingredients[index]

      if (field === 'amount') {
        const newAmount = parseFloat(value) || 0
        const deviation = recipeIng
          ? ((newAmount - recipeIng.amount) / recipeIng.amount) * 100
          : 0
        newIngs[index] = { ...newIngs[index], amount: newAmount, deviation }
      } else {
        newIngs[index] = { ...newIngs[index], [field]: value }
      }
      return newIngs
    })
  }

  const handleSubmit = () => {
    if (!selectedBatch || !selectedRecipe || ingredients.length === 0) {
      alert('请填写完整信息')
      return
    }

    const totalWeight = ingredients.reduce((sum, ing) => {
      const factor = ing.unit === 'g' || ing.unit === 'ml' ? 0.001 : 1
      return sum + ing.amount * factor
    }, 0)

    if (editingFeeding) {
      updateFeeding(
        editingFeeding,
        { ingredients, notes },
        changeReason || '投料记录调整'
      )
      setEditingFeeding(null)
      setChangeReason('')
    } else {
      addFeeding({
        batchId: selectedBatch,
        recipeId: selectedRecipe,
        brewerId: currentRole,
        brewerName: currentUser,
        feedingTime: new Date().toISOString(),
        ingredients,
        status: 'confirmed',
        notes,
        totalWeight,
      })
    }

    setShowForm(false)
    setSelectedBatch('')
    setSelectedRecipe('')
    setIngredients([])
    setNotes('')
  }

  const handleEdit = (feeding: typeof feedings[0]) => {
    setEditingFeeding(feeding.id)
    setSelectedBatch(feeding.batchId)
    setSelectedRecipe(feeding.recipeId)
    setIngredients([...feeding.ingredients])
    setNotes(feeding.notes)
    setShowForm(true)
  }

  const getBatchInfo = (batchId: string) => {
    return allBatches.find((b) => b.id === batchId)
  }

  const getFeedingChangeLogs = (feedingId: string) => {
    return feedingChangeLogs.filter((log) => log.feedingId === feedingId)
  }

  const hasDeviation = ingredients.some((i) => i.deviation && Math.abs(i.deviation) >= 5)
  const hasCriticalDeviation = ingredients.some(
    (i) => i.deviation && Math.abs(i.deviation) >= 10
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🍺 投料工作台</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + 新增投料
        </button>
      </div>

      {showForm && (
        <div className="card p-4">
          <h3 className="font-bold mb-4 text-amber-400">
            {editingFeeding ? '修改投料记录' : '新增投料记录'}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">选择批次 *</label>
              <select
                className="input"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={!!editingFeeding}
              >
                <option value="">-- 请选择批次 --</option>
                {pendingBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} - {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">选择配方 *</label>
              <select
                className="input"
                value={selectedRecipe}
                onChange={(e) => handleRecipeSelect(e.target.value)}
                disabled={!!editingFeeding}
              >
                <option value="">-- 请选择配方 --</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.targetVolume}L)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRecipe && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">原料明细</label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brew-lighter">
                      <th className="table-cell text-left">原料名称</th>
                      <th className="table-cell text-left">配方用量</th>
                      <th className="table-cell text-left">实际用量</th>
                      <th className="table-cell text-left">单位</th>
                      <th className="table-cell text-left">偏差</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing, index) => {
                      const recipe = recipes.find((r) => r.id === selectedRecipe)
                      const recipeIng = recipe?.ingredients[index]
                      return (
                        <tr key={index} className="hover:bg-brew-lighter/50">
                          <td className="table-cell">{ing.name}</td>
                          <td className="table-cell text-gray-500">
                            {recipeIng?.amount} {recipeIng?.unit}
                          </td>
                          <td className="table-cell w-32">
                            <input
                              type="number"
                              step="0.01"
                              className="input py-1"
                              value={ing.amount}
                              onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                            />
                          </td>
                          <td className="table-cell w-20">
                            <select
                              className="input py-1"
                              value={ing.unit}
                              onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                            </select>
                          </td>
                          <td className="table-cell">
                            <span
                              className={`status-badge ${
                                ing.deviation && Math.abs(ing.deviation) >= 10
                                  ? 'bg-red-600'
                                  : ing.deviation && Math.abs(ing.deviation) >= 5
                                  ? 'bg-amber-600'
                                  : 'bg-green-600'
                              }`}
                            >
                              {ing.deviation ? `${ing.deviation > 0 ? '+' : ''}${ing.deviation.toFixed(1)}%` : '0%'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {hasDeviation && (
                <div
                  className={`mt-3 p-3 rounded text-sm ${
                    hasCriticalDeviation
                      ? 'bg-red-900/30 border border-red-700 text-red-300'
                      : 'bg-amber-900/30 border border-amber-700 text-amber-300'
                  }`}
                >
                  ⚠️ {hasCriticalDeviation ? '严重警告' : '提示'}：部分原料投料偏差超过
                  {hasCriticalDeviation ? '10%' : '5%'}，保存后将触发异常提醒
                </div>
              )}
            </div>
          )}

          {editingFeeding && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">修改原因 *</label>
              <input
                type="text"
                className="input"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="请说明修改原因..."
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">备注</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="投料备注..."
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary">
              {editingFeeding ? '保存修改' : '确认投料'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingFeeding(null)
                setSelectedBatch('')
                setSelectedRecipe('')
                setIngredients([])
                setNotes('')
                setChangeReason('')
              }}
              className="btn-secondary"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="px-4 py-3 border-b border-brew-border font-medium">投料历史记录</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brew-lighter">
                <th className="table-cell text-left">时间</th>
                <th className="table-cell text-left">批次号</th>
                <th className="table-cell text-left">批次状态</th>
                <th className="table-cell text-left">配方</th>
                <th className="table-cell text-left">酿酒师</th>
                <th className="table-cell text-left">总重量</th>
                <th className="table-cell text-left">状态</th>
                <th className="table-cell text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {feedings
                .slice()
                .reverse()
                .map((feeding) => {
                  const batch = getBatchInfo(feeding.batchId)
                  const recipe = recipes.find((r) => r.id === feeding.recipeId)
                  const logs = getFeedingChangeLogs(feeding.id)
                  return (
                    <tr
                      key={feeding.id}
                      className={`hover:bg-brew-lighter/50 ${
                        feeding.status === 'modified' ? 'bg-amber-900/10' : ''
                      }`}
                    >
                      <td className="table-cell text-xs text-gray-400">
                        {new Date(feeding.feedingTime).toLocaleString('zh-CN')}
                      </td>
                      <td className="table-cell font-mono">{batch?.batchNumber || '-'}</td>
                      <td className="table-cell">
                        <span
                          className={`status-badge ${
                            batch ? BATCH_STATUS_COLORS[batch.status] : 'bg-gray-600'
                          }`}
                        >
                          {batch ? BATCH_STATUS_LABELS[batch.status] : '-'}
                        </span>
                      </td>
                      <td className="table-cell">{recipe?.name || '-'}</td>
                      <td className="table-cell">{feeding.brewerName}</td>
                      <td className="table-cell">{feeding.totalWeight.toFixed(3)} kg</td>
                      <td className="table-cell">
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
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(feeding)}
                            className="text-xs text-amber-400 hover:text-amber-300"
                          >
                            修改
                          </button>
                          {logs.length > 0 && (
                            <button
                              onClick={() =>
                                setShowChangeLog(showChangeLog === feeding.id ? null : feeding.id)
                              }
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              变更记录({logs.length})
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {showChangeLog && (
        <div className="card p-4">
          <h3 className="font-bold mb-3">变更记录</h3>
          <div className="space-y-2">
            {getFeedingChangeLogs(showChangeLog).map((log) => (
              <div key={log.id} className="bg-brew-lighter p-3 rounded text-sm">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>
                    {log.operator} ({log.operatorRole === 'brewer' ? '酿酒师' : log.operatorRole})
                  </span>
                  <span>{new Date(log.changeTime).toLocaleString('zh-CN')}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">字段：</span>
                  {log.fieldName}
                </div>
                <div className="text-red-400">旧值：{log.oldValue}</div>
                <div className="text-green-400">新值：{log.newValue}</div>
                {log.reason && (
                  <div className="text-amber-400 mt-1">原因：{log.reason}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

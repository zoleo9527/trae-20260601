import { useState } from 'react'
import {
  Download,
  Upload,
  Save,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { STORES, MEAL_ITEMS_TEMPLATE } from '@/data/mockData'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { useAuthStore } from '@/store/authStore'
import type { MealItem, MealOrder } from '@/types'

interface BatchRow {
  id: string
  storeId: string
  storeName: string
  deliveryDate: string
  items: MealItem[]
  hasError: boolean
  errorMessage?: string
}

export function BatchEntry() {
  const { createOrder } = useMealOrderStore()
  const { currentUser } = useAuthStore()
  const [rows, setRows] = useState<BatchRow[]>([createEmptyRow()])
  const [selectedMeal, setSelectedMeal] = useState(MEAL_ITEMS_TEMPLATE[0].name)

  function createEmptyRow(): BatchRow {
    return {
      id: Math.random().toString(36).substring(2, 11),
      storeId: '',
      storeName: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      items: MEAL_ITEMS_TEMPLATE.map((item) => ({
        ...item,
        id: Math.random().toString(36).substring(2, 11),
      })),
      hasError: false,
    }
  }

  const addRow = () => {
    setRows([...rows, createEmptyRow()])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows(
      rows.map((row) => {
        if (row.id !== id) return row

        const updates: Partial<BatchRow> = { [field]: value }
        if (field === 'storeId') {
          const store = STORES.find((s) => s.id === value)
          updates.storeName = store?.name || ''
        }

        return { ...row, ...updates, hasError: false, errorMessage: undefined }
      })
    )
  }

  const updateItemQuantity = (
    rowId: string,
    itemName: string,
    quantity: number
  ) => {
    setRows(
      rows.map((row) => {
        if (row.id !== rowId) return row
        return {
          ...row,
          items: row.items.map((item) =>
            item.name === itemName ? { ...item, quantity } : item
          ),
          hasError: false,
          errorMessage: undefined,
        }
      })
    )
  }

  const validateRows = (): boolean => {
    let isValid = true

    setRows(
      rows.map((row) => {
        const errors: string[] = []

        if (!row.storeId) {
          errors.push('请选择门店')
        }

        const totalQuantity = row.items.reduce((sum, i) => sum + i.quantity, 0)
        if (totalQuantity === 0) {
          errors.push('请填写至少一个菜品数量')
        }

        if (errors.length > 0) {
          isValid = false
          return {
            ...row,
            hasError: true,
            errorMessage: errors.join('、'),
          }
        }

        return row
      })
    )

    return isValid
  }

  const handleSaveAll = () => {
    if (!validateRows()) {
      return
    }

    const validRows = rows.filter((r) => !r.hasError)
    validRows.forEach((row) => {
      const date = row.deliveryDate.replace(/-/g, '')
      const random = Math.random().toString(36).substring(2, 5).toUpperCase()

      const order: Omit<MealOrder, 'id'> = {
        orderNo: `MO-${date}-${random}`,
        storeId: row.storeId,
        storeName: row.storeName,
        deliveryDate: row.deliveryDate,
        items: row.items.filter((i) => i.quantity > 0),
        status: 'submitted',
        totalQuantity: row.items.reduce((sum, i) => sum + i.quantity, 0),
        statusLogs: [
          {
            id: Math.random().toString(36).substring(2, 11),
            status: 'submitted',
            operator: currentUser!.name,
            operatorRole: currentUser!.role,
            timestamp: new Date().toISOString(),
            remark: '批量录入提交',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser!.name,
      }

      createOrder(order as any)
    })

    setRows([createEmptyRow()])
    alert(`成功创建 ${validRows.length} 张配餐单`)
  }

  const handleCopyDown = (rowIndex: number, itemName: string) => {
    const sourceValue = rows[rowIndex].items.find((i) => i.name === itemName)?.quantity || 0
    if (sourceValue === 0) return

    setRows(
      rows.map((row, idx) => {
        if (idx <= rowIndex) return row
        return {
          ...row,
          items: row.items.map((item) =>
            item.name === itemName ? { ...item, quantity: sourceValue } : item
          ),
        }
      })
    )
  }

  const validRowsCount = rows.filter((r) => !r.hasError).length
  const mealItemsForBatch = MEAL_ITEMS_TEMPLATE.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">批量录入</h2>
          <p className="text-sm text-neutral-500 mt-1">
            快速录入多个门店的配餐数据，适合生产环节快速录入
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            导出模板
          </Button>
          <Button variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            导入Excel
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-neutral-900">配餐数据录入</h3>
            <span className="text-sm text-neutral-500">
              共 {rows.length} 行，{validRowsCount} 行有效
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="input w-40"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
            >
              {MEAL_ITEMS_TEMPLATE.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={addRow}>
              <Plus className="w-4 h-4 mr-1" />
              添加行
            </Button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50">
                  <th className="table-header w-12 text-center">#</th>
                  <th className="table-header w-40">门店</th>
                  <th className="table-header w-32">配送日期</th>
                  {mealItemsForBatch.map((item) => (
                    <th
                      key={item.name}
                      className="table-header text-center cursor-pointer hover:bg-neutral-100"
                      title="双击复制到下方所有行"
                      onDoubleClick={() => {
                        if (rows.length > 0) {
                          handleCopyDown(0, item.name)
                        }
                      }}
                    >
                      {item.name}
                      <div className="text-xs text-neutral-400 font-normal">
                        ({item.unit})
                      </div>
                    </th>
                  ))}
                  <th className="table-header w-20 text-right">合计</th>
                  <th className="table-header w-20 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={
                      row.hasError
                        ? 'bg-danger-50 hover:bg-danger-50'
                        : 'hover:bg-neutral-50'
                    }
                  >
                    <td className="table-cell text-center text-neutral-400">
                      {rowIndex + 1}
                    </td>
                    <td className="table-cell">
                      <select
                        className={
                          row.hasError && !row.storeId
                            ? 'input input-sm border-danger-300 focus:ring-danger-500'
                            : 'input input-sm'
                        }
                        value={row.storeId}
                        onChange={(e) =>
                          updateRow(row.id, 'storeId', e.target.value)
                        }
                      >
                        <option value="">请选择</option>
                        {STORES.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="table-cell">
                      <input
                        type="date"
                        className="input input-sm"
                        value={row.deliveryDate}
                        onChange={(e) =>
                          updateRow(row.id, 'deliveryDate', e.target.value)
                        }
                      />
                    </td>
                    {mealItemsForBatch.map((item) => {
                      const rowItem = row.items.find((i) => i.name === item.name)
                      return (
                        <td key={item.name} className="table-cell">
                          <input
                            type="number"
                            className="input input-sm text-center"
                            value={rowItem?.quantity || 0}
                            min={0}
                            onChange={(e) =>
                              updateItemQuantity(
                                row.id,
                                item.name,
                                parseInt(e.target.value) || 0
                              )
                            }
                            onDoubleClick={() =>
                              handleCopyDown(rowIndex, item.name)
                            }
                            title="双击复制到下方所有行"
                          />
                        </td>
                      )
                    })}
                    <td className="table-cell text-right font-medium">
                      {row.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="table-cell text-center">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1 hover:bg-danger-100 rounded text-neutral-400 hover:text-danger-600 transition-colors"
                        disabled={rows.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.some((r) => r.hasError) && (
            <div className="px-6 py-4 bg-danger-50 border-t border-danger-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-danger-800 mb-1">
                    存在数据错误
                  </p>
                  {rows
                    .filter((r) => r.hasError)
                    .map((row) => (
                      <p
                        key={row.id}
                        className="text-sm text-danger-600"
                      >
                        第 {rows.indexOf(row) + 1} 行：{row.errorMessage}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-neutral-900 mb-2">操作说明</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• 点击「添加行」可增加新的配餐单录入行</li>
                <li>• 双击数量单元格可将该数值复制到下方所有行</li>
                <li>• 支持导出Excel模板，填好后批量导入</li>
                <li>• 所有数据校验通过后才能批量提交</li>
              </ul>
            </div>
            <Button size="lg" onClick={handleSaveAll}>
              <Save className="w-4 h-4 mr-2" />
              批量提交 ({validRowsCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/StatusBadge'
import { StatusFlowChart } from '@/components/StatusFlowChart'
import { StatusTimeline } from '@/components/StatusTimeline'
import { ActionButton } from '@/components/ActionButton'
import { DenseTable } from '@/components/DenseTable'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { useState } from 'react'
import { Edit2, X, Check, Save } from 'lucide-react'
import {
  getAvailableTransitions,
} from '@/constants/statusMachine'
import type { MealItem, ShortageMaterial } from '@/types'

export function MealOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getOrder, transitionStatus, createShortageReplenish, batchUpdateItems, updateOrder } = useMealOrderStore()
  const { currentUser, hasPermission } = useAuthStore()
  const [showShortageModal, setShowShortageModal] = useState(false)
  const [shortageItems, setShortageItems] = useState<MealItem[]>([])
  const [shortageRemark, setShortageRemark] = useState('')
  const [previousConclusion, setPreviousConclusion] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingItems, setEditingItems] = useState<MealItem[]>([])
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [resubmitRemark, setResubmitRemark] = useState('')

  const order = getOrder(id!)

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-neutral-500 mb-4">配餐单不存在</p>
        <Button variant="secondary" onClick={() => navigate('/meal-orders')}>
          返回列表
        </Button>
      </div>
    )
  }

  const transitions = getAvailableTransitions(
    order.status,
    currentUser!.role,
    false
  )

  const handleStatusTransition = (toStatus: string, remark: string) => {
    transitionStatus(id!, toStatus as any, remark)
  }

  const handleReportShortage = () => {
    const itemsWithShortage = shortageItems
      .filter((item) => (item.shortageQuantity || 0) > 0)
      .map((item) => ({
        ...item,
        actualQuantity: item.actualQuantity ?? item.quantity - (item.shortageQuantity || 0),
      }))

    const updatedOrderItems = shortageItems.map((item) => ({
      ...item,
      actualQuantity: item.actualQuantity ?? item.quantity - (item.shortageQuantity || 0),
      shortageQuantity: item.shortageQuantity || 0,
    }))

    const materials: ShortageMaterial[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        name: '缺货说明',
        type: 'text',
        content: shortageRemark,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser!.name,
      },
    ]

    batchUpdateItems(id!, updatedOrderItems)

    createShortageReplenish(id!, {
      items: itemsWithShortage,
      remarks: shortageRemark,
      previousConclusion,
      materials,
    })

    setShowShortageModal(false)
    setShortageItems([])
    setShortageRemark('')
    setPreviousConclusion('')
  }

  const openShortageModal = () => {
    const items = order.items.map((item) => ({
      ...item,
      shortageQuantity: item.shortageQuantity || 0,
      actualQuantity: item.actualQuantity || item.quantity,
    }))
    setShortageItems(items)
    setShowShortageModal(true)
  }

  const updateShortageQuantity = (itemId: string, value: number) => {
    setShortageItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              shortageQuantity: value,
              actualQuantity: item.quantity - value,
            }
          : item
      )
    )
  }

  const handleStartEdit = () => {
    setEditingItems(order.items.map((item) => ({ ...item })))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingItems([])
  }

  const handleSaveEdit = () => {
    const items = editingItems.filter((i) => i.quantity > 0)
    if (items.length === 0) {
      alert('请至少填写一个菜品的数量')
      return
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    batchUpdateItems(id!, items)

    updateOrder(id!, {
      totalQuantity,
    })

    setIsEditing(false)
    setEditingItems([])
  }

  const updateEditingQuantity = (itemId: string, quantity: number) => {
    setEditingItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const handleEditAndResubmit = () => {
    const items = editingItems.filter((i) => i.quantity > 0)
    if (items.length === 0) {
      alert('请至少填写一个菜品的数量')
      return
    }
    setShowResubmitModal(true)
  }

  const confirmEditAndResubmit = () => {
    if (!resubmitRemark.trim()) {
      return
    }

    const items = editingItems.filter((i) => i.quantity > 0)
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    batchUpdateItems(id!, items)

    updateOrder(id!, {
      totalQuantity,
    })

    setIsEditing(false)
    setEditingItems([])
    setShowResubmitModal(false)
    setResubmitRemark('')

    transitionStatus(id!, 'submitted', resubmitRemark)
  }

  const canEdit = order.status === 'production_rejected' && hasPermission('edit_order')
  const displayItems = isEditing ? editingItems : order.items
  const editingTotalQuantity = isEditing
    ? editingItems.reduce((sum, item) => sum + item.quantity, 0)
    : order.totalQuantity

  const productionRejectionReason = order.productionRejectionReason || (
    order.status === 'production_rejected' ? order.productionRemark : undefined
  )

  const productionRemark = order.status === 'production_rejected'
    ? undefined
    : order.productionRemark

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/meal-orders')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-neutral-900">
              {order.orderNo}
            </h2>
            <StatusBadge status={order.status} />
            {order.shortageReplenish && (
              <StatusBadge
                status={order.shortageReplenish.status}
                isShortage
              />
            )}
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            {order.storeName} · {order.deliveryDate}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">状态流转</h3>
          <StatusFlowChart currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-neutral-500" />
                配餐明细
                {isEditing && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    编辑中
                  </span>
                )}
              </h3>
              <div className="text-sm text-neutral-500">
                总计：
                <span className="font-bold text-primary-600 ml-1">
                  {isEditing ? editingTotalQuantity : order.totalQuantity}
                </span>{' '}
                份
              </div>
            </div>
            <div className="card-body p-0">
              <DenseTable
                columns={[
                  { key: 'name', title: '菜品名称' },
                  { key: 'unit', title: '单位', width: '60px', align: 'center' },
                  {
                    key: 'quantity',
                    title: '订购量',
                    width: '150px',
                    align: 'right',
                    render: (row: any) =>
                      isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              updateEditingQuantity(
                                row.id,
                                Math.max(0, row.quantity - 1)
                              )
                            }
                            className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="input input-sm w-16 text-center"
                            value={row.quantity}
                            min={0}
                            onChange={(e) =>
                              updateEditingQuantity(
                                row.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                          <button
                            onClick={() =>
                              updateEditingQuantity(row.id, row.quantity + 1)
                            }
                            className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        row.quantity
                      ),
                  },
                  ...(isEditing
                    ? []
                    : [
                        {
                          key: 'actualQuantity',
                          title: '实发量',
                          width: '100px',
                          align: 'right',
                          render: (row: any) =>
                            row.actualQuantity !== undefined ? (
                              row.actualQuantity
                            ) : (
                              <span className="text-neutral-400">-</span>
                            ),
                        } as const,
                        {
                          key: 'shortageQuantity',
                          title: '缺货量',
                          width: '100px',
                          align: 'right',
                          render: (row: any) =>
                            row.shortageQuantity ? (
                              <span className="text-danger-600 font-medium">
                                {row.shortageQuantity}
                              </span>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            ),
                        } as const,
                        {
                          key: 'remark',
                          title: '备注',
                          render: (row: any) =>
                            row.remark || (
                              <span className="text-neutral-400">-</span>
                            ),
                        } as const,
                      ]),
                ]}
                data={displayItems}
                rowKey="id"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isEditing ? (
              <>
                <Button variant="success" onClick={handleEditAndResubmit}>
                  <Check className="w-4 h-4 mr-2" />
                  保存并重新提交
                </Button>
                <Button variant="secondary" onClick={handleSaveEdit}>
                  <Save className="w-4 h-4 mr-2" />
                  仅保存
                </Button>
                <Button variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  取消编辑
                </Button>
              </>
            ) : (
              <>
                <ActionButton
                  transitions={transitions}
                  onAction={handleStatusTransition}
                />
                {canEdit && (
                  <Button variant="warning" onClick={handleStartEdit}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    编辑单据
                  </Button>
                )}
                {hasPermission('report_shortage') &&
                  order.status === 'distributed' && (
                    <Button variant="danger" onClick={openShortageModal}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      上报缺货
                    </Button>
                  )}
                {order.shortageReplenish && (
                  <Button
                    variant="warning"
                    onClick={() => navigate(`/shortage-review/${order.id}`)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    查看缺货补发
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-neutral-500" />
                基本信息
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">门店</span>
                <span className="text-sm font-medium">{order.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">配送日期</span>
                <span className="text-sm font-medium">{order.deliveryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">总数量</span>
                <span className="text-sm font-medium">{order.totalQuantity} 份</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">菜品数</span>
                <span className="text-sm font-medium">{order.items.length} 种</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">创建人</span>
                <span className="text-sm font-medium">{order.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">创建时间</span>
                <span className="text-sm font-medium">
                  {new Date(order.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          {productionRemark && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-neutral-900">生产备注</h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-neutral-700">{productionRemark}</p>
              </div>
            </div>
          )}

          {productionRejectionReason && (
            <div className="card border-danger-200 bg-danger-50">
              <div className="card-header border-danger-200">
                <h3 className="font-semibold text-danger-800">生产驳回原因</h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-danger-700">{productionRejectionReason}</p>
              </div>
            </div>
          )}

          {order.resubmitRemark && (
            <div className="card border-success-200 bg-success-50">
              <div className="card-header border-success-200">
                <h3 className="font-semibold text-success-800">修改说明（重提）</h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-success-700">{order.resubmitRemark}</p>
              </div>
            </div>
          )}

          {order.deliveryRemark && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-neutral-900">配送备注</h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-neutral-700">{order.deliveryRemark}</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-neutral-500" />
                操作记录
              </h3>
            </div>
            <div className="card-body">
              <StatusTimeline logs={order.statusLogs} />
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showShortageModal}
        onClose={() => setShowShortageModal(false)}
        title="上报缺货"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowShortageModal(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleReportShortage}
              disabled={
                shortageItems.filter((i) => (i.shortageQuantity || 0) > 0)
                  .length === 0 || !shortageRemark.trim()
              }
            >
              确认上报
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="label">缺货明细（填写缺货数量）</label>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <DenseTable
                columns={[
                  { key: 'name', title: '菜品' },
                  { key: 'unit', title: '单位', width: '60px', align: 'center' },
                  {
                    key: 'quantity',
                    title: '订购量',
                    width: '80px',
                    align: 'right',
                  },
                  {
                    key: 'actualQuantity',
                    title: '实发量',
                    width: '100px',
                    align: 'right',
                    render: (row: any) => (
                      <input
                        type="number"
                        className="input input-sm text-right"
                        value={row.actualQuantity || 0}
                        min={0}
                        max={row.quantity}
                        onChange={(e) => {
                          const actual = parseInt(e.target.value) || 0
                          updateShortageQuantity(
                            row.id,
                            row.quantity - actual
                          )
                        }}
                      />
                    ),
                  },
                  {
                    key: 'shortageQuantity',
                    title: '缺货量',
                    width: '100px',
                    align: 'right',
                    render: (row: any) => (
                      <input
                        type="number"
                        className="input input-sm text-right text-danger-600 font-medium"
                        value={row.shortageQuantity || 0}
                        min={0}
                        max={row.quantity}
                        onChange={(e) =>
                          updateShortageQuantity(
                            row.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    ),
                  },
                ]}
                data={shortageItems}
                rowKey="id"
              />
            </div>
          </div>

          <div>
            <label className="label">
              上一环节结论 <span className="text-danger-500">*</span>
            </label>
            <textarea
              className="input min-h-[80px]"
              value={previousConclusion}
              onChange={(e) => setPreviousConclusion(e.target.value)}
              placeholder="请描述缺货发生的原因和现场情况..."
            />
          </div>

          <div>
            <label className="label">
              缺货说明 <span className="text-danger-500">*</span>
            </label>
            <textarea
              className="input min-h-[80px]"
              value={shortageRemark}
              onChange={(e) => setShortageRemark(e.target.value)}
              placeholder="请详细说明缺货情况和补发要求..."
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              缺货上报后将自动进入缺货补发流程，请确保信息准确无误。
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={showResubmitModal}
        onClose={() => {
          setShowResubmitModal(false)
          setResubmitRemark('')
        }}
        title="修改后重新提交"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowResubmitModal(false)
                setResubmitRemark('')
              }}
            >
              取消
            </Button>
            <Button
              variant="success"
              onClick={confirmEditAndResubmit}
              disabled={!resubmitRemark.trim()}
            >
              确认提交
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            请详细说明本次修改的内容，以便生产审核人员了解调整情况。
          </p>
          <div>
            <label className="label">
              修改说明 <span className="text-danger-500">*</span>
            </label>
            <textarea
              className="input min-h-[120px]"
              value={resubmitRemark}
              onChange={(e) => setResubmitRemark(e.target.value)}
              placeholder="请详细说明修改的菜品、数量调整原因等..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

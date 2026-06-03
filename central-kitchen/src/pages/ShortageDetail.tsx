import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  Image,
  Paperclip,
  Clock,
  MessageSquare,
  Plus,
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
import {
  getAvailableTransitions,
} from '@/constants/statusMachine'
import type { ShortageMaterial } from '@/types'

export function ShortageDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getOrder,
    transitionShortageStatus,
    addShortageMaterial,
  } = useMealOrderStore()
  const { currentUser, hasPermission } = useAuthStore()
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [newMaterialName, setNewMaterialName] = useState('')
  const [newMaterialContent, setNewMaterialContent] = useState('')

  const order = getOrder(id!)
  const shortage = order?.shortageReplenish

  if (!order || !shortage) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-neutral-500 mb-4">缺货补发记录不存在</p>
        <Button variant="secondary" onClick={() => navigate('/shortage-review')}>
          返回列表
        </Button>
      </div>
    )
  }

  const transitions = getAvailableTransitions(
    shortage.status,
    currentUser!.role,
    true
  )

  const handleStatusTransition = (toStatus: string, remark: string) => {
    transitionShortageStatus(id!, toStatus as any, remark)
  }

  const handleAddMaterial = () => {
    if (!newMaterialName.trim() || !newMaterialContent.trim()) return

    const material: ShortageMaterial = {
      id: Math.random().toString(36).substring(2, 11),
      name: newMaterialName,
      type: 'text',
      content: newMaterialContent,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser!.name,
    }

    addShortageMaterial(id!, material)
    setShowMaterialModal(false)
    setNewMaterialName('')
    setNewMaterialContent('')
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      default:
        return <Paperclip className="w-4 h-4" />
    }
  }

  const canAddMaterial =
    hasPermission('resubmit_shortage') &&
    shortage.status === 'supply_rejected'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/shortage-review')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-neutral-900">
              缺货补发详情
            </h2>
            <StatusBadge status={shortage.status} isShortage />
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            关联配餐单：{order.orderNo} · {order.storeName} ·{' '}
            {order.deliveryDate}
          </p>
        </div>
      </div>

      <div className="card border-amber-200 bg-amber-50/50">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-800 mb-1">上一环节结论</h4>
              <p className="text-sm text-amber-700">
                {shortage.previousConclusion}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">
            补发状态流转
          </h3>
          <StatusFlowChart currentStatus={shortage.status} isShortage />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger-500" />
                缺货明细
              </h3>
              <span className="text-sm text-neutral-500">
                共缺货{' '}
                <span className="font-bold text-danger-600">
                  {shortage.items.reduce(
                    (sum, i) => sum + (i.shortageQuantity || 0),
                    0
                  )}
                </span>{' '}
                份
              </span>
            </div>
            <div className="card-body p-0">
              <DenseTable
                columns={[
                  { key: 'name', title: '菜品名称' },
                  { key: 'unit', title: '单位', width: '60px', align: 'center' },
                  {
                    key: 'quantity',
                    title: '订购量',
                    width: '100px',
                    align: 'right',
                  },
                  {
                    key: 'actualQuantity',
                    title: '实发量',
                    width: '100px',
                    align: 'right',
                  },
                  {
                    key: 'shortageQuantity',
                    title: '缺货量',
                    width: '100px',
                    align: 'right',
                    render: (row: any) => (
                      <span className="text-danger-600 font-medium">
                        {row.shortageQuantity}
                      </span>
                    ),
                  },
                ]}
                data={shortage.items}
                rowKey="id"
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-neutral-500" />
                备注说明
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label text-neutral-500">缺货说明</label>
                <div className="input bg-neutral-50 min-h-[80px] whitespace-pre-wrap">
                  {shortage.remarks}
                </div>
              </div>

              {shortage.supplyRemark && (
                <div>
                  <label className="label text-blue-600">采购备注</label>
                  <div className="input bg-blue-50 border-blue-200 min-h-[60px] whitespace-pre-wrap text-blue-800">
                    {shortage.supplyRemark}
                  </div>
                </div>
              )}

              {shortage.replenishRemark && (
                <div>
                  <label className="label text-purple-600">补发详情</label>
                  <div className="input bg-purple-50 border-purple-200 min-h-[60px] whitespace-pre-wrap text-purple-800">
                    {shortage.replenishRemark}
                  </div>
                </div>
              )}

              {shortage.supervisorRemark && (
                <div>
                  <label className="label text-green-600">复核意见</label>
                  <div className="input bg-green-50 border-green-200 min-h-[60px] whitespace-pre-wrap text-green-800">
                    {shortage.supervisorRemark}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-neutral-500" />
                证明材料
                <span className="text-xs font-normal text-neutral-400">
                  ({shortage.materials.length} 个)
                </span>
              </h3>
              {canAddMaterial && (
                <Button size="sm" onClick={() => setShowMaterialModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  补充材料
                </Button>
              )}
            </div>
            <div className="card-body">
              {shortage.materials.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  暂无上传材料
                </div>
              ) : (
                <div className="space-y-2">
                  {shortage.materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-white rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500">
                        {getMaterialIcon(material.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {material.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {material.uploadedBy} ·{' '}
                          {new Date(
                            material.uploadedAt
                          ).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      {material.content && (
                        <div className="text-xs text-neutral-600 max-w-[200px] truncate">
                          {material.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton
              transitions={transitions}
              onAction={handleStatusTransition}
            />
            <Button
              variant="secondary"
              onClick={() => navigate(`/meal-orders/${order.id}`)}
            >
              查看原配餐单
            </Button>
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
                <span className="text-sm text-neutral-500">关联配餐单</span>
                <span className="text-sm font-medium">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">门店</span>
                <span className="text-sm font-medium">{order.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">配送日期</span>
                <span className="text-sm font-medium">{order.deliveryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">缺货菜品种类</span>
                <span className="text-sm font-medium">
                  {shortage.items.length} 种
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">缺货总数</span>
                <span className="text-sm font-medium text-danger-600">
                  {shortage.items.reduce(
                    (sum, i) => sum + (i.shortageQuantity || 0),
                    0
                  )}{' '}
                  份
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">创建时间</span>
                <span className="text-sm font-medium">
                  {new Date(shortage.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          {shortage.status === 'supply_rejected' && (
            <div className="card border-danger-200 bg-danger-50">
              <div className="card-header border-danger-200">
                <h3 className="font-semibold text-danger-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  驳回原因
                </h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-danger-700">
                  {shortage.supplyRemark || '暂无详细说明'}
                </p>
                <p className="text-xs text-danger-600 mt-3">
                  请补充相关材料后重新提交审核
                </p>
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
              <StatusTimeline logs={shortage.statusLogs} isShortage />
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        title="补充证明材料"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMaterialModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddMaterial}
              disabled={!newMaterialName.trim() || !newMaterialContent.trim()}
            >
              添加
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              材料名称 <span className="text-danger-500">*</span>
            </label>
            <input
              className="input"
              placeholder="如：缺货现场照片、签收单等"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              材料内容 <span className="text-danger-500">*</span>
            </label>
            <textarea
              className="input min-h-[120px]"
              placeholder="请详细描述或说明补充的材料内容..."
              value={newMaterialContent}
              onChange={(e) => setNewMaterialContent(e.target.value)}
            />
          </div>
          <div className="text-sm text-neutral-500">
            <p>提示：材料补充完成后，可提交采购重新审核。</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

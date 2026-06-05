import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ChevronRight,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import ReturnModal from '@/components/ReturnModal'
import ShipModal from '@/components/ShipModal'
import ReceiveModal from '@/components/ReceiveModal'
import { useOrdersStore } from '@/stores/orders'
import { useShipmentsStore } from '@/stores/shipments'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/shared/types'

const actionDisplayNames: Record<string, string> = {
  CREATE: '创建订单',
  CONFIRM: '确认生产',
  COMPLETE_PRODUCTION: '生产完成',
  SHIP: '确认发货',
  RECEIVE: '确认签收',
  RETURN: '退回订单',
  MARK_EXCEPTION: '标记异常',
  RESUBMIT: '重新提交',
  CONFIRM_SHIPMENT: '确认物流信息',
  CONFIRM_RECEIVE: '确认签收',
}

const roleDisplayNames: Record<string, string> = {
  SALES: '销售内勤',
  BREWER: '酿酒师',
  PACKER: '包装主管',
  ADMIN: '管理员',
}

const statusFlowConfig: {
  status: OrderStatus
  label: string
  description: string
  responsibleRole: string
  icon: React.ReactNode
}[] = [
  {
    status: 'DRAFT',
    label: '草稿',
    description: '销售内勤创建订单',
    responsibleRole: 'SALES',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    status: 'PENDING_CONFIRM',
    label: '待确认',
    description: '等待酿酒师确认',
    responsibleRole: 'BREWER',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    status: 'IN_PRODUCTION',
    label: '生产中',
    description: '酿酒师安排生产',
    responsibleRole: 'BREWER',
    icon: <Package className="w-4 h-4" />,
  },
  {
    status: 'READY_TO_SHIP',
    label: '待发货',
    description: '包装完成等待发货',
    responsibleRole: 'PACKER',
    icon: <Package className="w-4 h-4" />,
  },
  {
    status: 'SHIPPED',
    label: '已发货',
    description: '包装主管安排发货',
    responsibleRole: 'PACKER',
    icon: <Truck className="w-4 h-4" />,
  },
  {
    status: 'COMPLETED',
    label: '已完成',
    description: '销售确认签收完成',
    responsibleRole: 'SALES',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
]

const getStatusIndex = (status: OrderStatus): number => {
  const index = statusFlowConfig.findIndex((s) => s.status === status)
  return index >= 0 ? index : -1
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentOrder, isLoading, fetchOrder, transitionStatus } = useOrdersStore()
  const { confirmShipment, receiveShipment } = useShipmentsStore()

  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchOrder(id)
    }
  }, [id, fetchOrder])

  const handleAction = async (action: string, reason?: string) => {
    if (!id) return
    setError(null)
    try {
      await transitionStatus(id, action, reason)
      await fetchOrder(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败，请重试'
      setError(message)
    }
  }

  const handleReturn = (reason: string, remark: string) => {
    handleAction('RETURN', `${reason}${remark ? `: ${remark}` : ''}`)
    setReturnModalOpen(false)
  }

  const handleShipConfirm = async (logisticsCompany: string, trackingNo: string) => {
    const shipment = currentOrder?.shipments?.[0]
    if (!shipment) return
    setError(null)
    try {
      await confirmShipment(shipment.id, logisticsCompany, trackingNo)
      await fetchOrder(id!)
      setShipModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败，请重试'
      setError(message)
    }
  }

  const handleReceiveConfirm = async (receiveRemark: string) => {
    const shipment = currentOrder?.shipments?.[0]
    if (!shipment) return
    setError(null)
    try {
      await receiveShipment(shipment.id, receiveRemark)
      await fetchOrder(id!)
      setReceiveModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败，请重试'
      setError(message)
    }
  }

  const handleResubmit = () => {
    handleAction('RESUBMIT')
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const getUserInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?'
  }

  const isOrderOverdue = () => {
    if (!currentOrder) return false
    const updatedAt = new Date(currentOrder.updatedAt)
    const now = new Date()
    const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
    return diffHours > 48 && !['COMPLETED', 'DRAFT'].includes(currentOrder.status)
  }

  const renderActionButtons = () => {
    if (!currentOrder || !user) return null

    const status = currentOrder.status
    const role = user.role

    if (role === 'BREWER') {
      if (status === 'PENDING_CONFIRM') {
        return (
          <div className="space-y-2">
            <button
              onClick={() => handleAction('CONFIRM')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              确认生产
            </button>
            <button
              onClick={() => setReturnModalOpen(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 font-medium transition-colors disabled:opacity-50"
            >
              退回
            </button>
          </div>
        )
      }
      if (status === 'IN_PRODUCTION') {
        return (
          <div className="space-y-2">
            <button
              onClick={() => handleAction('COMPLETE_PRODUCTION')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
            >
              生产完成
            </button>
            <button
              onClick={() => setReturnModalOpen(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 font-medium transition-colors disabled:opacity-50"
            >
              退回
            </button>
          </div>
        )
      }
    }

    if (role === 'PACKER' && status === 'READY_TO_SHIP') {
      const shipment = currentOrder.shipments?.[0]
      if (shipment) {
        return (
          <div className="space-y-2">
            <button
              onClick={() => setShipModalOpen(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium transition-colors disabled:opacity-50"
            >
              填写物流并发货
            </button>
            <button
              onClick={() => setReturnModalOpen(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 font-medium transition-colors disabled:opacity-50"
            >
              退回
            </button>
          </div>
        )
      }
    }

    if (role === 'PACKER' && status === 'SHIPPED') {
      const shipment = currentOrder.shipments?.[0]
      if (shipment && !shipment.logisticsCompany) {
        return (
          <div className="space-y-2">
            <button
              onClick={() => setShipModalOpen(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium transition-colors disabled:opacity-50"
            >
              补填物流信息
            </button>
          </div>
        )
      }
    }

    if (role === 'SALES' && status === 'SHIPPED') {
      return (
        <div className="space-y-2">
          <button
            onClick={() => setReceiveModalOpen(true)}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
          >
            确认签收
          </button>
          <button
            onClick={() => setReturnModalOpen(true)}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 font-medium transition-colors disabled:opacity-50"
          >
            退回
          </button>
        </div>
      )
    }

    if (role === 'ADMIN') {
      if (status === 'RETURNED') {
        return (
          <div className="space-y-2">
            <button
              onClick={handleResubmit}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium transition-colors disabled:opacity-50"
            >
              重新提交
            </button>
            <button
              onClick={() => handleAction('MARK_EXCEPTION')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
            >
              标记异常
            </button>
          </div>
        )
      }
      if (status === 'EXCEPTION') {
        return (
          <button
            onClick={handleResubmit}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium transition-colors disabled:opacity-50"
          >
            重新提交
          </button>
        )
      }
      if (!['COMPLETED', 'DRAFT'].includes(status)) {
        return (
          <button
            onClick={() => handleAction('MARK_EXCEPTION')}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
          >
            标记异常
          </button>
        )
      }
    }

    return (
      <p className="text-sm text-stone-500 text-center py-2">
        当前状态无可用操作
      </p>
    )
  }

  if (isLoading && !currentOrder) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!currentOrder) {
    return (
      <Layout>
        <div className="text-center py-16 text-stone-500">
          订单不存在
        </div>
      </Layout>
    )
  }

  const latestShipment = currentOrder.shipments?.[0]
  const auditLogs = currentOrder.auditLogs || []
  const overdue = isOrderOverdue()
  const currentStatusIndex = getStatusIndex(currentOrder.status as OrderStatus)
  const isAbnormalStatus = ['RETURNED', 'EXCEPTION'].includes(currentOrder.status)
  
  const latestAbnormalLog = auditLogs
    .filter(log => log.action === 'RETURN' || log.action === 'MARK_EXCEPTION')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const renderStatusFlow = () => {
    const showFlow = !isAbnormalStatus

    if (!showFlow) {
      const isReturn = latestAbnormalLog?.action === 'RETURN'
      const abnormalReason = latestAbnormalLog?.remark 
        || (isReturn ? '订单已退回' : '订单标记为异常')
      const abnormalUser = latestAbnormalLog?.user
      const abnormalTime = latestAbnormalLog?.createdAt
        ? new Date(latestAbnormalLog.createdAt).toLocaleString('zh-CN')
        : null

      return (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">订单状态</h2>
          <div className="p-4 bg-red-50 rounded-xl space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                {isReturn ? (
                  <RotateCcw className="w-6 h-6 text-red-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <StatusBadge status={currentOrder.status} />
                <p className="text-sm text-red-600 mt-1 font-medium">
                  {abnormalReason}
                </p>
              </div>
            </div>
            {abnormalUser && abnormalTime && (
              <div className="flex items-center gap-4 pl-16 text-sm text-stone-600">
                <span>
                  操作人：<span className="font-medium text-stone-900">{abnormalUser.displayName || abnormalUser.username}</span>
                  <span className="text-stone-400 mx-2">·</span>
                  <span className="text-amber-700">({abnormalUser.role})</span>
                </span>
                <span>
                  时间：<span className="font-medium text-stone-900">{abnormalTime}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-6">订单流转进度</h2>
        <div className="relative">
          <div className="flex items-start justify-between">
            {statusFlowConfig.map((step, index) => {
              const isCompleted = index < currentStatusIndex
              const isCurrent = index === currentStatusIndex
              const isPending = index > currentStatusIndex

              return (
                <div key={step.status} className="flex flex-col items-center flex-1 relative">
                  {index < statusFlowConfig.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2',
                        isCompleted ? 'bg-amber-500' : 'bg-stone-200'
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                      isCompleted && 'bg-amber-500 border-amber-500 text-white',
                      isCurrent && 'bg-white border-amber-500 text-amber-600 ring-4 ring-amber-100',
                      isPending && 'bg-white border-stone-300 text-stone-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-amber-700' : isCompleted ? 'text-stone-700' : 'text-stone-400'
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {roleDisplayNames[step.responsibleRole]}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">当前责任人</span>
            <span className="font-medium text-stone-900">
              {currentStatusIndex >= 0 && currentStatusIndex < statusFlowConfig.length
                ? roleDisplayNames[statusFlowConfig[currentStatusIndex].responsibleRole]
                : '-'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-md hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/orders" className="text-stone-500 hover:text-stone-700">
              订单列表
            </Link>
            <span className="text-stone-400">/</span>
            <span className="text-stone-900 font-medium">订单详情</span>
          </nav>
        </div>

        {overdue && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-800">订单超时提醒</p>
              <p className="text-sm text-red-600">该订单已超过 48 小时未处理，请尽快跟进</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {renderStatusFlow()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">订单信息</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 mb-1">订单号</p>
                  <p className="text-base font-medium text-stone-900">{currentOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">经销商</p>
                  <p className="text-base font-medium text-stone-900">{currentOrder.distributorName}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">状态</p>
                  <StatusBadge status={currentOrder.status} />
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">交货日期</p>
                  <p className="text-base font-medium text-stone-900">{formatDate(currentOrder.deliveryDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">创建人</p>
                  <p className="text-base font-medium text-stone-900">
                    {currentOrder.createdBy?.displayName || currentOrder.createdBy?.username || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">更新时间</p>
                  <p className="text-base font-medium text-stone-900">{formatDateTime(currentOrder.updatedAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-stone-500 mb-1">备注</p>
                  <p className="text-base text-stone-700">{currentOrder.remark || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">产品明细</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 uppercase">产品名称</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 uppercase">规格</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-stone-500 uppercase">数量</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 uppercase">单位</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {currentOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-stone-900">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">{item.specification}</td>
                        <td className="px-4 py-3 text-sm text-stone-900 text-right font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">操作记录</h2>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-stone-500 py-4 text-center">暂无操作记录</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-200" />
                  <div className="space-y-6">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative flex gap-4">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white z-10 flex-shrink-0',
                          log.action === 'RETURN' || log.action === 'MARK_EXCEPTION' ? 'bg-red-500' :
                          log.action === 'COMPLETE_PRODUCTION' || log.action === 'RECEIVE' || log.action === 'CONFIRM_RECEIVE' ? 'bg-green-500' :
                          'bg-amber-500'
                        )}>
                          {getUserInitials(log.user?.displayName || log.user?.username || '')}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-stone-900">
                              {log.user?.displayName || log.user?.username}
                            </span>
                            <span className="text-sm text-stone-600">
                              {actionDisplayNames[log.action] || log.action}
                            </span>
                            {log.fromStatus && log.toStatus && (
                              <span className="text-xs text-stone-400">
                                ({log.fromStatus} → {log.toStatus})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {formatDateTime(log.createdAt)}
                          </p>
                          {log.remark && (
                            <p className="text-sm text-stone-600 mt-1 bg-stone-50 px-3 py-2 rounded">
                              {log.remark}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">状态流转</h2>
              <div className="mb-4 p-4 bg-stone-50 rounded-lg">
                <p className="text-sm text-stone-500 mb-2">当前状态</p>
                <StatusBadge status={currentOrder.status} />
              </div>
              {renderActionButtons()}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">物流信息</h2>
              {latestShipment ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-stone-500">物流公司</p>
                      <p className="text-sm font-medium text-stone-900">{latestShipment.logisticsCompany || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-stone-500">物流单号</p>
                      <p className="text-sm font-medium text-stone-900">{latestShipment.trackingNo || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-stone-500">发货时间</p>
                      <p className="text-sm font-medium text-stone-900">{formatDateTime(latestShipment.shippedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-stone-500">签收时间</p>
                      <p className="text-sm font-medium text-stone-900">{formatDateTime(latestShipment.receivedAt)}</p>
                    </div>
                  </div>
                  {latestShipment.receiveRemark && (
                    <div className="pt-2 border-t border-stone-100">
                      <p className="text-sm text-stone-500 mb-1">签收备注</p>
                      <p className="text-sm text-stone-600">{latestShipment.receiveRemark}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-500 text-center py-4">暂无物流信息</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onSubmit={handleReturn}
      />
      <ShipModal
        isOpen={shipModalOpen}
        onClose={() => setShipModalOpen(false)}
        onSubmit={handleShipConfirm}
      />
      <ReceiveModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        onSubmit={handleReceiveConfirm}
      />
    </Layout>
  )
}

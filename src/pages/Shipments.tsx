import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  User,
  FileText,
  MapPin,
} from 'lucide-react'
import Layout from '@/components/Layout'
import ShipModal from '@/components/ShipModal'
import ReceiveModal from '@/components/ReceiveModal'
import { useShipmentsStore } from '@/stores/shipments'
import { useAuthStore } from '@/stores/auth'
import type { Shipment, AuditLog } from '@/shared/types'
import type { OrderStatus } from '@/shared/types'
import { cn } from '@/lib/utils'

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待发货' },
  { key: 'shipping', label: '运输中' },
  { key: 'received', label: '已签收' },
  { key: 'exception', label: '异常' },
]

const roleDisplayNames: Record<string, string> = {
  SALES: '销售内勤',
  BREWER: '酿酒师',
  PACKER: '包装主管',
  ADMIN: '管理员',
}

const getShipmentStatus = (shipment: Shipment): { label: string; className: string } => {
  const orderStatus = shipment.order?.status as OrderStatus
  if (orderStatus === 'RETURNED' || orderStatus === 'EXCEPTION') {
    return { label: '异常', className: 'bg-red-100 text-red-800' }
  }
  if (!shipment.shippedAt) {
    return { label: '待发货', className: 'bg-stone-100 text-stone-800' }
  }
  if (shipment.shippedAt && !shipment.receivedAt) {
    return { label: '运输中', className: 'bg-teal-100 text-teal-800' }
  }
  if (shipment.receivedAt) {
    return { label: '已签收', className: 'bg-green-100 text-green-800' }
  }
  return { label: '待发货', className: 'bg-stone-100 text-stone-800' }
}

const matchesTab = (shipment: Shipment, tab: string): boolean => {
  const status = getShipmentStatus(shipment)
  switch (tab) {
    case 'pending':
      return status.label === '待发货'
    case 'shipping':
      return status.label === '运输中'
    case 'received':
      return status.label === '已签收'
    case 'exception':
      return status.label === '异常'
    default:
      return true
  }
}

interface ShipmentTimelineProps {
  shipment: Shipment
}

function ShipmentTimeline({ shipment }: ShipmentTimelineProps) {
  const orderStatus = shipment.order?.status as OrderStatus
  const isException = orderStatus === 'RETURNED' || orderStatus === 'EXCEPTION'

  const auditLogs = shipment.order?.auditLogs || []
  const latestAbnormalLog = auditLogs
    .filter((log: AuditLog) => log.action === 'RETURN' || log.action === 'MARK_EXCEPTION')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const timelineSteps = [
    {
      key: 'order_created',
      label: '订单创建',
      description: '销售内勤提交经销订单',
      time: shipment.order?.createdAt,
      role: 'SALES',
      icon: <FileText className="w-4 h-4" />,
      completed: true,
    },
    {
      key: 'ready_to_ship',
      label: '待发货',
      description: '包装完成，等待发货',
      time: shipment.createdAt,
      role: 'PACKER',
      icon: <Package className="w-4 h-4" />,
      completed: true,
    },
    {
      key: 'shipped',
      label: '已发货',
      description: shipment.logisticsCompany
        ? `${shipment.logisticsCompany} - ${shipment.trackingNo || '暂无单号'}`
        : '等待填写物流信息',
      time: shipment.shippedAt,
      role: 'PACKER',
      icon: <Truck className="w-4 h-4" />,
      completed: !!shipment.shippedAt,
    },
    {
      key: 'received',
      label: '已签收',
      description: shipment.receiveRemark || '客户已确认签收',
      time: shipment.receivedAt,
      role: 'SALES',
      icon: <CheckCircle className="w-4 h-4" />,
      completed: !!shipment.receivedAt,
    },
  ]

  if (isException) {
    const abnormalDesc = latestAbnormalLog?.remark 
      || (latestAbnormalLog?.action === 'RETURN' ? '订单已退回' : '订单标记为异常')
    const abnormalTime = latestAbnormalLog?.createdAt || shipment.order?.updatedAt
    const abnormalRole = latestAbnormalLog?.user?.role || 'ADMIN'

    timelineSteps.push({
      key: 'exception',
      label: orderStatus === 'RETURNED' ? '已退回' : '异常',
      description: abnormalDesc,
      time: abnormalTime,
      role: abnormalRole,
      icon: <AlertCircle className="w-4 h-4" />,
      completed: true,
    })
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-3">
      {timelineSteps.map((step, index) => {
        const isLast = index === timelineSteps.length - 1
        const isExceptionStep = step.key === 'exception'

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  step.completed && !isExceptionStep && 'bg-amber-500 text-white',
                  !step.completed && 'bg-stone-200 text-stone-400',
                  isExceptionStep && 'bg-red-500 text-white'
                )}
              >
                {step.icon}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 my-1',
                    step.completed && !isExceptionStep ? 'bg-amber-300' : 'bg-stone-200'
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-sm font-medium',
                    step.completed ? 'text-stone-900' : 'text-stone-400'
                  )}
                >
                  {step.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {roleDisplayNames[step.role]}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">{step.description}</p>
              <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(step.time)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Shipments() {
  const { shipments, total, page, totalPages, isLoading, fetchShipments, confirmShipment, receiveShipment } = useShipmentsStore()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [searchOrderNo, setSearchOrderNo] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  useEffect(() => {
    fetchShipments({ page })
  }, [page])

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchesTabFilter = matchesTab(s, activeTab)
      const matchesSearch = !searchOrderNo || 
        (s.order?.orderNo || '').toLowerCase().includes(searchOrderNo.toLowerCase())
      return matchesTabFilter && matchesSearch
    })
  }, [shipments, activeTab, searchOrderNo])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleShipClick = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setShipModalOpen(true)
  }

  const handleReceiveClick = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setReceiveModalOpen(true)
  }

  const handleShipSubmit = async (logisticsCompany: string, trackingNo: string) => {
    if (selectedShipment) {
      await confirmShipment(selectedShipment.id, logisticsCompany, trackingNo)
      setShipModalOpen(false)
      setSelectedShipment(null)
      fetchShipments({ page })
    }
  }

  const handleReceiveSubmit = async (receiveRemark: string) => {
    if (selectedShipment) {
      await receiveShipment(selectedShipment.id, receiveRemark)
      setReceiveModalOpen(false)
      setSelectedShipment(null)
      fetchShipments({ page })
    }
  }

  const handlePageChange = (newPage: number) => {
    useShipmentsStore.setState({ page: newPage })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const userRole = user?.role

  const stats = useMemo(() => {
    return {
      pending: shipments.filter(s => getShipmentStatus(s).label === '待发货').length,
      shipping: shipments.filter(s => getShipmentStatus(s).label === '运输中').length,
      received: shipments.filter(s => getShipmentStatus(s).label === '已签收').length,
      exception: shipments.filter(s => getShipmentStatus(s).label === '异常').length,
    }
  }, [shipments])

  return (
    <Layout title="发货跟踪">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-200 rounded-lg">
                <Package className="w-5 h-5 text-stone-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stats.pending}</p>
                <p className="text-sm text-stone-500">待发货</p>
              </div>
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-200 rounded-lg">
                <Truck className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-900">{stats.shipping}</p>
                <p className="text-sm text-teal-600">运输中</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.received}</p>
                <p className="text-sm text-green-600">已签收</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{stats.exception}</p>
                <p className="text-sm text-red-600">异常</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeTab === tab.key
                        ? 'bg-amber-600 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-stone-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                  )}
                >
                  列表
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'timeline' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                  )}
                >
                  时间线
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchOrderNo}
                    onChange={(e) => setSearchOrderNo(e.target.value)}
                    placeholder="搜索订单号..."
                    className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      订单号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      经销商
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      物流公司
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      物流单号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      发货时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      签收时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                        <p className="mt-2 text-stone-500">加载中...</p>
                      </td>
                    </tr>
                  ) : filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-stone-500">
                        <Package className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                        暂无发货记录
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((shipment) => {
                      const status = getShipmentStatus(shipment)
                      const canShip = userRole === 'PACKER' && !shipment.shippedAt
                      const canReceive = userRole === 'SALES' && shipment.shippedAt && !shipment.receivedAt
                      const canFillLogistics = userRole === 'PACKER' && shipment.shippedAt && !shipment.logisticsCompany

                      return (
                        <tr key={shipment.id} className="hover:bg-stone-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                            {shipment.order?.orderNo || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                            {shipment.order?.distributorName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                            {shipment.logisticsCompany || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                            {shipment.trackingNo || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                            {formatDate(shipment.shippedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                            {formatDate(shipment.receivedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                status.className
                              )}
                            >
                              {status.label === '待发货' && <Package className="w-3 h-3 mr-1" />}
                              {status.label === '运输中' && <Truck className="w-3 h-3 mr-1" />}
                              {status.label === '已签收' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {status.label === '异常' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            {canShip && (
                              <button
                                onClick={() => handleShipClick(shipment)}
                                className="text-amber-600 hover:text-amber-700 font-medium"
                              >
                                确认发货
                              </button>
                            )}
                            {canFillLogistics && (
                              <button
                                onClick={() => handleShipClick(shipment)}
                                className="text-amber-600 hover:text-amber-700 font-medium"
                              >
                                填写物流
                              </button>
                            )}
                            {canReceive && (
                              <button
                                onClick={() => handleReceiveClick(shipment)}
                                className="text-teal-600 hover:text-teal-700 font-medium"
                              >
                                确认签收
                              </button>
                            )}
                            <Link
                              to={`/orders/${shipment.orderId}`}
                              className="text-stone-600 hover:text-stone-900 font-medium"
                            >
                              查看订单
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="col-span-full text-center py-12 text-stone-500">
                <Package className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                暂无发货记录
              </div>
            ) : (
              filteredShipments.map((shipment) => {
                const status = getShipmentStatus(shipment)
                const canShip = userRole === 'PACKER' && !shipment.shippedAt
                const canReceive = userRole === 'SALES' && shipment.shippedAt && !shipment.receivedAt
                const canFillLogistics = userRole === 'PACKER' && shipment.shippedAt && !shipment.logisticsCompany

                return (
                  <div
                    key={shipment.id}
                    className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
                  >
                    <div className="p-4 border-b border-stone-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-stone-900">{shipment.order?.orderNo}</p>
                          <p className="text-sm text-stone-500">{shipment.order?.distributorName}</p>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <ShipmentTimeline shipment={shipment} />
                    </div>
                    <div className="px-4 pb-4 flex gap-2">
                      {canShip && (
                        <button
                          onClick={() => handleShipClick(shipment)}
                          className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          确认发货
                        </button>
                      )}
                      {canFillLogistics && (
                        <button
                          onClick={() => handleShipClick(shipment)}
                          className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          填写物流
                        </button>
                      )}
                      {canReceive && (
                        <button
                          onClick={() => handleReceiveClick(shipment)}
                          className="flex-1 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          确认签收
                        </button>
                      )}
                      <Link
                        to={`/orders/${shipment.orderId}`}
                        className="flex-1 px-3 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors text-center"
                      >
                        查看详情
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="bg-white rounded-lg border border-stone-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-stone-600">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    p === page
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ShipModal
        isOpen={shipModalOpen}
        onClose={() => {
          setShipModalOpen(false)
          setSelectedShipment(null)
        }}
        onSubmit={handleShipSubmit}
      />

      <ReceiveModal
        isOpen={receiveModalOpen}
        onClose={() => {
          setReceiveModalOpen(false)
          setSelectedShipment(null)
        }}
        onSubmit={handleReceiveSubmit}
      />
    </Layout>
  )
}

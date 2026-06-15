import { useState, useEffect } from 'react'
import { AlertTriangle, Users, Clock, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { useUserStore } from '@/contexts/UserContext'
import { Card, CardHeader, CardContent } from '@/components/Card/Card'
import { Drawer } from '@/components/Drawer/Drawer'
import { Timeline } from '@/components/Timeline/Timeline'
import { orderService } from '@/services/orderService'
import { exceptionService } from '@/services/exceptionService'
import type { Order, ExceptionHandle } from '@/types'

export function Dashboard() {
  const { stuckOrders, stuckFeedbacks, incompleteAdditions, orders, loadAllData, detectStuck, resetData } = useAppStore()
  const { currentUser } = useUserStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [timeline, setTimeline] = useState<{ order: Order; timeline: any[] } | null>(null)
  const [handles, setHandles] = useState<ExceptionHandle[]>([])
  const [action, setAction] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  
  useEffect(() => {
    loadAllData()
    
    const interval = setInterval(() => {
      detectStuck()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [loadAllData, detectStuck])
  
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    const detail = orderService.getOrderDetail(order.id)
    if (detail) {
      setTimeline(detail)
    }
    const history = exceptionService.getHandlesByTarget('order', order.id)
    setHandles(history)
    setDrawerOpen(true)
  }
  
  const handleException = () => {
    if (!selectedOrder || !currentUser || !action || !reason) return
    
    exceptionService.handleException({
      targetType: 'order',
      targetId: selectedOrder.id,
      action: action as any,
      reason,
    }, currentUser.id, currentUser.name, currentUser.role)
    
    loadAllData()
    setDrawerOpen(false)
    setSelectedOrder(null)
    setAction('')
    setReason('')
  }
  
  const totalIssues = stuckOrders.length + stuckFeedbacks.length + incompleteAdditions.length
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监控看板</h1>
          <p className="text-gray-500 mt-1">实时监控订单状态，及时发现卡单问题</p>
        </div>
        <button
          onClick={resetData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重置数据
        </button>
      </div>
      
      {totalIssues > 0 && (
        <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-900">
                发现 {totalIssues} 个问题需要处理
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {stuckOrders.length} 个卡单 · {stuckFeedbacks.length} 个反馈卡住 · {incompleteAdditions.length} 个加项未完成
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardHeader title="总订单数" badge={String(orders.length)} badgeColor="blue" />
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-bold text-blue-700">
              {orders.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50" warning={stuckOrders.length > 0}>
          <CardHeader title="卡单数量" badge={String(stuckOrders.length)} badgeColor="orange" />
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-bold text-orange-700">
              {stuckOrders.length}
            </div>
            {stuckOrders.length > 0 && (
              <p className="text-sm text-orange-600 mt-2">需要立即处理</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardHeader title="已完成" badge={String(orders.filter(o => o.status === 'completed').length)} badgeColor="green" />
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-bold text-green-700">
              {orders.filter(o => o.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            卡单预警
          </h2>
          <div className="space-y-3">
            {stuckOrders.map(order => (
              <Card 
                key={order.id} 
                warning 
                onClick={() => handleOrderClick(order)}
              >
                <CardHeader 
                  title={order.customerName}
                  subtitle={`${order.serviceType} · ${order.housekeeperName}`}
                  badge="卡单"
                  badgeColor="red"
                />
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        卡住时长: {order.stuckInfo?.stuckDuration} 分钟
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        当前处理人: {order.currentHandler?.name} (
                        {order.currentHandler?.role === 'customer_service' ? '客服' :
                         order.currentHandler?.role === 'quality_supervisor' ? '质检主管' : '家政员'})
                      </span>
                    </div>
                    <p className="text-sm text-orange-600 font-medium">
                      原因: {order.stuckInfo?.stuckReason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {stuckOrders.length === 0 && (
              <Card>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">
                    当前没有卡单，系统运行正常
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            处理人追踪
          </h2>
          <div className="space-y-3">
            {stuckOrders.map(order => (
              <Card key={order.id}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.currentHandler?.id}`}
                      alt={order.currentHandler?.name}
                      className="w-12 h-12 rounded-full bg-gray-200"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{order.currentHandler?.name}</p>
                      <p className="text-sm text-gray-500">
                        {order.currentHandler?.role === 'customer_service' ? '客服' :
                         order.currentHandler?.role === 'quality_supervisor' ? '质检主管' : '家政员'}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        处理订单: {order.customerName} - {order.serviceType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {order.stuckInfo?.stuckDuration} 分钟
                      </p>
                      <p className="text-xs text-gray-400">卡住时长</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <Drawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        title="异常处理"
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">订单信息</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p><span className="text-gray-500">客户:</span> {selectedOrder.customerName}</p>
                <p><span className="text-gray-500">家政员:</span> {selectedOrder.housekeeperName}</p>
                <p><span className="text-gray-500">服务类型:</span> {selectedOrder.serviceType}</p>
                <p><span className="text-gray-500">卡住原因:</span> {selectedOrder.stuckInfo?.stuckReason}</p>
                <p><span className="text-gray-500">卡住时长:</span> {selectedOrder.stuckInfo?.stuckDuration} 分钟</p>
              </div>
            </div>
            
            {selectedOrder.currentHandler && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">当前处理人</h3>
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedOrder.currentHandler.id}`}
                    alt={selectedOrder.currentHandler.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{selectedOrder.currentHandler.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedOrder.currentHandler.role === 'customer_service' ? '客服' :
                       selectedOrder.currentHandler.role === 'quality_supervisor' ? '质检主管' : '家政员'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {timeline && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">状态流转时间线</h3>
                <Timeline items={timeline.timeline} />
              </div>
            )}
            
            {handles.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">处理历史</h3>
                <div className="space-y-2">
                  {handles.map(handle => (
                    <div key={handle.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{handle.action}</p>
                          <p className="text-sm text-gray-500">{handle.handlerName} · {handle.reason}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(handle.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">处理操作</h3>
              <div className="space-y-3">
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择处理方式</option>
                  <option value="reject">驳回</option>
                  <option value="supplement">补录信息</option>
                  <option value="transfer">转交其他处理人</option>
                  <option value="complete">完成处理</option>
                </select>
                
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入处理原因"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                
                <button
                  onClick={handleException}
                  disabled={!action || !reason}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  提交处理
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { AlertTriangle, Users, Clock, RefreshCw, MessageSquarePlus, FileText } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { useUserStore } from '@/contexts/UserContext'
import { Card, CardHeader, CardContent } from '@/components/Card/Card'
import { Drawer } from '@/components/Drawer/Drawer'
import { Timeline } from '@/components/Timeline/Timeline'
import { orderService } from '@/services/orderService'
import { exceptionService } from '@/services/exceptionService'
import type { Order, ExceptionHandle, ProcessFeedback, AdditionRecord } from '@/types'

export function Dashboard() {
  const { stuckOrders, stuckFeedbacks, incompleteAdditions, orders, loadAllData, detectStuck, resetData, users } = useAppStore()
  const { currentUser } = useUserStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<ProcessFeedback | null>(null)
  const [selectedAddition, setSelectedAddition] = useState<AdditionRecord | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTitle, setDrawerTitle] = useState('异常处理')
  const [timeline, setTimeline] = useState<{ order: Order; timeline: any[] } | null>(null)
  const [handles, setHandles] = useState<ExceptionHandle[]>([])
  const [action, setAction] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [transferTo, setTransferTo] = useState<string>('')
  const [drawerTargetType, setDrawerTargetType] = useState<'order' | 'feedback' | 'addition'>('order')
  
  useEffect(() => {
    loadAllData()
    
    const interval = setInterval(() => {
      detectStuck()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [loadAllData, detectStuck])
  
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setSelectedFeedback(null)
    setSelectedAddition(null)
    setDrawerTargetType('order')
    setDrawerTitle('订单异常处理')
    const detail = orderService.getOrderDetail(order.id)
    if (detail) {
      setTimeline(detail)
    }
    const history = exceptionService.getHandlesByTarget('order', order.id)
    setHandles(history)
    setDrawerOpen(true)
  }
  
  const handleFeedbackClick = (feedback: ProcessFeedback) => {
    setSelectedFeedback(feedback)
    setSelectedOrder(null)
    setSelectedAddition(null)
    setDrawerTargetType('feedback')
    setDrawerTitle('反馈异常处理')
    const history = exceptionService.getHandlesByTarget('feedback', feedback.id)
    setHandles(history)
    setDrawerOpen(true)
  }
  
  const handleAdditionClick = (addition: AdditionRecord) => {
    setSelectedAddition(addition)
    setSelectedOrder(null)
    setSelectedFeedback(null)
    setDrawerTargetType('addition')
    setDrawerTitle('加项记录处理')
    const history = exceptionService.getHandlesByTarget('addition', addition.id)
    setHandles(history)
    setDrawerOpen(true)
  }
  
  const handleException = () => {
    if (!currentUser || !action || !reason) return
    
    const targetId = selectedOrder?.id || selectedFeedback?.id || selectedAddition?.id
    if (!targetId) return
    
    const request: any = {
      targetType: drawerTargetType,
      targetId,
      action: action as any,
      reason,
    }
    
    if (action === 'transfer' && transferTo) {
      request.transferTo = transferTo
    }
    
    exceptionService.handleException(request, currentUser.id, currentUser.name, currentUser.role)
    
    loadAllData()
    
    if (drawerTargetType === 'addition' && selectedAddition) {
      const additions = JSON.parse(localStorage.getItem('additions') || '[]')
      const updated = additions.find((a: AdditionRecord) => a.id === selectedAddition.id)
      if (updated) {
        setSelectedAddition(updated)
        const history = exceptionService.getHandlesByTarget('addition', updated.id)
        setHandles(history)
      }
    } else if (drawerTargetType === 'feedback' && selectedFeedback) {
      const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]')
      const updated = feedbacks.find((f: ProcessFeedback) => f.id === selectedFeedback.id)
      if (updated) {
        setSelectedFeedback(updated)
        const history = exceptionService.getHandlesByTarget('feedback', updated.id)
        setHandles(history)
      }
    } else if (drawerTargetType === 'order' && selectedOrder) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const updated = orders.find((o: Order) => o.id === selectedOrder.id)
      if (updated) {
        setSelectedOrder(updated)
        const detail = orderService.getOrderDetail(updated.id)
        if (detail) {
          setTimeline(detail)
        }
        const history = exceptionService.getHandlesByTarget('order', updated.id)
        setHandles(history)
      }
    }
    
    setAction('')
    setReason('')
    setTransferTo('')
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <MessageSquarePlus className="w-5 h-5 text-red-500" />
            卡住反馈
          </h2>
          <div className="space-y-3">
            {stuckFeedbacks.map(feedback => (
              <Card 
                key={feedback.id} 
                warning 
                onClick={() => handleFeedbackClick(feedback)}
              >
                <CardHeader 
                  title={`反馈 #${feedback.id.replace('feedback-', '')}`}
                  subtitle={`${feedback.submitterName} · ${feedback.type === 'complaint' ? '投诉' : feedback.type === 'suggestion' ? '建议' : feedback.type === 'issue' ? '问题' : '加项请求'}`}
                  badge="卡住"
                  badgeColor="red"
                />
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 line-clamp-2">{feedback.content}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        卡住时长: {feedback.stuckInfo?.stuckDuration} 分钟
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        当前处理人: {feedback.currentHandler?.name} (
                        {feedback.currentHandler?.role === 'customer_service' ? '客服' : '质检主管'})
                      </span>
                    </div>
                    <p className="text-sm text-orange-600 font-medium">
                      原因: {feedback.stuckInfo?.stuckReason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {stuckFeedbacks.length === 0 && (
              <Card>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">
                    当前没有卡住的反馈
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            未完成加项
          </h2>
          <div className="space-y-3">
            {incompleteAdditions.map(addition => (
              <Card 
                key={addition.id} 
                warning 
                onClick={() => handleAdditionClick(addition)}
              >
                <CardHeader 
                  title={addition.additionType}
                  subtitle={`${addition.housekeeperName} · ¥${addition.estimatedCost}`}
                  badge="未完成"
                  badgeColor="red"
                />
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 line-clamp-2">{addition.additionContent}</p>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        责任人: {(addition.currentHandler?.name || (addition.history && addition.history.length > 0 ? addition.history[addition.history.length - 1]?.operatorName : addition.housekeeperName)) || '待分配'} (
                        {(addition.currentHandler?.role || (addition.history && addition.history.length > 0 ? addition.history[addition.history.length - 1]?.operatorRole : 'housekeeper')) === 'customer_service' ? '客服' :
                         (addition.currentHandler?.role || (addition.history && addition.history.length > 0 ? addition.history[addition.history.length - 1]?.operatorRole : 'housekeeper')) === 'housekeeper' ? '家政员' :
                         (addition.currentHandler?.role || (addition.history && addition.history.length > 0 ? addition.history[addition.history.length - 1]?.operatorRole : 'housekeeper')) === 'quality_supervisor' ? '质检主管' : '家政员'})
                      </span>
                    </div>
                    <p className="text-sm text-red-600 font-medium">
                      未完成原因: {addition.incompleteReason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {incompleteAdditions.length === 0 && (
              <Card>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">
                    当前没有未完成的加项记录
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Drawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        width="lg"
      >
        <div className="space-y-6">
          {selectedOrder && (
            <>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">订单信息</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p><span className="text-gray-500">客户:</span> {selectedOrder.customerName}</p>
                  <p><span className="text-gray-500">家政员:</span> {selectedOrder.housekeeperName}</p>
                  <p><span className="text-gray-500">服务类型:</span> {selectedOrder.serviceType}</p>
                  {selectedOrder.stuckInfo && (
                    <>
                      <p><span className="text-gray-500">卡住原因:</span> {selectedOrder.stuckInfo.stuckReason}</p>
                      <p><span className="text-gray-500">卡住时长:</span> {selectedOrder.stuckInfo.stuckDuration} 分钟</p>
                    </>
                  )}
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
            </>
          )}
          
          {selectedFeedback && (
            <>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">反馈信息</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p><span className="text-gray-500">提交人:</span> {selectedFeedback.submitterName} ({selectedFeedback.submitterRole === 'housekeeper' ? '家政员' : '客户'})</p>
                  <p><span className="text-gray-500">反馈类型:</span> {selectedFeedback.type === 'complaint' ? '投诉' : selectedFeedback.type === 'suggestion' ? '建议' : selectedFeedback.type === 'issue' ? '问题' : '加项请求'}</p>
                  <p><span className="text-gray-500">反馈内容:</span> {selectedFeedback.content}</p>
                  <p><span className="text-gray-500">当前状态:</span> {selectedFeedback.status === 'stuck' ? '卡住' : selectedFeedback.status === 'processing' ? '处理中' : selectedFeedback.status === 'pending' ? '待处理' : '已完成'}</p>
                  {selectedFeedback.stuckInfo && (
                    <>
                      <p><span className="text-gray-500">卡住原因:</span> {selectedFeedback.stuckInfo.stuckReason}</p>
                      <p><span className="text-gray-500">卡住时长:</span> {selectedFeedback.stuckInfo.stuckDuration} 分钟</p>
                    </>
                  )}
                </div>
              </div>
              
              {selectedFeedback.currentHandler && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">当前处理人</h3>
                  <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFeedback.currentHandler.id}`}
                      alt={selectedFeedback.currentHandler.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{selectedFeedback.currentHandler.name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedFeedback.currentHandler.role === 'customer_service' ? '客服' : '质检主管'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {selectedAddition && (
            <>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">加项记录信息</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p><span className="text-gray-500">加项类型:</span> {selectedAddition.additionType}</p>
                  <p><span className="text-gray-500">加项内容:</span> {selectedAddition.additionContent}</p>
                  <p><span className="text-gray-500">预计费用:</span> ¥{selectedAddition.estimatedCost}</p>
                  <p><span className="text-gray-500">家政员:</span> {selectedAddition.housekeeperName}</p>
                  <p><span className="text-gray-500">创建人:</span> {selectedAddition.creatorName}</p>
                  <p><span className="text-gray-500">当前状态:</span> {selectedAddition.status === 'pending_confirmation' ? '待确认' : selectedAddition.status === 'pending_approval' ? '待批准' : selectedAddition.status === 'in_progress' ? '进行中' : selectedAddition.status === 'completed' ? '已完成' : selectedAddition.status === 'incomplete' ? '未完成' : selectedAddition.status === 'rejected_by_housekeeper' ? '家政员拒绝' : selectedAddition.status === 'rejected_by_supervisor' ? '主管驳回' : '已确认'}</p>
                  {selectedAddition.incompleteReason && (
                    <p><span className="text-gray-500">未完成原因:</span> {selectedAddition.incompleteReason}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">责任人</h3>
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAddition.currentHandler?.id || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorId : selectedAddition.housekeeperId)}`}
                    alt={selectedAddition.currentHandler?.name || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorName : selectedAddition.housekeeperName)}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{selectedAddition.currentHandler?.name || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorName : selectedAddition.housekeeperName) || '待分配'}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedAddition.currentHandler?.role || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorRole : 'housekeeper')) === 'customer_service' ? '客服' :
                       (selectedAddition.currentHandler?.role || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorRole : 'housekeeper')) === 'housekeeper' ? '家政员' :
                       (selectedAddition.currentHandler?.role || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorRole : 'housekeeper')) === 'quality_supervisor' ? '质检主管' : '家政员'}
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedAddition.history && selectedAddition.history.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">处理历史回看</h3>
                  <div className="space-y-2">
                    {selectedAddition.history.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{item.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">{item.operatorName}</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {item.operatorRole === 'customer_service' ? '客服' :
                                 item.operatorRole === 'housekeeper' ? '家政员' :
                                 item.operatorRole === 'quality_supervisor' ? '质检主管' : '管理员'}
                              </span>
                            </div>
                            {item.reason && (
                              <p className="text-sm text-gray-500 mt-1">原因: {item.reason}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(item.timestamp).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {handles.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">异常处理记录</h3>
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
                {drawerTargetType === 'addition' && selectedAddition ? (
                  <>
                    {selectedAddition.status === 'pending_confirmation' && (
                      <>
                        <option value="confirm">确认加项</option>
                        <option value="reject">拒绝加项</option>
                      </>
                    )}
                    {selectedAddition.status === 'pending_approval' && (
                      <>
                        <option value="approve">批准加项</option>
                        <option value="reject">主管驳回</option>
                      </>
                    )}
                    {selectedAddition.status === 'approved' && (
                      <>
                        <option value="complete">标记完成</option>
                        <option value="mark_incomplete">标记未完成</option>
                      </>
                    )}
                    {selectedAddition.status === 'in_progress' && (
                      <>
                        <option value="complete">标记完成</option>
                        <option value="mark_incomplete">标记未完成</option>
                      </>
                    )}
                    {selectedAddition.status === 'incomplete' && (
                      <>
                        <option value="confirm">重新提交</option>
                        <option value="transfer">转交处理人</option>
                      </>
                    )}
                    {(selectedAddition.status === 'rejected_by_housekeeper' || selectedAddition.status === 'rejected_by_supervisor') && (
                      <option value="confirm">重新提交</option>
                    )}
                  </>
                ) : drawerTargetType === 'feedback' ? (
                  <>
                    <option value="reject">驳回</option>
                    <option value="supplement">补录信息</option>
                    <option value="transfer">转交其他处理人</option>
                    <option value="complete">完成处理</option>
                  </>
                ) : (
                  <>
                    <option value="reject">驳回</option>
                    <option value="supplement">补录信息</option>
                    <option value="transfer">转交其他处理人</option>
                    <option value="complete">完成处理</option>
                  </>
                )}
              </select>
              
              {action === 'transfer' && users && (
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择转交对象</option>
                  {drawerTargetType === 'feedback' ? (
                    users.filter(u => u.role === 'customer_service' || u.role === 'quality_supervisor').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'customer_service' ? '客服' : '质检主管'})
                      </option>
                    ))
                  ) : drawerTargetType === 'addition' ? (
                    users.filter(u => u.role === 'housekeeper' || u.role === 'quality_supervisor').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'housekeeper' ? '家政员' : '质检主管'})
                      </option>
                    ))
                  ) : (
                    users.filter(u => u.role === 'customer_service' || u.role === 'quality_supervisor').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'customer_service' ? '客服' : '质检主管'})
                      </option>
                    ))
                  )}
                </select>
              )}
              
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请输入处理原因"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              
              <button
                onClick={handleException}
                disabled={!action || !reason || (action === 'transfer' && !transferTo)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                提交处理
              </button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
import type { Order, GetOrdersResponse, GetOrderDetailResponse, TimelineItem } from '@/types'

const getOrders = (): Order[] => {
  const data = localStorage.getItem('orders')
  return data ? JSON.parse(data) : []
}

const getStuckOrders = (): Order[] => {
  return getOrders().filter(order => order.status === 'stuck')
}

export const orderService = {
  getOrders: (): GetOrdersResponse => {
    const orders = getOrders()
    const stuckCount = orders.filter(o => o.status === 'stuck').length
    return { orders, total: orders.length, stuckCount }
  },

  getStuckOrders: () => {
    return getStuckOrders()
  },

  getOrderById: (id: string): Order | undefined => {
    return getOrders().find(order => order.id === id)
  },

  getOrderDetail: (id: string): GetOrderDetailResponse | undefined => {
    const order = orderService.getOrderById(id)
    if (!order) return undefined
    
    const timeline: TimelineItem[] = [
      {
        id: 'timeline-1',
        status: '订单创建',
        timestamp: order.createdAt,
        description: `客户${order.customerName}预约${order.serviceType}服务`,
      },
      {
        id: 'timeline-2',
        status: '分配家政员',
        timestamp: order.createdAt,
        handler: {
          role: 'housekeeper',
          name: order.housekeeperName,
          id: order.housekeeperId,
        },
        description: `分配给${order.housekeeperName}`,
      },
    ]
    
    if (order.status === 'in_service' || order.status === 'feedback_submitted' || order.status === 'feedback_processing' || order.status === 'stuck' || order.status === 'completed') {
      timeline.push({
        id: 'timeline-3',
        status: '服务进行中',
        timestamp: order.serviceDate,
        handler: {
          role: 'housekeeper',
          name: order.housekeeperName,
          id: order.housekeeperId,
        },
        description: `${order.housekeeperName}开始提供服务`,
      })
    }
    
    if (order.currentHandler) {
      timeline.push({
        id: 'timeline-4',
        status: order.status === 'stuck' ? '卡单状态' : '当前状态',
        timestamp: order.updatedAt,
        handler: order.currentHandler,
        description: order.stuckInfo?.stuckReason || `由${order.currentHandler.name}处理`,
      })
    }
    
    if (order.status === 'completed') {
      timeline.push({
        id: 'timeline-5',
        status: '服务完成',
        timestamp: order.updatedAt,
        description: '服务已完成',
      })
    }
    
    return { order, timeline }
  },

  updateOrderStatus: (id: string, status: Order['status'], handler?: Order['currentHandler'], stuckInfo?: Order['stuckInfo']) => {
    const orders = getOrders()
    const index = orders.findIndex(o => o.id === id)
    if (index === -1) return false
    
    orders[index].status = status
    orders[index].currentHandler = handler
    orders[index].stuckInfo = stuckInfo
    orders[index].updatedAt = new Date().toISOString()
    
    localStorage.setItem('orders', JSON.stringify(orders))
    return true
  },

  detectStuckOrders: () => {
    const orders = getOrders()
    const stuckThreshold = 30 * 60 * 1000
    
    orders.forEach(order => {
      if (order.status === 'feedback_processing') {
        const updatedAt = new Date(order.updatedAt).getTime()
        const now = Date.now()
        if (now - updatedAt > stuckThreshold) {
          order.status = 'stuck'
          order.stuckInfo = {
            stuckAt: order.updatedAt,
            stuckDuration: Math.floor((now - updatedAt) / 60000),
            stuckReason: '反馈处理超时',
          }
        }
      }
    })
    
    localStorage.setItem('orders', JSON.stringify(orders))
  },
}
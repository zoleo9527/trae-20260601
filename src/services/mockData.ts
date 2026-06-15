import type {
  User,
  Order,
  ProcessFeedback,
  AdditionRecord,
  ExceptionHandle,
  HandlerInfo,
  StuckInfo,
  AdditionHistoryItem,
} from '@/types'

const generateId = () => Math.random().toString(36).substring(2, 9)

const now = new Date()
const formatDate = (date: Date) => date.toISOString()

const users: User[] = [
  {
    id: 'user-1',
    name: '张客服',
    role: 'customer_service',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=service1',
    online: true,
  },
  {
    id: 'user-2',
    name: '李客服',
    role: 'customer_service',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=service2',
    online: false,
  },
  {
    id: 'user-3',
    name: '王阿姨',
    role: 'housekeeper',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=keeper1',
    online: true,
  },
  {
    id: 'user-4',
    name: '赵阿姨',
    role: 'housekeeper',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=keeper2',
    online: true,
  },
  {
    id: 'user-5',
    name: '陈主管',
    role: 'quality_supervisor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=supervisor',
    online: true,
  },
  {
    id: 'user-6',
    name: '系统管理员',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    online: true,
  },
]

const serviceTypes = ['日常保洁', '深度清洁', '家电清洗', '月嫂服务', '育儿嫂服务', '老人护理']

const customers = [
  { id: 'cust-1', name: '刘女士' },
  { id: 'cust-2', name: '周先生' },
  { id: 'cust-3', name: '吴女士' },
  { id: 'cust-4', name: '郑先生' },
  { id: 'cust-5', name: '孙女士' },
]

const orders: Order[] = []
for (let i = 0; i < 20; i++) {
  const customer = customers[Math.floor(Math.random() * customers.length)]
  const housekeeper = users.filter(u => u.role === 'housekeeper')[Math.floor(Math.random() * 2)]
  const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]
  const serviceDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  
  let status: Order['status']
  let currentHandler: HandlerInfo | undefined
  let stuckInfo: StuckInfo | undefined
  
  if (i < 5) {
    status = 'stuck'
    const handler = users.filter(u => u.role === 'customer_service' || u.role === 'quality_supervisor')[Math.floor(Math.random() * 3)]
    currentHandler = {
      role: handler.role as HandlerInfo['role'],
      name: handler.name,
      id: handler.id,
    }
    stuckInfo = {
      stuckAt: formatDate(new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000)),
      stuckDuration: Math.floor(Math.random() * 120) + 30,
      stuckReason: i === 0 ? '等待家政员确认' : i === 1 ? '客户未回复补充信息' : i === 2 ? '质检主管未审核' : i === 3 ? '加项记录待批准' : '处理人未响应',
    }
  } else if (i < 10) {
    status = 'feedback_processing'
    const handler = users.filter(u => u.role === 'customer_service')[Math.floor(Math.random() * 2)]
    currentHandler = {
      role: 'customer_service',
      name: handler.name,
      id: handler.id,
    }
  } else if (i < 15) {
    status = 'in_service'
  } else if (i < 18) {
    status = 'completed'
  } else {
    status = 'pending'
  }
  
  orders.push({
    id: `order-${i + 1}`,
    customerId: customer.id,
    customerName: customer.name,
    housekeeperId: housekeeper.id,
    housekeeperName: housekeeper.name,
    serviceType,
    serviceDate: formatDate(serviceDate),
    status,
    currentHandler,
    stuckInfo,
    createdAt: formatDate(new Date(serviceDate.getTime() - 24 * 60 * 60 * 1000)),
    updatedAt: formatDate(new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)),
  })
}

const feedbacks: ProcessFeedback[] = []
for (let i = 0; i < 15; i++) {
  const order = orders[Math.floor(Math.random() * orders.length)]
  const submitter = Math.random() > 0.5 
    ? users.filter(u => u.role === 'housekeeper')[Math.floor(Math.random() * 2)]
    : customers[Math.floor(Math.random() * customers.length)]
  const types: ProcessFeedback['type'][] = ['complaint', 'suggestion', 'issue', 'addition_request']
  const type = types[Math.floor(Math.random() * types.length)]
  
  let status: ProcessFeedback['status']
  let currentHandler: HandlerInfo | undefined
  let stuckInfo: StuckInfo | undefined
  
  if (i < 3) {
    status = 'stuck'
    const handler = users.filter(u => u.role === 'customer_service' || u.role === 'quality_supervisor')[Math.floor(Math.random() * 3)]
    currentHandler = {
      role: handler.role as HandlerInfo['role'],
      name: handler.name,
      id: handler.id,
    }
    stuckInfo = {
      stuckAt: formatDate(new Date(now.getTime() - Math.random() * 60 * 60 * 1000)),
      stuckDuration: Math.floor(Math.random() * 90) + 30,
      stuckReason: i === 0 ? '等待质检主管审核' : i === 1 ? '客服未处理' : '家政员未确认',
    }
  } else if (i < 8) {
    status = 'processing'
    const handler = users.filter(u => u.role === 'customer_service')[Math.floor(Math.random() * 2)]
    currentHandler = {
      role: 'customer_service',
      name: handler.name,
      id: handler.id,
    }
  } else if (i < 10) {
    status = 'rejected'
  } else if (i < 12) {
    status = 'supplemented'
  } else {
    status = 'completed'
  }
  
  const contents = [
    '服务过程中发现厨房油烟机需要深度清洗',
    '客户要求增加窗户清洁服务',
    '家电清洗效果不满意，需要返工',
    '建议增加服务时长，完成更多清洁项目',
    '客户反馈服务态度需要改进',
  ]
  
  feedbacks.push({
    id: `feedback-${i + 1}`,
    orderId: order.id,
    submitterId: submitter.id,
    submitterName: submitter.name,
    submitterRole: submitter.id.startsWith('cust') ? 'customer' : 'housekeeper',
    content: contents[Math.floor(Math.random() * contents.length)],
    type,
    status,
    currentHandler,
    stuckInfo,
    createdAt: formatDate(new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000)),
    updatedAt: formatDate(new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)),
  })
}

const additions: AdditionRecord[] = []
for (let i = 0; i < 10; i++) {
  const order = orders[Math.floor(Math.random() * orders.length)]
  const creator = users.filter(u => u.role === 'customer_service')[Math.floor(Math.random() * 2)]
  const housekeeper = users.filter(u => u.role === 'housekeeper')[Math.floor(Math.random() * 2)]
  
  const additionTypes = ['窗户清洁', '油烟机深度清洗', '冰箱清洗', '空调清洗', '地毯清洁']
  const additionType = additionTypes[Math.floor(Math.random() * additionTypes.length)]
  
  let status: AdditionRecord['status']
  let currentHandler: HandlerInfo | undefined
  let incompleteReason: string | undefined
  const history: AdditionHistoryItem[] = []
  
  history.push({
    id: generateId(),
    action: '创建加项记录',
    operatorId: creator.id,
    operatorName: creator.name,
    operatorRole: creator.role,
    timestamp: formatDate(new Date(now.getTime() - Math.random() * 72 * 60 * 60 * 1000)),
  })
  
  if (i < 2) {
    status = 'incomplete'
    incompleteReason = i === 0 ? '家政员临时请假，无法完成服务' : '客户临时取消加项服务'
    history.push({
      id: generateId(),
      action: '标记为未完成',
      operatorId: 'user-5',
      operatorName: '陈主管',
      operatorRole: 'quality_supervisor',
      reason: incompleteReason,
      timestamp: formatDate(new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000)),
    })
  } else if (i < 4) {
    status = 'pending_confirmation'
    currentHandler = {
      role: 'housekeeper',
      name: housekeeper.name,
      id: housekeeper.id,
    }
  } else if (i < 6) {
    status = 'pending_approval'
    currentHandler = {
      role: 'quality_supervisor',
      name: '陈主管',
      id: 'user-5',
    }
    history.push({
      id: generateId(),
      action: '家政员确认',
      operatorId: housekeeper.id,
      operatorName: housekeeper.name,
      operatorRole: housekeeper.role,
      timestamp: formatDate(new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000)),
    })
  } else if (i < 8) {
    status = 'in_progress'
    history.push({
      id: generateId(),
      action: '家政员确认',
      operatorId: housekeeper.id,
      operatorName: housekeeper.name,
      operatorRole: housekeeper.role,
      timestamp: formatDate(new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000)),
    })
    history.push({
      id: generateId(),
      action: '质检主管批准',
      operatorId: 'user-5',
      operatorName: '陈主管',
      operatorRole: 'quality_supervisor',
      timestamp: formatDate(new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)),
    })
  } else {
    status = 'completed'
    history.push({
      id: generateId(),
      action: '家政员确认',
      operatorId: housekeeper.id,
      operatorName: housekeeper.name,
      operatorRole: housekeeper.role,
      timestamp: formatDate(new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000)),
    })
    history.push({
      id: generateId(),
      action: '质检主管批准',
      operatorId: 'user-5',
      operatorName: '陈主管',
      operatorRole: 'quality_supervisor',
      timestamp: formatDate(new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)),
    })
    history.push({
      id: generateId(),
      action: '完成服务',
      operatorId: housekeeper.id,
      operatorName: housekeeper.name,
      operatorRole: housekeeper.role,
      timestamp: formatDate(new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000)),
    })
  }
  
  additions.push({
    id: `addition-${i + 1}`,
    orderId: order.id,
    creatorId: creator.id,
    creatorName: creator.name,
    housekeeperId: housekeeper.id,
    housekeeperName: housekeeper.name,
    additionType,
    additionContent: `${additionType}服务，预计费用${Math.floor(Math.random() * 200) + 50}元`,
    estimatedCost: Math.floor(Math.random() * 200) + 50,
    status,
    currentHandler,
    incompleteReason,
    history,
    createdAt: formatDate(new Date(now.getTime() - Math.random() * 72 * 60 * 60 * 1000)),
    updatedAt: formatDate(new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000)),
  })
}

const handles: ExceptionHandle[] = [
  {
    id: 'handle-1',
    orderId: 'order-1',
    handlerId: 'user-1',
    handlerName: '张客服',
    handlerRole: 'customer_service',
    action: 'transfer',
    reason: '需要质检主管介入处理',
    result: '已转交给陈主管',
    createdAt: formatDate(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
  },
  {
    id: 'handle-2',
    orderId: 'order-2',
    feedbackId: 'feedback-1',
    handlerId: 'user-5',
    handlerName: '陈主管',
    handlerRole: 'quality_supervisor',
    action: 'supplement',
    reason: '需要补充服务照片',
    result: '已要求家政员补充照片',
    createdAt: formatDate(new Date(now.getTime() - 1 * 60 * 60 * 1000)),
  },
]

export const mockData = {
  users,
  orders,
  feedbacks,
  additions,
  handles,
}

export const initializeMockData = () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(users))
  }
  if (!localStorage.getItem('orders')) {
    localStorage.setItem('orders', JSON.stringify(orders))
  }
  if (!localStorage.getItem('feedbacks')) {
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks))
  }
  if (!localStorage.getItem('additions')) {
    localStorage.setItem('additions', JSON.stringify(additions))
  }
  if (!localStorage.getItem('handles')) {
    localStorage.setItem('handles', JSON.stringify(handles))
  }
}

export const resetMockData = () => {
  localStorage.setItem('users', JSON.stringify(users))
  localStorage.setItem('orders', JSON.stringify(orders))
  localStorage.setItem('feedbacks', JSON.stringify(feedbacks))
  localStorage.setItem('additions', JSON.stringify(additions))
  localStorage.setItem('handles', JSON.stringify(handles))
}
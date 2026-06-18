import type {
  User,
  Ticket,
  RefundRequest,
  RescheduleRequest,
  Complaint,
  ProcessingLog,
  ExceptionRecord,
  DashboardStats,
  TaskTrackerInfo,
  TicketRule
} from '~/types'

// 模拟用户数据
export const mockUsers: User[] = [
  { id: 'u1', name: '张明', role: 'ticket_manager', department: '票务部' },
  { id: 'u2', name: '李华', role: 'gate_staff', department: '检票部' },
  { id: 'u3', name: '王芳', role: 'customer_service', department: '客服部' },
]

// 模拟票种规则
export const mockTicketRules: TicketRule[] = [
  {
    id: 'tr1',
    ticketType: 'adult',
    ruleName: '成人票',
    refundPolicy: '游玩日前1天可全额退款,当天不可退款',
    reschedulePolicy: '游玩日前可免费改期1次',
    validDays: 1,
    description: '适用于18-59周岁成人'
  },
  {
    id: 'tr2',
    ticketType: 'child',
    ruleName: '儿童票',
    refundPolicy: '游玩日前1天可全额退款,当天收取20%手续费',
    reschedulePolicy: '游玩日前可免费改期1次',
    validDays: 1,
    description: '适用于6-17周岁儿童'
  },
  {
    id: 'tr3',
    ticketType: 'vip',
    ruleName: 'VIP票',
    refundPolicy: '游玩日前3天可全额退款,游玩日当天收取10%手续费',
    reschedulePolicy: '游玩日前可免费改期2次',
    validDays: 1,
    description: 'VIP专属通道,包含景区内餐饮'
  },
]

// 模拟票务数据
export const mockTickets: Ticket[] = [
  {
    id: 't1',
    ticketNo: 'TK20240618001',
    type: 'adult',
    price: 150,
    purchaseTime: '2024-06-15 10:30:00',
    validFrom: '2024-06-20 08:00:00',
    validUntil: '2024-06-20 18:00:00',
    status: 'valid',
    touristName: '张三',
    touristPhone: '13800138001',
    idCardNo: '110101199001011234'
  },
  {
    id: 't2',
    ticketNo: 'TK20240618002',
    type: 'vip',
    price: 280,
    purchaseTime: '2024-06-16 14:20:00',
    validFrom: '2024-06-22 08:00:00',
    validUntil: '2024-06-22 18:00:00',
    status: 'valid',
    touristName: '李四',
    touristPhone: '13900139002'
  },
]

// 模拟退票申请
export const mockRefundRequests: RefundRequest[] = [
  {
    id: 'r1',
    ticketId: 't1',
    ticketNo: 'TK20240618001',
    touristName: '张三',
    touristPhone: '13800138001',
    refundReason: '家中有急事,无法按计划出行',
    refundAmount: 150,
    status: 'processing',
    currentHandler: 'ticket_manager',
    currentHandlerName: '张明',
    handlerDepartment: '票务部',
    stuckPoint: '财务审批',
    stuckReason: '等待财务主管王总审批退款金额',
    createdAt: '2024-06-18 09:15:00',
    updatedAt: '2024-06-18 14:30:00',
    processingLogs: [
      {
        id: 'log1',
        type: 'create',
        action: '提交退票申请',
        operator: '张三',
        operatorRole: 'customer_service',
        operatorDepartment: '客服部',
        timestamp: '2024-06-18 09:15:00'
      },
      {
        id: 'log2',
        type: 'assign',
        action: '分配给票务主管审核',
        operator: '王芳',
        operatorRole: 'customer_service',
        operatorDepartment: '客服部',
        timestamp: '2024-06-18 09:20:00'
      },
      {
        id: 'log3',
        type: 'process',
        action: '审核通过,提交财务审批',
        operator: '张明',
        operatorRole: 'ticket_manager',
        operatorDepartment: '票务部',
        timestamp: '2024-06-18 14:30:00',
        comment: '核实游客信息无误,退票申请符合政策'
      }
    ]
  },
  {
    id: 'r2',
    ticketId: 't2',
    ticketNo: 'TK20240618002',
    touristName: '李四',
    touristPhone: '13900139002',
    refundReason: '临时出差,时间冲突',
    refundAmount: 280,
    status: 'pending',
    currentHandler: 'customer_service',
    currentHandlerName: '王芳',
    handlerDepartment: '客服部',
    stuckPoint: null,
    stuckReason: null,
    createdAt: '2024-06-18 16:45:00',
    updatedAt: '2024-06-18 16:45:00',
    processingLogs: []
  }
]

// 模拟改期申请
export const mockRescheduleRequests: RescheduleRequest[] = [
  {
    id: 'rs1',
    ticketId: 't1',
    ticketNo: 'TK20240618001',
    touristName: '张三',
    touristPhone: '13800138001',
    originalDate: '2024-06-20',
    newDate: '2024-06-25',
    rescheduleReason: '因天气原因想调整出行日期',
    status: 'approved',
    currentHandler: 'ticket_manager',
    currentHandlerName: '张明',
    handlerDepartment: '票务部',
    stuckPoint: null,
    stuckReason: null,
    createdAt: '2024-06-17 11:00:00',
    updatedAt: '2024-06-17 15:30:00',
    processingLogs: []
  }
]

// 模拟投诉记录
export const mockComplaints: Complaint[] = [
  {
    id: 'c1',
    complaintNo: 'CT20240618001',
    title: '检票闸机故障导致无法入园',
    description: '2024年6月18日上午10点,游客反映在北门检票时闸机故障,导致排队等待超过30分钟,严重影响游玩体验。',
    source: 'onsite',
    level: 'high',
    status: 'processing',
    relatedTicketId: 't1',
    relatedTicketNo: 'TK20240618001',
    touristName: '张三',
    touristPhone: '13800138001',
    assignedTo: 'gate_staff',
    assignedToName: '李华',
    currentHandler: 'gate_staff',
    currentHandlerName: '李华',
    handlerDepartment: '检票部',
    stuckPoint: '设备维修',
    stuckReason: '等待工程部维修人员到场处理,预计下午2点到达',
    createdAt: '2024-06-18 10:30:00',
    updatedAt: '2024-06-18 11:15:00',
    processingLogs: [
      {
        id: 'clog1',
        type: 'create',
        action: '现场提交投诉',
        operator: '张三',
        operatorRole: 'customer_service',
        operatorDepartment: '客服部',
        timestamp: '2024-06-18 10:30:00'
      },
      {
        id: 'clog2',
        type: 'assign',
        action: '分配给检票部处理',
        operator: '王芳',
        operatorRole: 'customer_service',
        operatorDepartment: '客服部',
        timestamp: '2024-06-18 10:35:00'
      },
      {
        id: 'clog3',
        type: 'process',
        action: '核实情况,确认闸机故障',
        operator: '李华',
        operatorRole: 'gate_staff',
        operatorDepartment: '检票部',
        timestamp: '2024-06-18 11:15:00',
        comment: '已联系工程部,正在等待维修人员到场'
      }
    ]
  },
  {
    id: 'c2',
    complaintNo: 'CT20240618002',
    title: '退票退款流程过慢',
    description: '游客反映提交的退票申请已超过3个工作日,但仍未收到退款,多次联系客服无果。',
    source: 'phone',
    level: 'urgent',
    status: 'processing',
    relatedTicketId: 't1',
    relatedTicketNo: 'TK20240618001',
    touristName: '张三',
    touristPhone: '13800138002',
    assignedTo: 'ticket_manager',
    assignedToName: '张明',
    currentHandler: 'ticket_manager',
    currentHandlerName: '张明',
    handlerDepartment: '票务部',
    stuckPoint: '财务审批',
    stuckReason: '财务主管王总出差,需要等到6月20日才能完成审批',
    createdAt: '2024-06-15 14:20:00',
    updatedAt: '2024-06-18 09:00:00',
    processingLogs: []
  },
  {
    id: 'c3',
    complaintNo: 'CT20240618003',
    title: 'VIP服务未享受',
    description: '游客购买VIP票后,在景区内未能享受承诺的餐饮服务,工作人员态度恶劣。',
    source: 'online',
    level: 'medium',
    status: 'assigned',
    assignedTo: 'customer_service',
    assignedToName: '王芳',
    currentHandler: 'customer_service',
    currentHandlerName: '王芳',
    handlerDepartment: '客服部',
    stuckPoint: null,
    stuckReason: null,
    createdAt: '2024-06-18 15:00:00',
    updatedAt: '2024-06-18 15:10:00',
    processingLogs: []
  }
]

// 模拟异常记录
export const mockExceptionRecords: ExceptionRecord[] = [
  {
    id: 'e1',
    type: 'complaint',
    relatedId: 'c1',
    relatedNo: 'CT20240618001',
    exceptionType: '设备故障',
    description: '北门闸机2号机故障,影响游客入园',
    status: 'handling',
    priority: 'high',
    createdAt: '2024-06-18 10:30:00',
    createdBy: '李华'
  }
]

// 模拟统计数据
export const mockDashboardStats: DashboardStats = {
  pendingRefunds: 5,
  pendingReschedules: 3,
  pendingComplaints: 8,
  todayProcessed: 12,
  stuckTasks: 2,
  urgentComplaints: 1
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// 生成申请编号
export function generateRefundNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `RT${date}${random}`
}

export function generateComplaintNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `CT${date}${random}`
}

// 获取任务追踪信息
export function getTaskTrackerInfo(
  type: 'refund' | 'reschedule' | 'complaint',
  item: RefundRequest | RescheduleRequest | Complaint
): TaskTrackerInfo {
  const taskTrackerInfo: TaskTrackerInfo = {
    taskId: item.id,
    taskNo: 'ticketNo' in item ? item.ticketNo : ('complaintNo' in item ? item.complaintNo : ''),
    taskType: type,
    title: type === 'complaint' && 'title' in item ? item.title :
           type === 'refund' ? `退票申请-${item.ticketNo}` :
           `改期申请-${item.ticketNo}`,
    currentHandler: item.currentHandler,
    currentHandlerName: item.currentHandlerName,
    handlerDepartment: item.handlerDepartment,
    status: item.status,
    stuckPoint: item.stuckPoint,
    stuckReason: item.stuckReason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    processingProgress: item.processingLogs.map(log => ({
      stage: log.action,
      handler: log.operator,
      handlerRole: log.operatorRole,
      handlerDepartment: log.operatorDepartment,
      status: log.type === 'process' ? 'completed' : log.type === 'stuck' ? 'stuck' : 'pending',
      startTime: log.timestamp,
      comment: log.comment
    }))
  }

  return taskTrackerInfo
}

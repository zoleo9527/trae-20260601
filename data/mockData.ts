import type { Appointment, User, TodoItem } from './types'

export const mockUsers: User[] = [
  { id: 'u1', name: '张调度', role: 'dispatcher', phone: '13800138001' },
  { id: 'u2', name: '李组长', role: 'team_leader', phone: '13800138002' },
  { id: 'u3', name: '王客服', role: 'customer_service', phone: '13800138003' }
]

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    orderNo: 'BJ20240115001',
    customer: { name: '陈先生', phone: '13900139001', wechat: 'chen123' },
    fromAddress: { province: '北京', city: '北京', district: '朝阳区', detail: '望京SOHO T3 1201室' },
    toAddress: { province: '北京', city: '北京', district: '海淀区', detail: '中关村软件园二期 8号楼' },
    date: '2024-01-16',
    timeSlot: '09:00-11:00',
    vehicleType: '4.2米厢货',
    estimatedPrice: 1800,
    status: 'pending',
    items: [
      { id: 'i1', name: '双人沙发', quantity: 1, weight: 80, volume: 2.5, fragile: false, material: '布艺', remark: '无', lastConclusion: '已确认' },
      { id: 'i2', name: '实木餐桌', quantity: 1, weight: 120, volume: 1.8, fragile: true, material: '实木', remark: '需小心搬运', lastConclusion: '已确认' },
      { id: 'i3', name: '55寸电视', quantity: 1, weight: 25, volume: 1.2, fragile: true, material: '电子', remark: '原包装已丢失', lastConclusion: '需准备气泡膜' },
      { id: 'i4', name: '冰箱', quantity: 1, weight: 70, volume: 0.8, fragile: false, material: '电器', remark: '需提前断电', lastConclusion: '已确认' },
      { id: 'i5', name: '纸箱', quantity: 10, weight: 50, volume: 3.0, fragile: false, material: '纸质', remark: '书籍和杂物', lastConclusion: '已确认' }
    ],
    exceptions: [],
    remarks: '客户要求早上9点准时到达',
    createdAt: '2024-01-15 10:30:00',
    updatedAt: '2024-01-15 10:30:00'
  },
  {
    id: 'a2',
    orderNo: 'BJ20240115002',
    customer: { name: '刘女士', phone: '13900139002', wechat: 'liu456' },
    fromAddress: { province: '北京', city: '北京', district: '西城区', detail: '金融街购物中心B1层' },
    toAddress: { province: '北京', city: '北京', district: '东城区', detail: '王府井大街1号' },
    date: '2024-01-16',
    timeSlot: '14:00-16:00',
    vehicleType: '3.5米厢货',
    estimatedPrice: 1200,
    actualPrice: 1500,
    status: 'in_progress',
    items: [
      { id: 'i6', name: '办公桌椅', quantity: 5, weight: 200, volume: 4.0, fragile: false, material: '木质', remark: '可拆分', lastConclusion: '已装车' },
      { id: 'i7', name: '文件柜', quantity: 2, weight: 150, volume: 2.0, fragile: false, material: '铁皮', remark: '需2人搬运', lastConclusion: '已装车' },
      { id: 'i8', name: '绿植盆栽', quantity: 3, weight: 45, volume: 1.5, fragile: true, material: '植物', remark: '小心浇水', lastConclusion: '已装车' }
    ],
    exceptions: [
      {
        id: 'e1',
        appointmentId: 'a2',
        type: 'price_increase',
        description: '客户临时增加3个纸箱，需要额外收费',
        amount: 300,
        status: 'processing',
        createdAt: '2024-01-16 14:30:00',
        handledBy: '张调度',
        resolution: '等待客户确认'
      }
    ],
    remarks: '客户是老客户，可以适当优惠',
    createdAt: '2024-01-15 14:00:00',
    updatedAt: '2024-01-16 14:30:00'
  },
  {
    id: 'a3',
    orderNo: 'BJ20240115003',
    customer: { name: '赵先生', phone: '13900139003', wechat: 'zhao789' },
    fromAddress: { province: '北京', city: '北京', district: '丰台区', detail: '方庄小区3号楼' },
    toAddress: { province: '天津', city: '天津', district: '和平区', detail: '南京路100号' },
    date: '2024-01-17',
    timeSlot: '08:00-10:00',
    vehicleType: '6.8米厢货',
    estimatedPrice: 3500,
    status: 'confirmed',
    items: [
      { id: 'i9', name: '床架', quantity: 1, weight: 100, volume: 3.0, fragile: false, material: '实木', remark: '需拆卸', lastConclusion: '已确认' },
      { id: 'i10', name: '衣柜', quantity: 1, weight: 180, volume: 4.5, fragile: false, material: '板式', remark: '需拆卸', lastConclusion: '已确认' },
      { id: 'i11', name: '洗衣机', quantity: 1, weight: 60, volume: 0.6, fragile: false, material: '电器', remark: '需固定', lastConclusion: '已确认' },
      { id: 'i12', name: '鱼缸', quantity: 1, weight: 200, volume: 1.2, fragile: true, material: '玻璃', remark: '需专业处理', lastConclusion: '待确认' },
      { id: 'i13', name: '钢琴', quantity: 1, weight: 250, volume: 2.0, fragile: true, material: '木质', remark: '需专业搬运', lastConclusion: '待确认' }
    ],
    exceptions: [],
    remarks: '跨城搬家，需要提前规划路线',
    createdAt: '2024-01-15 16:00:00',
    updatedAt: '2024-01-15 17:00:00'
  },
  {
    id: 'a4',
    orderNo: 'BJ20240114004',
    customer: { name: '孙女士', phone: '13900139004', wechat: 'sun012' },
    fromAddress: { province: '北京', city: '北京', district: '海淀区', detail: '五道口购物中心' },
    toAddress: { province: '北京', city: '北京', district: '朝阳区', detail: '三里屯SOHO' },
    date: '2024-01-14',
    timeSlot: '10:00-12:00',
    vehicleType: '3.5米厢货',
    estimatedPrice: 1000,
    actualPrice: 1000,
    status: 'completed',
    items: [
      { id: 'i14', name: '展示柜', quantity: 2, weight: 160, volume: 3.2, fragile: true, material: '玻璃', remark: '已安全搬运', lastConclusion: '完成' },
      { id: 'i15', name: '货架', quantity: 3, weight: 90, volume: 4.5, fragile: false, material: '金属', remark: '已组装', lastConclusion: '完成' }
    ],
    exceptions: [
      {
        id: 'e2',
        appointmentId: 'a4',
        type: 'damage',
        description: '展示柜边角轻微磕碰',
        photos: ['damage1.jpg', 'damage2.jpg'],
        status: 'resolved',
        createdAt: '2024-01-14 11:30:00',
        handledBy: '李组长',
        handledAt: '2024-01-14 12:00:00',
        resolution: '已与客户协商，给予200元补偿'
      }
    ],
    remarks: '搬运顺利完成',
    createdAt: '2024-01-13 09:00:00',
    updatedAt: '2024-01-14 12:00:00'
  },
  {
    id: 'a5',
    orderNo: 'BJ20240115005',
    customer: { name: '周先生', phone: '13900139005', wechat: 'zhou345' },
    fromAddress: { province: '北京', city: '北京', district: '通州区', detail: '万达广场B座' },
    toAddress: { province: '北京', city: '北京', district: '顺义区', detail: '后沙峪镇' },
    date: '2024-01-16',
    timeSlot: '15:00-17:00',
    vehicleType: '4.2米厢货',
    estimatedPrice: 1600,
    status: 'pending',
    items: [
      { id: 'i16', name: '跑步机', quantity: 1, weight: 150, volume: 1.8, fragile: false, material: '金属', remark: '需拆卸', lastConclusion: '待确认' },
      { id: 'i17', name: '健身车', quantity: 1, weight: 80, volume: 0.8, fragile: false, material: '金属', remark: '无', lastConclusion: '待确认' },
      { id: 'i18', name: '音响设备', quantity: 1, weight: 40, volume: 1.0, fragile: true, material: '电子', remark: '贵重物品', lastConclusion: '待确认' }
    ],
    exceptions: [
      {
        id: 'e3',
        appointmentId: 'a5',
        type: 'delay',
        description: '车辆因交通拥堵预计迟到30分钟',
        status: 'pending',
        createdAt: '2024-01-16 14:45:00'
      }
    ],
    remarks: '',
    createdAt: '2024-01-15 08:00:00',
    updatedAt: '2024-01-16 14:45:00'
  },
  {
    id: 'a6',
    orderNo: 'BJ20240115006',
    customer: { name: '吴女士', phone: '13900139006', wechat: 'wu678' },
    fromAddress: { province: '北京', city: '北京', district: '昌平区', detail: '回龙观小区' },
    toAddress: { province: '北京', city: '北京', district: '大兴区', detail: '亦庄开发区' },
    date: '2024-01-18',
    timeSlot: '09:00-11:00',
    vehicleType: '3.5米厢货',
    estimatedPrice: 1400,
    status: 'canceled',
    rejectReason: '客户临时改变计划，取消预约',
    items: [
      { id: 'i19', name: '衣物箱', quantity: 8, weight: 40, volume: 2.4, fragile: false, material: '纸质', remark: '日常衣物', lastConclusion: '已取消' }
    ],
    exceptions: [],
    remarks: '客户提前一天取消，已退款',
    createdAt: '2024-01-14 11:00:00',
    updatedAt: '2024-01-15 10:00:00'
  }
]

export const getTodosByRole = (role: string): TodoItem[] => {
  const todos: Record<string, TodoItem[]> = {
    dispatcher: [
      { id: 't1', type: 'appointment', title: '确认BJ20240115001预约', description: '陈先生的搬家预约待确认', priority: 'high', dueTime: '2024-01-16 09:00', appointmentId: 'a1' },
      { id: 't2', type: 'exception', title: '处理BJ20240115002临时加价', description: '客户临时增加物品需确认加价', priority: 'high', appointmentId: 'a2', exceptionId: 'e1' },
      { id: 't3', type: 'appointment', title: '安排BJ20240115003跨城搬家车辆', description: '天津搬家需提前规划', priority: 'medium', dueTime: '2024-01-17 08:00', appointmentId: 'a3' },
      { id: 't4', type: 'exception', title: '处理BJ20240115005车辆迟到', description: '通知客户车辆延误情况', priority: 'high', appointmentId: 'a5', exceptionId: 'e3' }
    ],
    team_leader: [
      { id: 't5', type: 'appointment', title: '准备BJ20240115001搬运材料', description: '检查气泡膜、包装材料是否充足', priority: 'high', dueTime: '2024-01-16 08:30', appointmentId: 'a1' },
      { id: 't6', type: 'exception', title: '处理BJ20240115002临时加价', description: '现场确认增加的物品数量', priority: 'high', appointmentId: 'a2', exceptionId: 'e1' },
      { id: 't7', type: 'appointment', title: 'BJ20240115003特殊物品搬运', description: '鱼缸和钢琴需专业处理', priority: 'medium', dueTime: '2024-01-17 07:30', appointmentId: 'a3' },
      { id: 't8', type: 'task', title: '整理BJ20240114004破损报告', description: '提交展示柜破损处理报告', priority: 'medium' }
    ],
    customer_service: [
      { id: 't9', type: 'appointment', title: '回访BJ20240114004客户', description: '确认服务满意度和破损处理结果', priority: 'medium', appointmentId: 'a4' },
      { id: 't10', type: 'exception', title: '跟进BJ20240115005迟到通知', description: '向客户致歉并说明情况', priority: 'high', appointmentId: 'a5', exceptionId: 'e3' },
      { id: 't11', type: 'task', title: '处理BJ20240115006退款', description: '已取消订单的退款处理', priority: 'medium', appointmentId: 'a6' },
      { id: 't12', type: 'appointment', title: '确认BJ20240115001特殊要求', description: '与客户确认电视包装问题', priority: 'medium', appointmentId: 'a1' }
    ]
  }
  return todos[role] || []
}

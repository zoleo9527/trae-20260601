
import { FaultTicket, User, ProcessStep } from '../types'

const generateId = () => Math.random().toString(36).substring(2, 11)

const generateTimestamp = (daysAgo: number, hours?: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  if (hours !== undefined) {
    date.setHours(date.getHours() - hours)
  }
  return date.toISOString()
}

export const mockUsers: User[] = [
  { id: 'u1', name: '张三', role: 'clerk', storeId: 's1', storeName: '中山路店' },
  { id: 'u2', name: '李四', role: 'manager', storeId: 's1', storeName: '中山路店' },
  { id: 'u3', name: '王五', role: 'admin', storeName: '片区管理员' },
]

const processHistory1: ProcessStep[] = [
  { id: 'h1', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(2, 5), remark: '终端无法打印彩票，出票口卡纸严重', role: 'clerk' },
  { id: 'h2', action: '审核通过', operator: '李四', timestamp: generateTimestamp(2, 3), role: 'manager' },
  { id: 'h3', action: '派工维修', operator: '王五', timestamp: generateTimestamp(2, 1), remark: '已安排维修人员张师傅', role: 'admin' },
]

const processHistory2: ProcessStep[] = [
  { id: 'h4', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(1, 8), remark: '触摸屏反应迟钝，多次点击无响应', role: 'clerk' },
]

const processHistory3: ProcessStep[] = [
  { id: 'h5', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(3), remark: '打印机缺纸告警灯常亮', role: 'clerk' },
  { id: 'h6', action: '审核通过', operator: '李四', timestamp: generateTimestamp(2, 12), role: 'manager' },
  { id: 'h7', action: '派工维修', operator: '王五', timestamp: generateTimestamp(2), remark: '已安排维修人员李师傅', role: 'admin' },
  { id: 'h8', action: '维修完成', operator: '维修人员', timestamp: generateTimestamp(1) },
]

const processHistory4: ProcessStep[] = [
  { id: 'h9', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(1, 10), remark: '设备运行缓慢', role: 'clerk' },
  { id: 'h10', action: '审核退回', operator: '李四', timestamp: generateTimestamp(1, 5), remark: '故障描述不够详细，请补充具体表现和发生时间段', role: 'manager' },
  { id: 'h11', action: '补充说明', operator: '张三', timestamp: generateTimestamp(1, 3), remark: '上午10点到12点期间设备明显卡顿，影响正常销售', role: 'clerk' },
  { id: 'h12', action: '审核通过', operator: '李四', timestamp: generateTimestamp(1, 2), role: 'manager' },
  { id: 'h13', action: '派工维修', operator: '王五', timestamp: generateTimestamp(1, 1), role: 'admin' },
]

const processHistory5: ProcessStep[] = [
  { id: 'h14', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(0, 3), remark: '网络连接不稳定，影响销售', role: 'clerk' },
  { id: 'h15', action: '审核通过', operator: '李四', timestamp: generateTimestamp(0, 2), role: 'manager' },
]

const processHistory6: ProcessStep[] = [
  { id: 'h16', action: '班结发现问题', operator: '张三', timestamp: generateTimestamp(0, 5), remark: '晚班交接时发现终端无法连接服务器', role: 'clerk' },
  { id: 'h17', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(0, 4), remark: '网络中断，导致无法完成班结', role: 'clerk' },
  { id: 'h18', action: '审核通过', operator: '李四', timestamp: generateTimestamp(0, 3), remark: '确认网络问题，优先处理', role: 'manager' },
  { id: 'h19', action: '派工维修', operator: '王五', timestamp: generateTimestamp(0, 2), remark: '已联系网络工程师王工', role: 'admin' },
]

const processHistory7: ProcessStep[] = [
  { id: 'h20', action: '兑奖设备异常', operator: '张三', timestamp: generateTimestamp(0, 6), remark: '顾客兑奖时设备无法读取彩票', role: 'clerk' },
  { id: 'h21', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(0, 5), remark: '兑奖扫描枪无法识别彩票二维码', role: 'clerk' },
  { id: 'h22', action: '异常提醒', operator: '系统', timestamp: generateTimestamp(0, 5), remark: '兑奖高峰期设备故障，已自动升级优先级', role: 'clerk' },
  { id: 'h23', action: '审核通过', operator: '李四', timestamp: generateTimestamp(0, 4), remark: '紧急处理，已联系维修', role: 'manager' },
  { id: 'h24', action: '派工维修', operator: '王五', timestamp: generateTimestamp(0, 3), remark: '已安排技术员紧急上门', role: 'admin' },
]

const processHistory8: ProcessStep[] = [
  { id: 'h25', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(0, 2), remark: '打印机出票模糊', role: 'clerk' },
  { id: 'h26', action: '审核退回', operator: '李四', timestamp: generateTimestamp(0, 1), remark: '请先清洁打印头，如仍有问题再提交故障单', role: 'manager' },
]

export const mockTickets: FaultTicket[] = [
  {
    id: 't1',
    deviceId: 'D001',
    deviceName: '彩票终端机A',
    storeId: 's1',
    storeName: '中山路店',
    status: 'repairing',
    priority: 'high',
    category: 'print_error',
    description: '终端无法打印彩票，出票口卡纸严重',
    remarks: '已联系维修人员张师傅，预计今天下午到达',
    createdAt: generateTimestamp(2, 5),
    updatedAt: generateTimestamp(2, 1),
    createdBy: '张三',
    assignedTo: '维修人员张师傅',
    processHistory: processHistory1,
    handoverType: 'normal_fault',
  },
  {
    id: 't2',
    deviceId: 'D002',
    deviceName: '彩票终端机B',
    storeId: 's1',
    storeName: '中山路店',
    status: 'pending',
    priority: 'medium',
    category: 'other',
    description: '触摸屏反应迟钝，多次点击无响应',
    remarks: '已经尝试重启设备，问题依旧',
    createdAt: generateTimestamp(1, 8),
    updatedAt: generateTimestamp(1, 8),
    createdBy: '张三',
    processHistory: processHistory2,
    handoverType: 'normal_fault',
  },
  {
    id: 't3',
    deviceId: 'D003',
    deviceName: '彩票终端机C',
    storeId: 's1',
    storeName: '中山路店',
    status: 'completed',
    priority: 'low',
    category: 'print_error',
    description: '打印机缺纸告警灯常亮',
    remarks: '已更换纸张，设备恢复正常',
    createdAt: generateTimestamp(3),
    updatedAt: generateTimestamp(1),
    createdBy: '张三',
    assignedTo: '维修人员李师傅',
    processHistory: processHistory3,
    handoverType: 'normal_fault',
  },
  {
    id: 't4',
    deviceId: 'D004',
    deviceName: '彩票终端机D',
    storeId: 's1',
    storeName: '中山路店',
    status: 'repairing',
    priority: 'medium',
    category: 'other',
    description: '设备运行缓慢，影响销售效率',
    remarks: '已派工，等待维修',
    createdAt: generateTimestamp(1, 10),
    updatedAt: generateTimestamp(1, 1),
    createdBy: '张三',
    assignedTo: '维修人员',
    processHistory: processHistory4,
    handoverType: 'normal_fault',
    rejectedReason: '故障描述不够详细，请补充具体表现和发生时间段',
  },
  {
    id: 't5',
    deviceId: 'D005',
    deviceName: '彩票终端机E',
    storeId: 's1',
    storeName: '中山路店',
    status: 'approved',
    priority: 'high',
    category: 'network_issue',
    description: '网络连接不稳定，影响销售',
    remarks: '网络时断时续，需要网络工程师检查',
    createdAt: generateTimestamp(0, 3),
    updatedAt: generateTimestamp(0, 2),
    createdBy: '张三',
    processHistory: processHistory5,
    handoverType: 'normal_fault',
  },
  {
    id: 't6',
    deviceId: 'D006',
    deviceName: '彩票终端机F',
    storeId: 's1',
    storeName: '中山路店',
    status: 'repairing',
    priority: 'high',
    category: 'network_issue',
    description: '网络中断，导致无法完成班结',
    remarks: '已联系网络工程师王工，正在排查',
    createdAt: generateTimestamp(0, 4),
    updatedAt: generateTimestamp(0, 2),
    createdBy: '张三',
    assignedTo: '网络工程师王工',
    processHistory: processHistory6,
    handoverType: 'shift_close',
    shiftCloseInfo: {
      shiftId: 'SC20240614003',
      shiftDate: new Date().toISOString().split('T')[0],
      shiftPeriod: 'evening',
      salesAmount: 15800,
      ticketCount: 156,
      remark: '晚班结束时发现网络问题，无法正常班结',
    },
  },
  {
    id: 't7',
    deviceId: 'D007',
    deviceName: '兑奖扫描终端',
    storeId: 's1',
    storeName: '中山路店',
    status: 'repairing',
    priority: 'high',
    category: 'prize_device',
    description: '兑奖扫描枪无法识别彩票二维码',
    remarks: '兑奖高峰期，影响顾客兑奖体验，已安排技术员紧急上门',
    createdAt: generateTimestamp(0, 5),
    updatedAt: generateTimestamp(0, 3),
    createdBy: '张三',
    assignedTo: '技术员紧急上门',
    processHistory: processHistory7,
    handoverType: 'prize_claim',
    isAlert: true,
    alertMessage: '兑奖高峰期设备故障，已自动升级优先级',
    prizeClaimInfo: {
      claimId: 'PC20240614005',
      claimDate: new Date().toISOString().split('T')[0],
      prizeLevel: '二等奖',
      prizeAmount: 5000,
      ticketId: 'TN20240614001',
      deviceUsed: true,
      remark: '顾客正在等待兑奖，请尽快处理',
    },
  },
  {
    id: 't8',
    deviceId: 'D008',
    deviceName: '彩票终端机H',
    storeId: 's1',
    storeName: '中山路店',
    status: 'rejected',
    priority: 'low',
    category: 'print_error',
    description: '打印机出票模糊',
    remarks: '请先清洁打印头，如仍有问题再提交故障单',
    createdAt: generateTimestamp(0, 2),
    updatedAt: generateTimestamp(0, 1),
    createdBy: '张三',
    processHistory: processHistory8,
    handoverType: 'normal_fault',
    rejectedReason: '请先清洁打印头，如仍有问题再提交故障单',
  },
]

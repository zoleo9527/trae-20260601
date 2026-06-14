
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
  { id: 'h1', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(2, 5), remark: '终端无法打印彩票' },
  { id: 'h2', action: '审核通过', operator: '李四', timestamp: generateTimestamp(2, 3) },
  { id: 'h3', action: '派工维修', operator: '王五', timestamp: generateTimestamp(2, 1) },
]

const processHistory2: ProcessStep[] = [
  { id: 'h4', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(1, 8) },
]

const processHistory3: ProcessStep[] = [
  { id: 'h5', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(3) },
  { id: 'h6', action: '审核通过', operator: '李四', timestamp: generateTimestamp(2, 12) },
  { id: 'h7', action: '派工维修', operator: '王五', timestamp: generateTimestamp(2) },
  { id: 'h8', action: '维修完成', operator: '维修人员', timestamp: generateTimestamp(1) },
]

const processHistory4: ProcessStep[] = [
  { id: 'h9', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(1, 10) },
  { id: 'h10', action: '审核退回', operator: '李四', timestamp: generateTimestamp(1, 5), remark: '请补充故障具体表现' },
]

const processHistory5: ProcessStep[] = [
  { id: 'h11', action: '提交故障单', operator: '张三', timestamp: generateTimestamp(0, 3) },
  { id: 'h12', action: '审核通过', operator: '李四', timestamp: generateTimestamp(0, 2) },
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
    description: '终端无法打印彩票，出票口卡纸严重',
    remarks: '已联系维修人员，预计今天下午到达',
    createdAt: generateTimestamp(2, 5),
    updatedAt: generateTimestamp(2, 1),
    createdBy: '张三',
    assignedTo: '维修人员A',
    processHistory: processHistory1,
  },
  {
    id: 't2',
    deviceId: 'D002',
    deviceName: '彩票终端机B',
    storeId: 's1',
    storeName: '中山路店',
    status: 'pending',
    priority: 'medium',
    description: '触摸屏反应迟钝，多次点击无响应',
    remarks: '已经尝试重启设备，问题依旧',
    createdAt: generateTimestamp(1, 8),
    updatedAt: generateTimestamp(1, 8),
    createdBy: '张三',
    processHistory: processHistory2,
  },
  {
    id: 't3',
    deviceId: 'D003',
    deviceName: '彩票终端机C',
    storeId: 's1',
    storeName: '中山路店',
    status: 'completed',
    priority: 'low',
    description: '打印机缺纸告警灯常亮',
    remarks: '已更换纸张，设备恢复正常',
    createdAt: generateTimestamp(3),
    updatedAt: generateTimestamp(1),
    createdBy: '张三',
    assignedTo: '维修人员B',
    processHistory: processHistory3,
  },
  {
    id: 't4',
    deviceId: 'D004',
    deviceName: '彩票终端机D',
    storeId: 's1',
    storeName: '中山路店',
    status: 'rejected',
    priority: 'medium',
    description: '设备运行缓慢',
    remarks: '故障描述不够详细，需要补充',
    createdAt: generateTimestamp(1, 10),
    updatedAt: generateTimestamp(1, 5),
    createdBy: '张三',
    processHistory: processHistory4,
  },
  {
    id: 't5',
    deviceId: 'D005',
    deviceName: '彩票终端机E',
    storeId: 's1',
    storeName: '中山路店',
    status: 'approved',
    priority: 'high',
    description: '网络连接不稳定，影响销售',
    remarks: '网络时断时续，需要网络工程师检查',
    createdAt: generateTimestamp(0, 3),
    updatedAt: generateTimestamp(0, 2),
    createdBy: '张三',
    processHistory: processHistory5,
  },
]

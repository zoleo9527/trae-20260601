import type { Staff, Banquet, TableChangeRequest, ShortageRecord, TableConfig } from '../types'

export const tableConfigs: Record<string, TableConfig> = {
  adult: {
    type: 'adult',
    seats: 10,
    pricePerTable: 2888,
    dishQuantity: 12,
  },
  child: {
    type: 'child',
    seats: 8,
    pricePerTable: 1888,
    dishQuantity: 8,
  },
  vip: {
    type: 'vip',
    seats: 12,
    pricePerTable: 5888,
    dishQuantity: 16,
  },
}

export const staffList: Staff[] = [
  {
    id: 'S001',
    name: '张伟',
    role: 'hall_manager',
    phone: '138****1234',
  },
  {
    id: 'S002',
    name: '李明',
    role: 'hall_manager',
    phone: '139****5678',
  },
  {
    id: 'S003',
    name: '王大厨',
    role: 'chef',
    phone: '137****9012',
  },
  {
    id: 'S004',
    name: '陈主厨',
    role: 'chef',
    phone: '136****3456',
  },
  {
    id: 'S005',
    name: '刘芳',
    role: 'sales',
    phone: '135****7890',
  },
  {
    id: 'S006',
    name: '赵静',
    role: 'cashier',
    phone: '134****2345',
  },
  {
    id: 'S007',
    name: '孙丽',
    role: 'waiter',
    phone: '133****6789',
  },
]

export const roleNames: Record<string, string> = {
  hall_manager: '厅面主管',
  chef: '厨师长',
  sales: '销售经理',
  cashier: '收银员',
  waiter: '服务员',
}

export const statusNames: Record<string, string> = {
  preparing: '准备中',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

export const changeTypeNames: Record<string, string> = {
  add_tables: '增加桌数',
  change_table_type: '桌型变更',
  remove_tables: '减少桌数',
}

export const changeStatusNames: Record<string, string> = {
  pending_kitchen: '待厨房确认',
  pending_fee: '待费用确认',
  approved: '已通过',
  rejected_by_kitchen: '厨房拒绝',
  rejected_by_fee: '费用拒绝',
  cancelled: '已取消',
}

export const notificationStatusNames: Record<string, string> = {
  notified: '已通知',
  not_notified: '未通知',
  acknowledged: '已确认收到',
}

export const tableTypeNames: Record<string, string> = {
  adult: '成人桌',
  child: '儿童桌',
  vip: 'VIP桌',
}

export const banquetList: Banquet[] = [
  {
    id: 'B20260603001',
    name: '张先生&李小姐婚礼晚宴',
    customerName: '张先生',
    customerPhone: '138****8888',
    date: '2026-06-03',
    startTime: '18:00',
    endTime: '21:00',
    hall: '宴会厅A',
    originalTables: 20,
    currentTables: 22,
    tableType: 'adult',
    tableConfig: tableConfigs.adult,
    status: 'in_progress',
    deposit: 30000,
    totalAmount: 63536,
    paidAmount: 30000,
    waitersAssigned: 8,
    menuId: 'M001',
    menuName: '百年好合婚宴套餐',
    createTime: '2026-05-20 10:30:00',
    updateTime: '2026-06-03 17:45:00',
    remarks: '临开席加2桌，客人朋友临时到场',
  },
  {
    id: 'B20260603002',
    name: '王总公子满月酒',
    customerName: '王总',
    customerPhone: '139****9999',
    date: '2026-06-03',
    startTime: '12:00',
    endTime: '15:00',
    hall: '宴会厅B',
    originalTables: 15,
    currentTables: 15,
    tableType: 'adult',
    tableConfig: tableConfigs.adult,
    status: 'completed',
    deposit: 20000,
    totalAmount: 43320,
    paidAmount: 43320,
    waitersAssigned: 6,
    menuId: 'M002',
    menuName: '弥月之喜套餐',
    createTime: '2026-05-25 14:00:00',
    updateTime: '2026-06-03 15:30:00',
    remarks: '原预订1桌儿童桌改为成人桌，小朋友不多',
  },
  {
    id: 'B20260604001',
    name: '刘氏家族寿宴',
    customerName: '刘先生',
    customerPhone: '137****7777',
    date: '2026-06-04',
    startTime: '18:00',
    endTime: '21:00',
    hall: '宴会厅A',
    originalTables: 25,
    currentTables: 28,
    tableType: 'adult',
    tableConfig: tableConfigs.adult,
    status: 'preparing',
    deposit: 40000,
    totalAmount: 80864,
    paidAmount: 40000,
    waitersAssigned: 10,
    menuId: 'M003',
    menuName: '福寿绵长寿宴套餐',
    createTime: '2026-05-15 09:00:00',
    updateTime: '2026-06-03 16:00:00',
    remarks: '加3桌申请中，厨房确认部分食材不足',
  },
  {
    id: 'B20260605001',
    name: '公司年会晚宴',
    customerName: '科技有限公司',
    customerPhone: '136****6666',
    date: '2026-06-05',
    startTime: '19:00',
    endTime: '22:00',
    hall: '宴会厅C',
    originalTables: 30,
    currentTables: 30,
    tableType: 'adult',
    tableConfig: tableConfigs.adult,
    status: 'preparing',
    deposit: 50000,
    totalAmount: 86640,
    paidAmount: 50000,
    waitersAssigned: 12,
    menuId: 'M004',
    menuName: '大展宏图商务套餐',
    createTime: '2026-05-10 16:30:00',
    updateTime: '2026-06-02 11:00:00',
  },
]

export const changeRequestList: TableChangeRequest[] = [
  {
    id: 'CR20260603001',
    banquetId: 'B20260603001',
    banquetName: '张先生&李小姐婚礼晚宴',
    changeType: 'add_tables',
    changeTypeLabel: '临开席加两桌',
    originalTables: 20,
    newTables: 22,
    tableCountChange: 2,
    reason: '客人朋友临时到场，预计多20人左右，需要增加2桌',
    impact: {
      dishQuantity: 264,
      dishQuantityChange: 24,
      servingSpeed: 15,
      servingSpeedChange: 5,
      waitersRequired: 8,
      waitersChange: 2,
      totalAmount: 63536,
      amountChange: 5776,
      kitchenNotified: 'acknowledged',
    },
    status: 'approved',
    statusLabel: '已通过',
    applicant: staffList[0],
    kitchenConfirmer: staffList[2],
    kitchenConfirmTime: '2026-06-03 17:35:00',
    kitchenRemark: '食材储备充足，可以备餐，上菜时间可能延迟15分钟',
    feeConfirmer: staffList[5],
    feeConfirmTime: '2026-06-03 17:40:00',
    feeRemark: '按2桌成人桌标准收费，增加5776元，已通知客户',
    kitchenNotified: 'acknowledged',
    kitchenNotifiedTime: '2026-06-03 17:30:00',
    kitchenNotifiedBy: staffList[0],
    createTime: '2026-06-03 17:28:00',
    updateTime: '2026-06-03 17:45:00',
  },
  {
    id: 'CR20260603002',
    banquetId: 'B20260603002',
    banquetName: '王总公子满月酒',
    changeType: 'change_table_type',
    changeTypeLabel: '儿童桌改成人桌',
    originalTables: 1,
    newTables: 1,
    tableCountChange: 0,
    originalTableType: 'child',
    newTableType: 'adult',
    reason: '实际到场小朋友只有3人，家长希望改为成人桌一起坐',
    impact: {
      dishQuantity: 12,
      dishQuantityChange: 4,
      servingSpeed: 10,
      servingSpeedChange: 0,
      waitersRequired: 6,
      waitersChange: 0,
      totalAmount: 43320,
      amountChange: 1000,
      kitchenNotified: 'acknowledged',
    },
    status: 'approved',
    statusLabel: '已通过',
    applicant: staffList[1],
    kitchenConfirmer: staffList[3],
    kitchenConfirmTime: '2026-06-03 11:15:00',
    kitchenRemark: '可以调整，儿童餐食材已准备，可转为备用',
    feeConfirmer: staffList[4],
    feeConfirmTime: '2026-06-03 11:20:00',
    feeRemark: '补差价1000元，客户已同意',
    kitchenNotified: 'acknowledged',
    kitchenNotifiedTime: '2026-06-03 11:10:00',
    kitchenNotifiedBy: staffList[1],
    createTime: '2026-06-03 11:08:00',
    updateTime: '2026-06-03 11:25:00',
  },
  {
    id: 'CR20260603003',
    banquetId: 'B20260604001',
    banquetName: '刘氏家族寿宴',
    changeType: 'add_tables',
    changeTypeLabel: '加3桌厨房拒绝加菜量',
    originalTables: 25,
    newTables: 28,
    tableCountChange: 3,
    reason: '寿宴宾客比预期多，需要加3桌',
    impact: {
      dishQuantity: 336,
      dishQuantityChange: 36,
      servingSpeed: 20,
      servingSpeedChange: 8,
      waitersRequired: 11,
      waitersChange: 1,
      totalAmount: 80864,
      amountChange: 8664,
      kitchenNotified: 'notified',
    },
    status: 'rejected_by_kitchen',
    statusLabel: '厨房拒绝',
    applicant: staffList[0],
    kitchenConfirmer: staffList[2],
    kitchenConfirmTime: '2026-06-03 16:30:00',
    kitchenRemark: '龙虾、鲍鱼、辽参等高档食材备货不足，最多只能加1桌。建议客人调整菜品或接受部分菜品替换。',
    kitchenNotified: 'notified',
    kitchenNotifiedTime: '2026-06-03 16:15:00',
    kitchenNotifiedBy: staffList[0],
    createTime: '2026-06-03 16:10:00',
    updateTime: '2026-06-03 16:35:00',
  },
  {
    id: 'CR20260603004',
    banquetId: 'B20260604001',
    banquetName: '刘氏家族寿宴',
    changeType: 'add_tables',
    changeTypeLabel: '加1桌（厨房拒绝后调整）',
    originalTables: 25,
    newTables: 26,
    tableCountChange: 1,
    reason: '根据厨房备货情况，调整为加1桌',
    impact: {
      dishQuantity: 312,
      dishQuantityChange: 12,
      servingSpeed: 15,
      servingSpeedChange: 3,
      waitersRequired: 10,
      waitersChange: 0,
      totalAmount: 75188,
      amountChange: 2888,
      kitchenNotified: 'acknowledged',
    },
    status: 'pending_fee',
    statusLabel: '待费用确认',
    applicant: staffList[0],
    kitchenConfirmer: staffList[2],
    kitchenConfirmTime: '2026-06-03 16:50:00',
    kitchenRemark: '1桌可以安排，食材充足',
    kitchenNotified: 'acknowledged',
    kitchenNotifiedTime: '2026-06-03 16:45:00',
    kitchenNotifiedBy: staffList[0],
    createTime: '2026-06-03 16:40:00',
    updateTime: '2026-06-03 16:55:00',
  },
]

export const shortageRecordList: ShortageRecord[] = [
  {
    id: 'SR20260603001',
    banquetId: 'B20260604001',
    banquetName: '刘氏家族寿宴',
    dishName: '澳洲龙虾',
    requiredQuantity: 28,
    availableQuantity: 26,
    shortageQuantity: 2,
    unit: '只',
    reportedBy: staffList[2],
    reportedTime: '2026-06-03 16:25:00',
    status: 'pending',
    remarks: '因客户临时加3桌导致缺货，已告知销售与客户沟通',
  },
  {
    id: 'SR20260603002',
    banquetId: 'B20260604001',
    banquetName: '刘氏家族寿宴',
    dishName: '鲍鱼（6头）',
    requiredQuantity: 336,
    availableQuantity: 310,
    shortageQuantity: 26,
    unit: '个',
    reportedBy: staffList[3],
    reportedTime: '2026-06-03 16:28:00',
    status: 'pending',
    remarks: '6头鲍鱼缺货，可提供8头鲍鱼替代，价格不变',
  },
  {
    id: 'SR20260603003',
    banquetId: 'B20260603001',
    banquetName: '张先生&李小姐婚礼晚宴',
    dishName: '基围虾',
    requiredQuantity: 22,
    availableQuantity: 22,
    shortageQuantity: 0,
    unit: '斤',
    reportedBy: staffList[2],
    reportedTime: '2026-06-03 17:36:00',
    status: 'resolved',
    resolvedTime: '2026-06-03 17:40:00',
    resolvedBy: staffList[2],
    resolution: '紧急从市场调货2斤，已到货',
  },
  {
    id: 'SR20260603004',
    dishName: '松露',
    requiredQuantity: 500,
    availableQuantity: 100,
    shortageQuantity: 400,
    unit: '克',
    reportedBy: staffList[3],
    reportedTime: '2026-06-03 10:00:00',
    status: 'partially_resolved',
    resolvedTime: '2026-06-03 14:00:00',
    resolvedBy: staffList[2],
    resolution: '已采购200克，剩余200克用本地蘑菇替代，已通知客户',
    remarks: '影响B20260603002和B20260604001两个宴会',
  },
]

export const calculateLinkageImpact = (
  originalTables: number,
  newTables: number,
  originalType: string,
  newType: string,
  currentTotal: number,
  currentWaiters: number,
): {
  dishQuantity: number
  dishQuantityChange: number
  servingSpeed: number
  servingSpeedChange: number
  waitersRequired: number
  waitersChange: number
  totalAmount: number
  amountChange: number
} => {
  const originalConfig = tableConfigs[originalType]
  const newConfig = tableConfigs[newType]

  const originalDishQuantity = originalTables * originalConfig.dishQuantity
  const newDishQuantity = newTables * newConfig.dishQuantity

  const originalAmount = originalTables * originalConfig.pricePerTable
  const newAmount = newTables * newConfig.pricePerTable

  const baseSpeed = 10
  const speedIncreasePerTable = 2
  const originalSpeed = baseSpeed + Math.floor(originalTables / 5) * speedIncreasePerTable
  const newSpeed = baseSpeed + Math.floor(newTables / 5) * speedIncreasePerTable

  const baseWaiters = 4
  const waitersPer5Tables = 1
  const originalWaitersRequired = baseWaiters + Math.floor(originalTables / 5) * waitersPer5Tables
  const newWaitersRequired = baseWaiters + Math.floor(newTables / 5) * waitersPer5Tables

  const amountDifference = newAmount - originalAmount
  const newTotal = currentTotal + amountDifference

  return {
    dishQuantity: newDishQuantity,
    dishQuantityChange: newDishQuantity - originalDishQuantity,
    servingSpeed: newSpeed,
    servingSpeedChange: newSpeed - originalSpeed,
    waitersRequired: newWaitersRequired,
    waitersChange: newWaitersRequired - originalWaitersRequired,
    totalAmount: newTotal,
    amountChange: amountDifference,
  }
}

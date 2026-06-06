import type {
  User,
  InventoryItem,
  Screening,
  TodoItem,
  RiskItem,
  OperationLog,
  ExceptionRecord,
} from '@/types'

const DB_KEY = 'cinema_operations_db_v2'

export interface Database {
  users: User[]
  inventoryItems: InventoryItem[]
  screenings: Screening[]
  todos: TodoItem[]
  risks: RiskItem[]
  operationLogs: OperationLog[]
  exceptions: ExceptionRecord[]
  _initialized: boolean
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const now = new Date()
const today = now.toISOString().split('T')[0]

const seedData = (): Database => {
  const users: User[] = [
    { id: 'u1', name: '张小明', role: 'frontline' },
    { id: 'u2', name: '李经理', role: 'manager' },
    { id: 'u3', name: '王总监', role: 'admin' },
  ]

  const inventoryItems: InventoryItem[] = [
    {
      id: 'inv1',
      productName: '爆米花（大桶）',
      sku: 'POP-001',
      currentStock: 120,
      expectedStock: 150,
      discrepancy: -30,
      status: 'in_progress',
      category: '食品',
      unit: '桶',
      lastCountTime: `${today} 09:30:00`,
      handlerId: 'u1',
      handlerName: '张小明',
      remarks: [],
      attachments: [],
      createdAt: `${today} 09:00:00`,
      updatedAt: `${today} 10:15:00`,
      relatedScreeningIds: ['scr1', 'scr2'],
    },
    {
      id: 'inv2',
      productName: '可口可乐（中杯）',
      sku: 'COKE-002',
      currentStock: 200,
      expectedStock: 200,
      discrepancy: 0,
      status: 'resolved',
      category: '饮料',
      unit: '杯',
      lastCountTime: `${today} 08:45:00`,
      handlerId: 'u1',
      handlerName: '张小明',
      remarks: [],
      attachments: [],
      createdAt: `${today} 08:30:00`,
      updatedAt: `${today} 09:00:00`,
      relatedScreeningIds: ['scr1'],
    },
    {
      id: 'inv3',
      productName: '3D眼镜',
      sku: 'GLASS-003',
      currentStock: 85,
      expectedStock: 120,
      discrepancy: -35,
      status: 'escalated',
      category: '配件',
      unit: '副',
      lastCountTime: `${today} 10:00:00`,
      handlerId: 'u2',
      handlerName: '李经理',
      remarks: [],
      attachments: [],
      createdAt: `${today} 09:30:00`,
      updatedAt: `${today} 10:30:00`,
      relatedScreeningIds: ['scr2', 'scr3'],
    },
    {
      id: 'inv4',
      productName: '哈根达斯冰淇淋',
      sku: 'ICEC-004',
      currentStock: 45,
      expectedStock: 60,
      discrepancy: -15,
      status: 'pending',
      category: '食品',
      unit: '杯',
      lastCountTime: `${today} 11:00:00`,
      remarks: [],
      attachments: [],
      createdAt: `${today} 10:30:00`,
      updatedAt: `${today} 11:00:00`,
      relatedScreeningIds: [],
    },
  ]

  const screenings: Screening[] = [
    {
      id: 'scr1',
      movieName: '流浪地球3',
      startTime: `${today} 10:00:00`,
      endTime: `${today} 12:20:00`,
      originalHall: '1号厅',
      currentHall: '1号厅',
      totalTickets: 200,
      soldTickets: 180,
      groupTickets: 50,
      groupRedeemed: 32,
      status: 'normal',
      isHallChanged: false,
      hasEquipmentFailure: false,
      refundCount: 0,
      remarks: [],
      attachments: [],
      operatorId: 'u1',
      operatorName: '张小明',
      createdAt: `${today} 08:00:00`,
      updatedAt: `${today} 09:30:00`,
      inventoryIds: ['inv1', 'inv2'],
      syncedRemarks: [],
      syncedAttachments: [],
    },
    {
      id: 'scr2',
      movieName: '复仇者联盟：终局之战',
      startTime: `${today} 13:00:00`,
      endTime: `${today} 16:00:00`,
      originalHall: '2号厅',
      currentHall: '3号厅',
      totalTickets: 250,
      soldTickets: 240,
      groupTickets: 100,
      groupRedeemed: 65,
      status: 'hall_changed',
      isHallChanged: true,
      hasEquipmentFailure: false,
      refundCount: 5,
      remarks: [],
      attachments: [],
      operatorId: 'u2',
      operatorName: '李经理',
      createdAt: `${today} 09:00:00`,
      updatedAt: `${today} 12:00:00`,
      inventoryIds: ['inv1', 'inv3'],
      syncedRemarks: [],
      syncedAttachments: [],
    },
    {
      id: 'scr3',
      movieName: '哪吒之魔童闹海',
      startTime: `${today} 14:30:00`,
      endTime: `${today} 16:30:00`,
      originalHall: 'IMAX厅',
      currentHall: 'IMAX厅',
      totalTickets: 300,
      soldTickets: 280,
      groupTickets: 0,
      groupRedeemed: 0,
      status: 'equipment_failure',
      isHallChanged: false,
      hasEquipmentFailure: true,
      refundCount: 45,
      remarks: [],
      attachments: [],
      operatorId: 'u2',
      operatorName: '李经理',
      createdAt: `${today} 10:00:00`,
      updatedAt: `${today} 14:00:00`,
      inventoryIds: ['inv3'],
      syncedRemarks: [],
      syncedAttachments: [],
    },
    {
      id: 'scr4',
      movieName: '速度与激情11',
      startTime: `${today} 19:00:00`,
      endTime: `${today} 21:15:00`,
      originalHall: '4号厅',
      currentHall: '4号厅',
      totalTickets: 180,
      soldTickets: 120,
      groupTickets: 80,
      groupRedeemed: 0,
      status: 'normal',
      isHallChanged: false,
      hasEquipmentFailure: false,
      refundCount: 0,
      remarks: [],
      attachments: [],
      createdAt: `${today} 11:00:00`,
      updatedAt: `${today} 11:00:00`,
      inventoryIds: [],
      syncedRemarks: [],
      syncedAttachments: [],
    },
  ]

  const todos: TodoItem[] = [
    {
      id: 'todo1',
      title: '核对 3D 眼镜库存差异',
      description: '库存少了 35 副 3D 眼镜，需要查明原因',
      priority: 'high',
      assigneeId: 'u1',
      assigneeName: '张小明',
      dueTime: `${today} 15:00:00`,
      completed: false,
      relatedType: 'inventory',
      relatedId: 'inv3',
      createdAt: `${today} 10:30:00`,
    },
    {
      id: 'todo2',
      title: '处理 IMAX 厅设备故障退票',
      description: 'IMAX 厅放映机故障，已退票 45 张，需跟进后续',
      priority: 'high',
      assigneeId: 'u1',
      assigneeName: '张小明',
      dueTime: `${today} 16:00:00`,
      completed: false,
      relatedType: 'screening',
      relatedId: 'scr3',
      createdAt: `${today} 14:00:00`,
    },
    {
      id: 'todo3',
      title: '确认复仇者联盟换厅后的观众安置',
      description: '从 2 号厅换到 3 号厅，需确认所有观众已通知到位',
      priority: 'medium',
      assigneeId: 'u1',
      assigneeName: '张小明',
      dueTime: `${today} 12:30:00`,
      completed: true,
      relatedType: 'screening',
      relatedId: 'scr2',
      createdAt: `${today} 11:30:00`,
    },
    {
      id: 'todo4',
      title: '爆米花库存补充申请',
      description: '大桶爆米花库存不足，需申请补充',
      priority: 'medium',
      assigneeId: 'u1',
      assigneeName: '张小明',
      dueTime: `${today} 17:00:00`,
      completed: false,
      relatedType: 'inventory',
      relatedId: 'inv1',
      createdAt: `${today} 10:15:00`,
    },
    {
      id: 'todo5',
      title: '核对晚间场次团体票核销',
      description: '速度与激情 11 有 80 张团体票待核销',
      priority: 'low',
      assigneeId: 'u1',
      assigneeName: '张小明',
      dueTime: `${today} 19:00:00`,
      completed: false,
      relatedType: 'screening',
      relatedId: 'scr4',
      createdAt: `${today} 12:00:00`,
    },
  ]

  const risks: RiskItem[] = [
    {
      id: 'risk1',
      title: 'IMAX 厅设备故障影响晚间场次',
      description: '放映机故障尚未完全修复，可能影响 19:30 的 IMAX 场次',
      level: 'critical',
      status: 'mitigating',
      relatedType: 'screening',
      relatedId: 'scr3',
      createdAt: `${today} 14:30:00`,
    },
    {
      id: 'risk2',
      title: '3D 眼镜丢失率异常',
      description: '近一周 3D 眼镜累计丢失 87 副，远超正常水平',
      level: 'high',
      status: 'open',
      relatedType: 'inventory',
      relatedId: 'inv3',
      createdAt: `${today} 10:45:00`,
    },
    {
      id: 'risk3',
      title: '团体票核销流程不规范',
      description: '发现多笔团体票核销记录混乱，存在重复核销风险',
      level: 'high',
      status: 'open',
      relatedType: 'screening',
      relatedId: 'scr2',
      createdAt: `${today} 13:00:00`,
    },
    {
      id: 'risk4',
      title: '爆米花库存周转天数不足',
      description: '当前库存仅够支撑 2 天，周末可能缺货',
      level: 'medium',
      status: 'open',
      relatedType: 'inventory',
      relatedId: 'inv1',
      createdAt: `${today} 11:00:00`,
    },
  ]

  const exceptions: ExceptionRecord[] = [
    {
      id: 'ex1',
      type: 'hall_change',
      title: '复仇者联盟临时换厅',
      description: '2号厅空调故障，临时将13:00场次移至3号厅',
      screeningId: 'scr2',
      status: 'resolved',
      handlerId: 'u2',
      handlerName: '李经理',
      remarks: [],
      attachments: [],
      createdAt: `${today} 12:00:00`,
      updatedAt: `${today} 12:30:00`,
    },
    {
      id: 'ex2',
      type: 'equipment_failure',
      title: 'IMAX厅放映机故障',
      description: '放映机灯泡过热保护，导致14:30场次延迟开场',
      screeningId: 'scr3',
      status: 'handling',
      handlerId: 'u2',
      handlerName: '李经理',
      remarks: [],
      attachments: [],
      createdAt: `${today} 14:15:00`,
      updatedAt: `${today} 14:45:00`,
    },
    {
      id: 'ex3',
      type: 'group_ticket',
      title: '企业团购核销异常',
      description: '某企业团购50张票，实际到场65人，现场核销混乱',
      screeningId: 'scr2',
      status: 'handling',
      handlerId: 'u1',
      handlerName: '张小明',
      remarks: [],
      attachments: [],
      createdAt: `${today} 13:30:00`,
      updatedAt: `${today} 14:00:00`,
    },
  ]

  const operationLogs: OperationLog[] = [
    {
      id: 'log1',
      action: 'hall_changed',
      description: '将场次 scr2 从 2号厅 更换至 3号厅',
      operatorId: 'u2',
      operatorName: '李经理',
      operatorRole: 'manager',
      targetType: 'screening',
      targetId: 'scr2',
      timestamp: `${today} 12:00:00`,
      changes: { currentHall: { old: '2号厅', new: '3号厅' } },
    },
    {
      id: 'log2',
      action: 'equipment_failure',
      description: '记录场次 scr3 设备故障',
      operatorId: 'u2',
      operatorName: '李经理',
      operatorRole: 'manager',
      targetType: 'screening',
      targetId: 'scr3',
      timestamp: `${today} 14:15:00`,
    },
    {
      id: 'log3',
      action: 'refund_processed',
      description: '处理场次 scr3 退票 45 张',
      operatorId: 'u2',
      operatorName: '李经理',
      operatorRole: 'manager',
      targetType: 'screening',
      targetId: 'scr3',
      timestamp: `${today} 14:30:00`,
    },
    {
      id: 'log4',
      action: 'inventory_status_updated',
      description: '将库存 inv3 状态更新为 escalated',
      operatorId: 'u2',
      operatorName: '李经理',
      operatorRole: 'manager',
      targetType: 'inventory',
      targetId: 'inv3',
      timestamp: `${today} 10:30:00`,
      changes: { status: { old: 'pending', new: 'escalated' } },
    },
    {
      id: 'log5',
      action: 'todo_completed',
      description: '完成待办：确认复仇者联盟换厅后的观众安置',
      operatorId: 'u1',
      operatorName: '张小明',
      operatorRole: 'frontline',
      targetType: 'user',
      targetId: 'u1',
      timestamp: `${today} 12:20:00`,
    },
  ]

  return {
    users,
    inventoryItems,
    screenings,
    todos,
    risks,
    operationLogs,
    exceptions,
    _initialized: true,
  }
}

export class DatabaseService {
  private db: Database

  constructor() {
    this.db = this.load()
  }

  private load(): Database {
    try {
      const stored = localStorage.getItem(DB_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to load database from localStorage:', e)
    }
    const fresh = seedData()
    this.save(fresh)
    return fresh
  }

  private save(db: Database): void {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    } catch (e) {
      console.error('Failed to save database to localStorage:', e)
    }
  }

  public getState(): Database {
    return { ...this.db }
  }

  public setState(updater: (db: Database) => Database): void {
    this.db = updater(this.db)
    this.save(this.db)
  }

  public generateId(): string {
    return generateId()
  }

  public reset(): void {
    this.db = seedData()
    this.save(this.db)
  }
}

export const db = new DatabaseService()

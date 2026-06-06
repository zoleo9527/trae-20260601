import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'frontline' | 'manager' | 'admin'

export type InventoryStatus = 'pending' | 'in_progress' | 'resolved' | 'escalated'
export type ScreeningStatus = 'normal' | 'hall_changed' | 'equipment_failure' | 'refund_issue' | 'completed'
export type TodoPriority = 'high' | 'medium' | 'low'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
}

export interface InventoryItem {
  id: string
  productName: string
  sku: string
  currentStock: number
  expectedStock: number
  discrepancy: number
  status: InventoryStatus
  category: string
  unit: string
  lastCountTime: string
  handlerId?: string
  handlerName?: string
  remarks: Remark[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
  relatedScreeningIds: string[]
}

export interface Screening {
  id: string
  movieName: string
  startTime: string
  endTime: string
  originalHall: string
  currentHall: string
  totalTickets: number
  soldTickets: number
  groupTickets: number
  groupRedeemed: number
  status: ScreeningStatus
  isHallChanged: boolean
  hasEquipmentFailure: boolean
  refundCount: number
  remarks: Remark[]
  attachments: Attachment[]
  operatorId?: string
  operatorName?: string
  createdAt: string
  updatedAt: string
  inventoryIds: string[]
}

export interface Remark {
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole: Role
  createdAt: string
  type: 'inventory' | 'screening' | 'exception'
  sourceId: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  sourceType: 'inventory' | 'screening' | 'exception'
  sourceId: string
}

export interface TodoItem {
  id: string
  title: string
  description: string
  priority: TodoPriority
  assigneeId: string
  assigneeName: string
  dueTime: string
  completed: boolean
  relatedType?: 'inventory' | 'screening' | 'exception'
  relatedId?: string
  createdAt: string
}

export interface RiskItem {
  id: string
  title: string
  description: string
  level: RiskLevel
  status: 'open' | 'mitigating' | 'resolved'
  relatedType?: 'inventory' | 'screening'
  relatedId?: string
  createdAt: string
  resolvedAt?: string
}

export interface OperationLog {
  id: string
  action: string
  description: string
  operatorId: string
  operatorName: string
  operatorRole: Role
  targetType: 'inventory' | 'screening' | 'exception' | 'user'
  targetId: string
  timestamp: string
  changes?: Record<string, { old: unknown; new: unknown }>
}

export interface ExceptionRecord {
  id: string
  type: 'hall_change' | 'group_ticket' | 'equipment_failure' | 'refund' | 'inventory'
  title: string
  description: string
  screeningId?: string
  inventoryId?: string
  status: 'pending' | 'handling' | 'resolved'
  handlerId?: string
  handlerName?: string
  remarks: Remark[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

interface AppState {
  currentUser: User
  users: User[]
  inventoryItems: InventoryItem[]
  screenings: Screening[]
  todos: TodoItem[]
  risks: RiskItem[]
  operationLogs: OperationLog[]
  exceptions: ExceptionRecord[]
  
  switchRole: (role: Role) => void
  addRemark: (params: {
    sourceType: 'inventory' | 'screening' | 'exception'
    sourceId: string
    content: string
  }) => void
  addAttachment: (params: {
    sourceType: 'inventory' | 'screening' | 'exception'
    sourceId: string
    file: { name: string; type: string; size: number }
  }) => void
  updateInventoryStatus: (id: string, status: InventoryStatus, handlerId: string, handlerName: string) => void
  updateScreeningStatus: (id: string, status: ScreeningStatus, operatorId: string, operatorName: string) => void
  changeHall: (screeningId: string, newHall: string, operatorId: string, operatorName: string, reason: string) => void
  recordEquipmentFailure: (screeningId: string, description: string, operatorId: string, operatorName: string) => void
  processRefund: (screeningId: string, count: number, reason: string, operatorId: string, operatorName: string) => void
  redeemGroupTicket: (screeningId: string, count: number, operatorId: string, operatorName: string) => void
  completeTodo: (id: string) => void
  resolveRisk: (id: string) => void
  linkInventoryToScreening: (inventoryId: string, screeningId: string) => void
  addOperationLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void
  createException: (exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'updatedAt' | 'remarks' | 'attachments'>) => string
  updateExceptionStatus: (id: string, status: ExceptionRecord['status'], handlerId: string, handlerName: string) => void
  getScreeningById: (id: string) => Screening | undefined
  getInventoryById: (id: string) => InventoryItem | undefined
  getExceptionById: (id: string) => ExceptionRecord | undefined
  getRemarksBySource: (sourceType: 'inventory' | 'screening' | 'exception', sourceId: string) => Remark[]
  getRecentChanges: () => OperationLog[]
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const initialUsers: User[] = [
  { id: 'u1', name: '张小明', role: 'frontline' },
  { id: 'u2', name: '李经理', role: 'manager' },
  { id: 'u3', name: '王总监', role: 'admin' },
]

const now = new Date()
const today = now.toISOString().split('T')[0]

const initialInventoryItems: InventoryItem[] = [
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

const initialScreenings: Screening[] = [
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
  },
]

const initialTodos: TodoItem[] = [
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

const initialRisks: RiskItem[] = [
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

const initialExceptions: ExceptionRecord[] = [
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

const initialOperationLogs: OperationLog[] = [
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: initialUsers[0],
      users: initialUsers,
      inventoryItems: initialInventoryItems,
      screenings: initialScreenings,
      todos: initialTodos,
      risks: initialRisks,
      operationLogs: initialOperationLogs,
      exceptions: initialExceptions,

      switchRole: (role) => {
        const currentUser = get().currentUser
        set({ currentUser: { ...currentUser, role } })
        get().addOperationLog({
          action: 'role_switched',
          description: `切换角色为 ${role === 'frontline' ? '一线员工' : role === 'manager' ? '经理' : '管理员'}`,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: role,
          targetType: 'user',
          targetId: currentUser.id,
        })
      },

      addRemark: ({ sourceType, sourceId, content }) => {
        const { currentUser } = get()
        const remark: Remark = {
          id: generateId(),
          content,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          createdAt: new Date().toISOString(),
          type: sourceType,
          sourceId,
        }

        if (sourceType === 'inventory') {
          set((state) => ({
            inventoryItems: state.inventoryItems.map((item) =>
              item.id === sourceId
                ? { ...item, remarks: [...item.remarks, remark], updatedAt: new Date().toISOString() }
                : item
            ),
          }))
        } else if (sourceType === 'screening') {
          set((state) => ({
            screenings: state.screenings.map((s) =>
              s.id === sourceId
                ? { ...s, remarks: [...s.remarks, remark], updatedAt: new Date().toISOString() }
                : s
            ),
          }))
        } else if (sourceType === 'exception') {
          set((state) => ({
            exceptions: state.exceptions.map((e) =>
              e.id === sourceId
                ? { ...e, remarks: [...e.remarks, remark], updatedAt: new Date().toISOString() }
                : e
            ),
          }))
        }

        get().addOperationLog({
          action: 'remark_added',
          description: `添加备注: ${content.slice(0, 50)}`,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          targetType: sourceType,
          targetId: sourceId,
        })
      },

      addAttachment: ({ sourceType, sourceId, file }) => {
        const { currentUser } = get()
        const attachment: Attachment = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedBy: currentUser.name,
          uploadedAt: new Date().toISOString(),
          sourceType,
          sourceId,
        }

        if (sourceType === 'inventory') {
          set((state) => ({
            inventoryItems: state.inventoryItems.map((item) =>
              item.id === sourceId
                ? { ...item, attachments: [...item.attachments, attachment], updatedAt: new Date().toISOString() }
                : item
            ),
          }))
        } else if (sourceType === 'screening') {
          set((state) => ({
            screenings: state.screenings.map((s) =>
              s.id === sourceId
                ? { ...s, attachments: [...s.attachments, attachment], updatedAt: new Date().toISOString() }
                : s
            ),
          }))
        } else if (sourceType === 'exception') {
          set((state) => ({
            exceptions: state.exceptions.map((e) =>
              e.id === sourceId
                ? { ...e, attachments: [...e.attachments, attachment], updatedAt: new Date().toISOString() }
                : e
            ),
          }))
        }

        get().addOperationLog({
          action: 'attachment_uploaded',
          description: `上传附件: ${file.name}`,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          targetType: sourceType,
          targetId: sourceId,
        })
      },

      updateInventoryStatus: (id, status, handlerId, handlerName) => {
        const oldStatus = get().inventoryItems.find((i) => i.id === id)?.status
        set((state) => ({
          inventoryItems: state.inventoryItems.map((item) =>
            item.id === id
              ? { ...item, status, handlerId, handlerName, updatedAt: new Date().toISOString() }
              : item
          ),
        }))
        get().addOperationLog({
          action: 'inventory_status_updated',
          description: `更新库存状态从 ${oldStatus} 到 ${status}`,
          operatorId: handlerId,
          operatorName: handlerName,
          operatorRole: get().currentUser.role,
          targetType: 'inventory',
          targetId: id,
          changes: { status: { old: oldStatus, new: status } },
        })
      },

      updateScreeningStatus: (id, status, operatorId, operatorName) => {
        const oldStatus = get().screenings.find((s) => s.id === id)?.status
        set((state) => ({
          screenings: state.screenings.map((s) =>
            s.id === id
              ? { ...s, status, operatorId, operatorName, updatedAt: new Date().toISOString() }
              : s
          ),
        }))
        get().addOperationLog({
          action: 'screening_status_updated',
          description: `更新场次状态从 ${oldStatus} 到 ${status}`,
          operatorId,
          operatorName,
          operatorRole: get().currentUser.role,
          targetType: 'screening',
          targetId: id,
          changes: { status: { old: oldStatus, new: status } },
        })
      },

      changeHall: (screeningId, newHall, operatorId, operatorName, reason) => {
        const oldHall = get().screenings.find((s) => s.id === screeningId)?.currentHall
        set((state) => ({
          screenings: state.screenings.map((s) =>
            s.id === screeningId
              ? {
                  ...s,
                  currentHall: newHall,
                  isHallChanged: true,
                  status: 'hall_changed',
                  operatorId,
                  operatorName,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }))
        get().addRemark({ sourceType: 'screening', sourceId: screeningId, content: `换厅原因: ${reason}` })
        get().addOperationLog({
          action: 'hall_changed',
          description: `将场次从 ${oldHall} 更换至 ${newHall}`,
          operatorId,
          operatorName,
          operatorRole: get().currentUser.role,
          targetType: 'screening',
          targetId: screeningId,
          changes: { currentHall: { old: oldHall, new: newHall } },
        })
      },

      recordEquipmentFailure: (screeningId, description, operatorId, operatorName) => {
        set((state) => ({
          screenings: state.screenings.map((s) =>
            s.id === screeningId
              ? {
                  ...s,
                  hasEquipmentFailure: true,
                  status: 'equipment_failure',
                  operatorId,
                  operatorName,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }))
        get().addRemark({ sourceType: 'screening', sourceId: screeningId, content: `设备故障: ${description}` })
        get().addOperationLog({
          action: 'equipment_failure',
          description: `记录设备故障: ${description}`,
          operatorId,
          operatorName,
          operatorRole: get().currentUser.role,
          targetType: 'screening',
          targetId: screeningId,
        })
      },

      processRefund: (screeningId, count, reason, operatorId, operatorName) => {
        set((state) => ({
          screenings: state.screenings.map((s) =>
            s.id === screeningId
              ? {
                  ...s,
                  refundCount: s.refundCount + count,
                  operatorId,
                  operatorName,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }))
        get().addRemark({ sourceType: 'screening', sourceId: screeningId, content: `退票 ${count} 张，原因: ${reason}` })
        get().addOperationLog({
          action: 'refund_processed',
          description: `处理退票 ${count} 张`,
          operatorId,
          operatorName,
          operatorRole: get().currentUser.role,
          targetType: 'screening',
          targetId: screeningId,
        })
      },

      redeemGroupTicket: (screeningId, count, operatorId, operatorName) => {
        set((state) => ({
          screenings: state.screenings.map((s) =>
            s.id === screeningId
              ? {
                  ...s,
                  groupRedeemed: Math.min(s.groupRedeemed + count, s.groupTickets),
                  operatorId,
                  operatorName,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }))
        get().addOperationLog({
          action: 'group_ticket_redeemed',
          description: `核销团体票 ${count} 张`,
          operatorId,
          operatorName,
          operatorRole: get().currentUser.role,
          targetType: 'screening',
          targetId: screeningId,
        })
      },

      completeTodo: (id) => {
        const todo = get().todos.find((t) => t.id === id)
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, completed: true } : t)),
        }))
        if (todo) {
          get().addOperationLog({
            action: 'todo_completed',
            description: `完成待办: ${todo.title}`,
            operatorId: get().currentUser.id,
            operatorName: get().currentUser.name,
            operatorRole: get().currentUser.role,
            targetType: 'user',
            targetId: get().currentUser.id,
          })
        }
      },

      resolveRisk: (id) => {
        set((state) => ({
          risks: state.risks.map((r) =>
            r.id === id ? { ...r, status: 'resolved', resolvedAt: new Date().toISOString() } : r
          ),
        }))
        get().addOperationLog({
          action: 'risk_resolved',
          description: '风险项已解决',
          operatorId: get().currentUser.id,
          operatorName: get().currentUser.name,
          operatorRole: get().currentUser.role,
          targetType: 'inventory',
          targetId: id,
        })
      },

      linkInventoryToScreening: (inventoryId, screeningId) => {
        set((state) => ({
          inventoryItems: state.inventoryItems.map((item) =>
            item.id === inventoryId
              ? {
                  ...item,
                  relatedScreeningIds: item.relatedScreeningIds.includes(screeningId)
                    ? item.relatedScreeningIds
                    : [...item.relatedScreeningIds, screeningId],
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
          screenings: state.screenings.map((s) =>
            s.id === screeningId
              ? {
                  ...s,
                  inventoryIds: s.inventoryIds.includes(inventoryId)
                    ? s.inventoryIds
                    : [...s.inventoryIds, inventoryId],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }))
      },

      addOperationLog: (log) => {
        set((state) => ({
          operationLogs: [
            {
              ...log,
              id: generateId(),
              timestamp: new Date().toISOString(),
            },
            ...state.operationLogs,
          ],
        }))
      },

      createException: (exception) => {
        const id = generateId()
        const newException: ExceptionRecord = {
          ...exception,
          id,
          remarks: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          exceptions: [newException, ...state.exceptions],
        }))
        get().addOperationLog({
          action: 'exception_created',
          description: `创建异常: ${exception.title}`,
          operatorId: get().currentUser.id,
          operatorName: get().currentUser.name,
          operatorRole: get().currentUser.role,
          targetType: 'exception',
          targetId: id,
        })
        return id
      },

      updateExceptionStatus: (id, status, handlerId, handlerName) => {
        set((state) => ({
          exceptions: state.exceptions.map((e) =>
            e.id === id ? { ...e, status, handlerId, handlerName, updatedAt: new Date().toISOString() } : e
          ),
        }))
        get().addOperationLog({
          action: 'exception_status_updated',
          description: `更新异常状态为 ${status}`,
          operatorId: handlerId,
          operatorName: handlerName,
          operatorRole: get().currentUser.role,
          targetType: 'exception',
          targetId: id,
        })
      },

      getScreeningById: (id) => get().screenings.find((s) => s.id === id),
      getInventoryById: (id) => get().inventoryItems.find((i) => i.id === id),
      getExceptionById: (id) => get().exceptions.find((e) => e.id === id),

      getRemarksBySource: (sourceType, sourceId) => {
        const state = get()
        let remarks: Remark[] = []
        if (sourceType === 'inventory') {
          const item = state.inventoryItems.find((i) => i.id === sourceId)
          remarks = item?.remarks || []
        } else if (sourceType === 'screening') {
          const s = state.screenings.find((sc) => sc.id === sourceId)
          remarks = s?.remarks || []
        } else if (sourceType === 'exception') {
          const e = state.exceptions.find((ex) => ex.id === sourceId)
          remarks = e?.remarks || []
        }
        return remarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      },

      getRecentChanges: () => {
        return get().operationLogs.slice(0, 20)
      },
    }),
    {
      name: 'cinema-operations-storage',
    }
  )
)

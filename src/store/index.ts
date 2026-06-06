import { create } from 'zustand'
import { apiClient } from '@/services/api'
import type {
  User,
  InventoryItem,
  Screening,
  TodoItem,
  RiskItem,
  OperationLog,
  ExceptionRecord,
  Remark,
  Attachment,
  InventoryStatus,
  ScreeningStatus,
  Role,
} from '@/types'

const generateId = () => Math.random().toString(36).substr(2, 9)

interface AppState {
  loading: boolean
  currentUser: User
  users: User[]
  inventoryItems: InventoryItem[]
  screenings: Screening[]
  todos: TodoItem[]
  risks: RiskItem[]
  operationLogs: OperationLog[]
  exceptions: ExceptionRecord[]

  initialize: () => Promise<void>
  refreshAll: () => Promise<void>

  switchRole: (role: Role) => Promise<void>

  addRemark: (params: {
    sourceType: 'inventory' | 'screening' | 'exception'
    sourceId: string
    content: string
  }) => Promise<void>

  addAttachment: (params: {
    sourceType: 'inventory' | 'screening' | 'exception'
    sourceId: string
    file: { name: string; type: string; size: number }
  }) => Promise<void>

  syncInventoryToScreenings: (inventoryId: string) => Promise<void>

  updateInventoryStatus: (
    id: string,
    status: InventoryStatus,
    handlerId: string,
    handlerName: string
  ) => Promise<void>

  updateScreeningStatus: (
    id: string,
    status: ScreeningStatus,
    operatorId: string,
    operatorName: string
  ) => Promise<void>

  changeHall: (
    screeningId: string,
    newHall: string,
    operatorId: string,
    operatorName: string,
    reason: string
  ) => Promise<void>

  recordEquipmentFailure: (
    screeningId: string,
    description: string,
    operatorId: string,
    operatorName: string
  ) => Promise<void>

  processRefund: (
    screeningId: string,
    count: number,
    reason: string,
    operatorId: string,
    operatorName: string
  ) => Promise<void>

  redeemGroupTicket: (
    screeningId: string,
    count: number,
    operatorId: string,
    operatorName: string
  ) => Promise<void>

  completeScreeningReconciliation: (
    id: string,
    operatorId: string,
    operatorName: string
  ) => Promise<void>

  completeTodo: (id: string) => Promise<void>
  resolveRisk: (id: string) => Promise<void>

  linkInventoryToScreening: (inventoryId: string, screeningId: string) => Promise<void>

  addOperationLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => Promise<void>

  createException: (
    exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'updatedAt' | 'remarks' | 'attachments'>
  ) => Promise<string>

  updateExceptionStatus: (
    id: string,
    status: ExceptionRecord['status'],
    handlerId: string,
    handlerName: string
  ) => Promise<void>

  getScreeningById: (id: string) => Screening | undefined
  getInventoryById: (id: string) => InventoryItem | undefined
  getExceptionById: (id: string) => ExceptionRecord | undefined
  getRemarksBySource: (
    sourceType: 'inventory' | 'screening' | 'exception',
    sourceId: string
  ) => Remark[]
  getRecentChanges: () => OperationLog[]
}

const initialUser: User = { id: 'u1', name: '张小明', role: 'frontline' }

export const useStore = create<AppState>((set, get) => ({
  loading: false,
  currentUser: initialUser,
  users: [],
  inventoryItems: [],
  screenings: [],
  todos: [],
  risks: [],
  operationLogs: [],
  exceptions: [],

  initialize: async () => {
    set({ loading: true })
    try {
      const [users, inventory, screenings, todos, risks, logs, exceptions] = await Promise.all([
        apiClient.auth.listUsers(),
        apiClient.inventory.list(),
        apiClient.screenings.list(),
        apiClient.todos.list(),
        apiClient.risks.list(),
        apiClient.audit.list(),
        apiClient.exceptions.list(),
      ])

      set({
        users: users.data || [],
        inventoryItems: inventory.data || [],
        screenings: screenings.data || [],
        todos: todos.data || [],
        risks: risks.data || [],
        operationLogs: logs.data || [],
        exceptions: exceptions.data || [],
        loading: false,
      })
    } catch (error) {
      console.error('Failed to initialize store:', error)
      set({ loading: false })
    }
  },

  refreshAll: async () => {
    await get().initialize()
  },

  switchRole: async (role) => {
    const { currentUser } = get()
    const result = await apiClient.auth.switchRole(currentUser.id, role)
    if (result.success && result.data) {
      set({ currentUser: { ...currentUser, role } })
      await get().addOperationLog({
        action: 'role_switched',
        description: `切换角色为 ${role === 'frontline' ? '一线员工' : role === 'manager' ? '经理' : '管理员'}`,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: role,
        targetType: 'user',
        targetId: currentUser.id,
      })
    }
  },

  addRemark: async ({ sourceType, sourceId, content }) => {
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
      const result = await apiClient.inventory.addRemark(sourceId, remark)
      if (result.success) {
        const items = await apiClient.inventory.list()
        set({ inventoryItems: items.data || [] })
      }
    } else if (sourceType === 'screening') {
      const result = await apiClient.screenings.addRemark(sourceId, remark)
      if (result.success) {
        const items = await apiClient.screenings.list()
        set({ screenings: items.data || [] })
      }
    } else if (sourceType === 'exception') {
      const result = await apiClient.exceptions.addRemark(sourceId, remark)
      if (result.success) {
        const items = await apiClient.exceptions.list()
        set({ exceptions: items.data || [] })
      }
    }

    await get().addOperationLog({
      action: 'remark_added',
      description: `添加备注: ${content.slice(0, 50)}`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      targetType: sourceType,
      targetId: sourceId,
    })
  },

  addAttachment: async ({ sourceType, sourceId, file }) => {
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
      const result = await apiClient.inventory.addAttachment(sourceId, attachment)
      if (result.success) {
        const items = await apiClient.inventory.list()
        set({ inventoryItems: items.data || [] })
      }
    } else if (sourceType === 'screening') {
      const result = await apiClient.screenings.addAttachment(sourceId, attachment)
      if (result.success) {
        const items = await apiClient.screenings.list()
        set({ screenings: items.data || [] })
      }
    } else if (sourceType === 'exception') {
      const result = await apiClient.exceptions.addAttachment(sourceId, attachment)
      if (result.success) {
        const items = await apiClient.exceptions.list()
        set({ exceptions: items.data || [] })
      }
    }

    await get().addOperationLog({
      action: 'attachment_uploaded',
      description: `上传附件: ${file.name}`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      targetType: sourceType,
      targetId: sourceId,
    })
  },

  syncInventoryToScreenings: async (inventoryId) => {
    const { currentUser } = get()
    const result = await apiClient.inventory.syncToScreenings(inventoryId)
    if (result.success) {
      const [inventory, screenings] = await Promise.all([
        apiClient.inventory.list(),
        apiClient.screenings.list(),
      ])
      set({
        inventoryItems: inventory.data || [],
        screenings: screenings.data || [],
      })
    }

    await get().addOperationLog({
      action: 'inventory_synced',
      description: '库存备注和附件同步到关联场次',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      targetType: 'inventory',
      targetId: inventoryId,
    })
  },

  updateInventoryStatus: async (id, status, handlerId, handlerName) => {
    const oldStatus = get().inventoryItems.find((i) => i.id === id)?.status
    const result = await apiClient.inventory.update(id, { status, handlerId, handlerName })
    if (result.success) {
      const items = await apiClient.inventory.list()
      set({ inventoryItems: items.data || [] })
    }

    await get().addOperationLog({
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

  updateScreeningStatus: async (id, status, operatorId, operatorName) => {
    const oldStatus = get().screenings.find((s) => s.id === id)?.status
    const result = await apiClient.screenings.update(id, { status, operatorId, operatorName })
    if (result.success) {
      const items = await apiClient.screenings.list()
      set({ screenings: items.data || [] })
    }

    await get().addOperationLog({
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

  changeHall: async (screeningId, newHall, operatorId, operatorName, reason) => {
    const oldHall = get().screenings.find((s) => s.id === screeningId)?.currentHall
    const result = await apiClient.screenings.update(screeningId, {
      currentHall: newHall,
      isHallChanged: true,
      status: 'hall_changed',
      operatorId,
      operatorName,
    })
    if (result.success) {
      const items = await apiClient.screenings.list()
      set({ screenings: items.data || [] })
    }

    await get().addRemark({ sourceType: 'screening', sourceId: screeningId, content: `换厅原因: ${reason}` })
    await get().createException({
      type: 'hall_change',
      title: `${get().screenings.find((s) => s.id === screeningId)?.movieName || '场次'} 临时换厅`,
      description: `从 ${oldHall} 更换至 ${newHall}，原因：${reason}`,
      screeningId,
      status: 'handling',
      handlerId: operatorId,
      handlerName: operatorName,
    })
    await get().addOperationLog({
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

  recordEquipmentFailure: async (screeningId, description, operatorId, operatorName) => {
    const result = await apiClient.screenings.update(screeningId, {
      hasEquipmentFailure: true,
      status: 'equipment_failure',
      operatorId,
      operatorName,
    })
    if (result.success) {
      const items = await apiClient.screenings.list()
      set({ screenings: items.data || [] })
    }

    await get().addRemark({ sourceType: 'screening', sourceId: screeningId, content: `设备故障: ${description}` })
    await get().createException({
      type: 'equipment_failure',
      title: `${get().screenings.find((s) => s.id === screeningId)?.currentHall || '影厅'} 设备故障`,
      description,
      screeningId,
      status: 'handling',
      handlerId: operatorId,
      handlerName: operatorName,
    })
    await get().addOperationLog({
      action: 'equipment_failure',
      description: `记录设备故障: ${description}`,
      operatorId,
      operatorName,
      operatorRole: get().currentUser.role,
      targetType: 'screening',
      targetId: screeningId,
    })
  },

  processRefund: async (screeningId, count, reason, operatorId, operatorName) => {
    const screening = get().screenings.find((s) => s.id === screeningId)
    const result = await apiClient.screenings.update(screeningId, {
      refundCount: (screening?.refundCount || 0) + count,
      operatorId,
      operatorName,
    })
    if (result.success) {
      const items = await apiClient.screenings.list()
      set({ screenings: items.data || [] })
    }

    await get().addRemark({ sourceType: 'screening', sourceId: screeningId, content: `退票 ${count} 张，原因: ${reason}` })

    if (screening?.hasEquipmentFailure) {
      await get().createException({
        type: 'refund',
        title: `${screening.movieName} 设备故障退票`,
        description: `退票 ${count} 张，原因：${reason}`,
        screeningId,
        status: 'handling',
        handlerId: operatorId,
        handlerName: operatorName,
      })
    }

    await get().addOperationLog({
      action: 'refund_processed',
      description: `处理退票 ${count} 张`,
      operatorId,
      operatorName,
      operatorRole: get().currentUser.role,
      targetType: 'screening',
      targetId: screeningId,
    })
  },

  redeemGroupTicket: async (screeningId, count, operatorId, operatorName) => {
    const screening = get().screenings.find((s) => s.id === screeningId)
    const result = await apiClient.screenings.update(screeningId, {
      groupRedeemed: Math.min((screening?.groupRedeemed || 0) + count, screening?.groupTickets || 0),
      operatorId,
      operatorName,
    })
    if (result.success) {
      const items = await apiClient.screenings.list()
      set({ screenings: items.data || [] })
    }

    await get().addOperationLog({
      action: 'group_ticket_redeemed',
      description: `核销团体票 ${count} 张`,
      operatorId,
      operatorName,
      operatorRole: get().currentUser.role,
      targetType: 'screening',
      targetId: screeningId,
    })
  },

  completeScreeningReconciliation: async (id, operatorId, operatorName) => {
    const result = await apiClient.screenings.completeReconciliation(id, operatorId, operatorName)
    if (result.success) {
      const [screenings, exceptions, todos] = await Promise.all([
        apiClient.screenings.list(),
        apiClient.exceptions.list(),
        apiClient.todos.list(),
      ])
      set({
        screenings: screenings.data || [],
        exceptions: exceptions.data || [],
        todos: todos.data || [],
      })
    }

    await get().addOperationLog({
      action: 'screening_reconciliation_completed',
      description: '场次对账完成，关联异常和待办已收口',
      operatorId,
      operatorName,
      operatorRole: get().currentUser.role,
      targetType: 'screening',
      targetId: id,
    })
  },

  completeTodo: async (id) => {
    const todo = get().todos.find((t) => t.id === id)
    const result = await apiClient.todos.update(id, { completed: true })
    if (result.success) {
      const items = await apiClient.todos.list()
      set({ todos: items.data || [] })
    }

    if (todo) {
      await get().addOperationLog({
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

  resolveRisk: async (id) => {
    const result = await apiClient.risks.update(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    })
    if (result.success) {
      const items = await apiClient.risks.list()
      set({ risks: items.data || [] })
    }

    await get().addOperationLog({
      action: 'risk_resolved',
      description: '风险项已解决',
      operatorId: get().currentUser.id,
      operatorName: get().currentUser.name,
      operatorRole: get().currentUser.role,
      targetType: 'inventory',
      targetId: id,
    })
  },

  linkInventoryToScreening: async (inventoryId, screeningId) => {
    const result = await apiClient.inventory.linkToScreening(inventoryId, screeningId)
    if (result.success) {
      const [inventory, screenings] = await Promise.all([
        apiClient.inventory.list(),
        apiClient.screenings.list(),
      ])
      set({
        inventoryItems: inventory.data || [],
        screenings: screenings.data || [],
      })
    }
  },

  addOperationLog: async (log) => {
    const result = await apiClient.audit.add(log)
    if (result.success) {
      const items = await apiClient.audit.list()
      set({ operationLogs: items.data || [] })
    }
  },

  createException: async (exception) => {
    const result = await apiClient.exceptions.create(exception)
    if (result.success && result.data) {
      const items = await apiClient.exceptions.list()
      set({ exceptions: items.data || [] })
      return result.data.id
    }
    return ''
  },

  updateExceptionStatus: async (id, status, handlerId, handlerName) => {
    const result = await apiClient.exceptions.update(id, { status, handlerId, handlerName })
    if (result.success) {
      const items = await apiClient.exceptions.list()
      set({ exceptions: items.data || [] })
    }

    await get().addOperationLog({
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

  getRecentChanges: () => get().operationLogs.slice(0, 20),
}))

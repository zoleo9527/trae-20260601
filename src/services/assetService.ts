import { Asset, FlowRecord, Task, Notification, Attachment, FilterParams, UserRole, AssetStatus } from '@/types'
import { assets as mockAssets, flowRecords as mockFlowRecords, tasks as mockTasks, notifications as mockNotifications, attachments as mockAttachments, users } from '@/data/mockData'

let assets: Asset[] = [...mockAssets]
let flowRecords: FlowRecord[] = [...mockFlowRecords]
let tasks: Task[] = [...mockTasks]
let notifications: Notification[] = [...mockNotifications]
let attachmentList: Attachment[] = [...mockAttachments]

const statusTransitions: Record<AssetStatus, AssetStatus> = {
  pending_entry: 'entry_completed',
  entry_completed: 'pending_review',
  pending_review: 'review_approved',
  review_approved: 'pending_finance',
  review_rejected: 'pending_entry',
  pending_finance: 'finance_approved',
  finance_approved: 'completed',
  finance_rejected: 'pending_entry',
  completed: 'completed',
}

export const assetService = {
  getAssets(params?: FilterParams): Asset[] {
    let result = [...assets]
    if (params?.status) {
      result = result.filter(asset => asset.status === params.status)
    }
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase()
      result = result.filter(asset =>
        asset.name.toLowerCase().includes(keyword) ||
        asset.code.toLowerCase().includes(keyword)
      )
    }
    if (params?.category) {
      result = result.filter(asset => asset.category === params.category)
    }
    if (params?.assigneeId) {
      result = result.filter(asset => 
        asset.submitter.id === params.assigneeId ||
        asset.reviewer?.id === params.assigneeId ||
        asset.financeHandler?.id === params.assigneeId
      )
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },

  getAssetById(id: string): Asset | undefined {
    return assets.find(asset => asset.id === id)
  },

  createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Asset {
    const newAsset: Asset = {
      ...asset,
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    assets.push(newAsset)

    const newTask: Task = {
      id: `t${Date.now()}`,
      assetId: newAsset.id,
      assetName: newAsset.name,
      assetCode: newAsset.code,
      type: 'asset_entry',
      priority: 'high',
      status: 'pending',
      assignee: users.find(u => u.role === 'project_manager')!,
      createdAt: new Date().toISOString(),
    }
    tasks.push(newTask)

    const newNotification: Notification = {
      id: `n${Date.now()}`,
      type: 'task_assignment',
      title: '新的标的入库任务',
      content: `标的「${newAsset.name}」已创建，请进行入库处理`,
      assetId: newAsset.id,
      userId: users.find(u => u.role === 'project_manager')!.id,
      read: false,
      createdAt: new Date().toISOString(),
    }
    notifications.push(newNotification)

    return newAsset
  },

  updateAsset(id: string, updates: Partial<Asset>): Asset | undefined {
    const index = assets.findIndex(asset => asset.id === id)
    if (index === -1) return undefined
    assets[index] = {
      ...assets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    return assets[index]
  },

  updateAssetStatus(id: string, status: AssetStatus, handlerId: string, comment: string): Asset | undefined {
    const asset = assets.find(a => a.id === id)
    if (!asset) return undefined

    const handler = users.find(u => u.id === handlerId)
    if (!handler) return undefined

    const record: FlowRecord = {
      id: `f${Date.now()}`,
      assetId: id,
      statusFrom: asset.status,
      statusTo: status,
      handler,
      comment,
      handledAt: new Date().toISOString(),
    }
    flowRecords.push(record)

    const updates: Partial<Asset> = { status }
    if (handler.role === 'project_manager') {
      updates.submitter = handler
    } else if (handler.role === 'reviewer') {
      updates.reviewer = handler
    } else if (handler.role === 'finance') {
      updates.financeHandler = handler
    }

    const updatedAsset = this.updateAsset(id, updates)
    
    this.createNextTask(updatedAsset!, handler.role)

    return updatedAsset
  },

  createNextTask(asset: Asset, currentRole: UserRole): void {
    const nextRoleMap: Record<UserRole, UserRole> = {
      project_manager: 'reviewer',
      reviewer: 'finance',
      finance: 'project_manager',
    }

    const taskTypeMap: Record<AssetStatus, Task['type']> = {
      entry_completed: 'document_review',
      review_approved: 'deposit_refund',
      review_rejected: 'document_supplement',
      finance_rejected: 'document_supplement',
      pending_entry: 'asset_entry',
      pending_review: 'document_review',
      pending_finance: 'deposit_refund',
      finance_approved: 'deposit_refund',
      completed: 'deposit_refund',
    }

    const statusDescriptionMap: Record<AssetStatus, string> = {
      entry_completed: '标的入库完成，等待审核',
      review_approved: '审核通过，等待财务处理',
      review_rejected: '审核驳回，请补充资料',
      finance_rejected: '财务驳回，请重新提交',
      pending_entry: '待入库',
      pending_review: '待审核',
      pending_finance: '待财务处理',
      finance_approved: '财务通过',
      completed: '已完成',
    }

    const nextRole = nextRoleMap[currentRole]
    const nextUser = users.find(u => u.role === nextRole)

    if (asset.status === 'completed') {
      return
    }

    const existingTask = tasks.find(t => t.assetId === asset.id && t.status === 'pending')
    if (existingTask) {
      existingTask.status = 'completed'
    }

    const newTask: Task = {
      id: `t${Date.now()}`,
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      type: taskTypeMap[asset.status],
      priority: asset.status === 'review_rejected' || asset.status === 'finance_rejected' ? 'high' : 'medium',
      status: 'pending',
      assignee: nextUser!,
      createdAt: new Date().toISOString(),
      relatedIssue: asset.status === 'review_rejected' || asset.status === 'finance_rejected' 
        ? statusDescriptionMap[asset.status] 
        : undefined,
    }
    tasks.push(newTask)

    const newNotification: Notification = {
      id: `n${Date.now()}`,
      type: 'task_assignment',
      title: `新的${taskTypeMap[asset.status] === 'document_review' ? '审核' : taskTypeMap[asset.status] === 'deposit_refund' ? '财务' : '处理'}任务`,
      content: `标的「${asset.name}」${statusDescriptionMap[asset.status]}`,
      assetId: asset.id,
      userId: nextUser!.id,
      read: false,
      createdAt: new Date().toISOString(),
    }
    notifications.push(newNotification)
  },

  getFlowRecords(assetId: string): FlowRecord[] {
    return flowRecords
      .filter(record => record.assetId === assetId)
      .sort((a, b) => new Date(b.handledAt).getTime() - new Date(a.handledAt).getTime())
  },

  getTasks(assigneeId?: string, type?: string): Task[] {
    let result = [...tasks]
    if (assigneeId) {
      result = result.filter(task => task.assignee.id === assigneeId)
    }
    if (type) {
      result = result.filter(task => task.type === type)
    }
    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  },

  updateTaskStatus(taskId: string, status: Task['status']): Task | undefined {
    const index = tasks.findIndex(task => task.id === taskId)
    if (index === -1) return undefined
    tasks[index] = { ...tasks[index], status }
    return tasks[index]
  },

  getNotifications(userId?: string): Notification[] {
    let result = [...notifications]
    if (userId) {
      result = result.filter(n => n.userId === userId)
    }
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  markNotificationAsRead(id: string): void {
    const index = notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications[index].read = true
    }
  },

  getAttachments(assetId: string): Attachment[] {
    return attachmentList.filter(att => att.assetId === assetId)
  },

  uploadAttachment(assetId: string, file: Omit<Attachment, 'id' | 'assetId'>): Attachment {
    const newAttachment: Attachment = {
      ...file,
      id: `att${Date.now()}`,
      assetId,
    }
    attachmentList.push(newAttachment)
    return newAttachment
  },

  getUserTasks(userId: string, role: UserRole): Task[] {
    const userTasks = tasks.filter(task => task.assignee.id === userId && task.status !== 'completed')
    return userTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  },

  getPendingCountByRole(role: UserRole): { total: number; high: number } {
    let filteredTasks = tasks.filter(task => task.status !== 'completed')
    
    if (role === 'project_manager') {
      filteredTasks = filteredTasks.filter(t => 
        t.type === 'asset_entry' || t.type === 'document_supplement'
      )
    } else if (role === 'reviewer') {
      filteredTasks = filteredTasks.filter(t => 
        t.type === 'document_review' || t.type === 'qualification_dispute'
      )
    } else if (role === 'finance') {
      filteredTasks = filteredTasks.filter(t => 
        t.type === 'deposit_refund'
      )
    }
    
    const highCount = filteredTasks.filter(t => t.priority === 'high').length
    return { total: filteredTasks.length, high: highCount }
  },

  getAssetStatusStatistics(): Record<string, number> {
    const stats: Record<string, number> = {}
    assets.forEach(asset => {
      stats[asset.status] = (stats[asset.status] || 0) + 1
    })
    return stats
  },
}

import { mockRefundRequests, mockRescheduleRequests, mockComplaints, mockUsers } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { type, action, comment, newStatus, newHandler, stuckPoint, stuckReason, operatorInfo } = body

  let item: any = null

  if (type === 'refund') {
    item = mockRefundRequests.find(r => r.id === id)
  } else if (type === 'reschedule') {
    item = mockRescheduleRequests.find(r => r.id === id)
  } else if (type === 'complaint') {
    item = mockComplaints.find(c => c.id === id)
  }

  if (!item) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }

  const defaultOperator = {
    name: '系统管理员',
    role: 'admin',
    department: '系统'
  }
  
  const operator = operatorInfo || defaultOperator

  const logEntry = {
    id: `log${Date.now()}`,
    type: action,
    action: getActionText(action, newStatus, newHandler),
    operator: operator.name,
    operatorRole: operator.role,
    operatorDepartment: operator.department,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    comment
  }

  item.processingLogs.push(logEntry)
  item.updatedAt = logEntry.timestamp

  if (newStatus) {
    item.status = newStatus
  }

  if (newHandler) {
    item.currentHandler = newHandler.role
    item.currentHandlerName = newHandler.name
    item.handlerDepartment = newHandler.department
  } else if (action === 'process' || action === 'stuck') {
    item.currentHandler = operator.role
    item.currentHandlerName = operator.name
    item.handlerDepartment = operator.department
  }

  if (stuckPoint !== undefined) {
    item.stuckPoint = stuckPoint
    item.stuckReason = stuckReason
  }

  return {
    code: 200,
    message: '任务更新成功',
    data: item
  }
})

function getActionText(action: string, newStatus?: string, newHandler?: any): string {
  switch (action) {
    case 'process':
      return newStatus ? `处理中,状态更新为${newStatus}` : '开始处理'
    case 'assign':
      return newHandler ? `分配给${newHandler.name}(${newHandler.department})` : '任务分配'
    case 'stuck':
      return '任务卡点'
    case 'resolve':
      return '问题已解决'
    case 'close':
      return '任务已关闭'
    default:
      return action
  }
}

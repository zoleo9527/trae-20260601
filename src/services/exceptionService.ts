import type { ExceptionHandle, HandleExceptionRequest, GetExceptionHistoryResponse } from '@/types'
import { orderService } from './orderService'
import { feedbackService } from './feedbackService'
import { additionService } from './additionService'

const getHandles = (): ExceptionHandle[] => {
  const data = localStorage.getItem('handles')
  return data ? JSON.parse(data) : []
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const exceptionService = {
  getHandles: (): GetExceptionHistoryResponse => {
    return { handles: getHandles() }
  },

  getHandlesByTarget: (targetType: 'order' | 'feedback' | 'addition', targetId: string): ExceptionHandle[] => {
    return getHandles().filter(h => {
      if (targetType === 'order') return h.orderId === targetId
      if (targetType === 'feedback') return h.feedbackId === targetId
      if (targetType === 'addition') return h.additionId === targetId
      return false
    })
  },

  handleException: (request: HandleExceptionRequest, handlerId: string, handlerName: string, handlerRole: string): boolean => {
    const handle: ExceptionHandle = {
      id: generateId(),
      orderId: request.targetType === 'order' ? request.targetId : '',
      feedbackId: request.targetType === 'feedback' ? request.targetId : undefined,
      additionId: request.targetType === 'addition' ? request.targetId : undefined,
      handlerId,
      handlerName,
      handlerRole,
      action: request.action,
      reason: request.reason,
      result: '',
      createdAt: new Date().toISOString(),
    }
    
    switch (request.action) {
      case 'reject':
        handle.result = '已驳回'
        if (request.targetType === 'order') {
          orderService.updateOrderStatus(request.targetId, 'completed')
        } else if (request.targetType === 'feedback') {
          feedbackService.handleFeedback({
            feedbackId: request.targetId,
            action: 'reject',
            reason: request.reason,
          })
        } else if (request.targetType === 'addition') {
          additionService.handleAddition({
            recordId: request.targetId,
            action: 'reject',
            reason: request.reason,
          }, handlerId, handlerName, handlerRole)
        }
        break
      case 'supplement':
        handle.result = '已要求补充信息'
        if (request.targetType === 'feedback') {
          feedbackService.handleFeedback({
            feedbackId: request.targetId,
            action: 'supplement',
            reason: request.reason,
            supplementData: request.supplementData,
          })
        }
        break
      case 'transfer':
        handle.result = `已转交给${request.transferTo}`
        if (request.targetType === 'order') {
          const users = JSON.parse(localStorage.getItem('users') || '[]')
          const user = users.find(u => u.id === request.transferTo)
          if (user) {
            orderService.updateOrderStatus(request.targetId, 'feedback_processing', {
              role: user.role as 'customer_service' | 'housekeeper' | 'quality_supervisor',
              name: user.name,
              id: user.id,
            })
          }
        } else if (request.targetType === 'feedback') {
          feedbackService.handleFeedback({
            feedbackId: request.targetId,
            action: 'transfer',
            reason: request.reason,
            transferTo: request.transferTo,
          })
        } else if (request.targetType === 'addition') {
          additionService.handleAddition({
            recordId: request.targetId,
            action: 'transfer',
            reason: request.reason,
            transferTo: request.transferTo,
          }, handlerId, handlerName, handlerRole)
        }
        break
      case 'complete':
        handle.result = '已完成处理'
        if (request.targetType === 'order') {
          orderService.updateOrderStatus(request.targetId, 'completed')
        } else if (request.targetType === 'feedback') {
          feedbackService.handleFeedback({
            feedbackId: request.targetId,
            action: 'complete',
            reason: request.reason,
          })
        } else if (request.targetType === 'addition') {
          additionService.handleAddition({
            recordId: request.targetId,
            action: 'complete',
            reason: request.reason,
          }, handlerId, handlerName, handlerRole)
        }
        break
      case 'mark_incomplete':
        handle.result = '已标记为未完成'
        if (request.targetType === 'addition') {
          additionService.handleAddition({
            recordId: request.targetId,
            action: 'mark_incomplete',
            reason: request.reason,
          }, handlerId, handlerName, handlerRole)
        }
        break
      case 'confirm':
        handle.result = '已确认加项'
        if (request.targetType === 'addition') {
          additionService.handleAddition({
            recordId: request.targetId,
            action: 'confirm',
            reason: request.reason,
          }, handlerId, handlerName, handlerRole)
        }
        break
      case 'approve':
        handle.result = '已批准加项'
        if (request.targetType === 'addition') {
          additionService.handleAddition({
            recordId: request.targetId,
            action: 'approve',
            reason: request.reason,
          }, handlerId, handlerName, handlerRole)
        }
        break
    }
    
    const handles = getHandles()
    handles.push(handle)
    localStorage.setItem('handles', JSON.stringify(handles))
    
    return true
  },
}
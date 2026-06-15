import type { AdditionRecord, GetAdditionRecordsResponse, HandleAdditionRequest, AdditionHistoryItem } from '@/types'

const getAdditions = (): AdditionRecord[] => {
  const data = localStorage.getItem('additions')
  return data ? JSON.parse(data) : []
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const additionService = {
  getAdditions: (): GetAdditionRecordsResponse => {
    const records = getAdditions()
    const incompleteCount = records.filter(r => r.status === 'incomplete').length
    return { records, total: records.length, incompleteCount }
  },

  getIncompleteAdditions: () => {
    return getAdditions().filter(r => r.status === 'incomplete')
  },

  getAdditionById: (id: string): AdditionRecord | undefined => {
    return getAdditions().find(r => r.id === id)
  },

  handleAddition: (request: HandleAdditionRequest, operatorId: string, operatorName: string, operatorRole: string): boolean => {
    const additions = getAdditions()
    const index = additions.findIndex(r => r.id === request.recordId)
    if (index === -1) return false
    
    const addition = additions[index]
    const historyItem: AdditionHistoryItem = {
      id: generateId(),
      action: '',
      operatorId,
      operatorName,
      operatorRole,
      reason: request.reason,
      timestamp: new Date().toISOString(),
    }
    
    switch (request.action) {
      case 'confirm':
        if (addition.status === 'rejected_by_housekeeper' || addition.status === 'rejected_by_supervisor') {
          addition.status = 'pending_confirmation'
          addition.currentHandler = {
            role: 'housekeeper',
            name: addition.housekeeperName,
            id: addition.housekeeperId,
          }
          historyItem.action = '重新提交'
        } else {
          addition.status = 'pending_approval'
          addition.currentHandler = {
            role: 'quality_supervisor',
            name: '陈主管',
            id: 'user-5',
          }
          historyItem.action = '家政员确认'
        }
        break
      case 'reject':
        if (addition.status === 'pending_confirmation') {
          addition.status = 'rejected_by_housekeeper'
          historyItem.action = '家政员拒绝'
        } else {
          addition.status = 'rejected_by_supervisor'
          historyItem.action = '主管驳回'
        }
        break
      case 'approve':
        addition.status = 'in_progress'
        addition.currentHandler = {
          role: 'housekeeper',
          name: addition.housekeeperName,
          id: addition.housekeeperId,
        }
        historyItem.action = '质检主管批准'
        break
      case 'complete':
        addition.status = 'completed'
        addition.currentHandler = undefined
        addition.incompleteReason = undefined
        historyItem.action = '完成服务'
        break
      case 'mark_incomplete':
        addition.status = 'incomplete'
        addition.incompleteReason = request.reason
        historyItem.action = '标记为未完成'
        break
      case 'transfer':
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const user = users.find(u => u.id === request.transferTo)
        if (user) {
          addition.currentHandler = {
            role: user.role as 'customer_service' | 'housekeeper' | 'quality_supervisor',
            name: user.name,
            id: user.id,
          }
          historyItem.action = `转交给${user.name}`
        }
        break
    }
    
    addition.history.push(historyItem)
    addition.updatedAt = new Date().toISOString()
    additions[index] = addition
    localStorage.setItem('additions', JSON.stringify(additions))
    
    return true
  },

  detectStuckAdditions: () => {
    const additions = getAdditions()
    const confirmationThreshold = 60 * 60 * 1000
    
    additions.forEach(addition => {
      if (addition.status === 'pending_confirmation') {
        const updatedAt = new Date(addition.updatedAt).getTime()
        const now = Date.now()
        if (now - updatedAt > confirmationThreshold) {
          const users = JSON.parse(localStorage.getItem('users') || '[]')
          const supervisor = users.find(u => u.role === 'quality_supervisor')
          if (supervisor) {
            addition.currentHandler = {
              role: 'quality_supervisor',
              name: supervisor.name,
              id: supervisor.id,
            }
          }
        }
      }
    })
    
    localStorage.setItem('additions', JSON.stringify(additions))
  },
}
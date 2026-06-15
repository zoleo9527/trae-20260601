import type { ProcessFeedback, GetFeedbackListResponse, HandleFeedbackRequest } from '@/types'

const getFeedbacks = (): ProcessFeedback[] => {
  const data = localStorage.getItem('feedbacks')
  return data ? JSON.parse(data) : []
}

export const feedbackService = {
  getFeedbacks: (): GetFeedbackListResponse => {
    const feedbacks = getFeedbacks()
    const stuckCount = feedbacks.filter(f => f.status === 'stuck').length
    return { feedbacks, total: feedbacks.length, stuckCount }
  },

  getStuckFeedbacks: () => {
    return getFeedbacks().filter(f => f.status === 'stuck')
  },

  getFeedbackById: (id: string): ProcessFeedback | undefined => {
    return getFeedbacks().find(f => f.id === id)
  },

  handleFeedback: (request: HandleFeedbackRequest): boolean => {
    const feedbacks = getFeedbacks()
    const index = feedbacks.findIndex(f => f.id === request.feedbackId)
    if (index === -1) return false
    
    const feedback = feedbacks[index]
    
    switch (request.action) {
      case 'reject':
        feedback.status = 'rejected'
        break
      case 'supplement':
        feedback.status = 'supplemented'
        break
      case 'complete':
        feedback.status = 'completed'
        break
      case 'transfer':
        if (request.transferTo) {
          const users = JSON.parse(localStorage.getItem('users') || '[]')
          const user = users.find(u => u.id === request.transferTo)
          if (user) {
            feedback.currentHandler = {
              role: user.role as 'customer_service' | 'quality_supervisor',
              name: user.name,
              id: user.id,
            }
          }
        }
        break
    }
    
    feedback.updatedAt = new Date().toISOString()
    feedbacks[index] = feedback
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks))
    
    return true
  },

  detectStuckFeedbacks: () => {
    const feedbacks = getFeedbacks()
    const stuckThreshold = 60 * 60 * 1000
    
    feedbacks.forEach(feedback => {
      if (feedback.status === 'processing') {
        const updatedAt = new Date(feedback.updatedAt).getTime()
        const now = Date.now()
        if (now - updatedAt > stuckThreshold) {
          feedback.status = 'stuck'
          feedback.stuckInfo = {
            stuckAt: feedback.updatedAt,
            stuckDuration: Math.floor((now - updatedAt) / 60000),
            stuckReason: '反馈处理超时',
          }
        }
      }
    })
    
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks))
  },
}
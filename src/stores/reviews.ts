import { ref, computed } from 'vue'
import type { Review, ReviewFollowUp, Compensation } from '@/types'
import { reviews as mockReviews, followUps as mockFollowUps, compensations as mockCompensations } from '@/data/mockData'

const reviews = ref<Review[]>([...mockReviews])
const followUps = ref<ReviewFollowUp[]>([...mockFollowUps])
const compensations = ref<Compensation[]>([...mockCompensations])

export function useReviewsStore() {
  const pendingReviews = computed(() => 
    reviews.value.filter(r => r.status === 'pending')
  )

  const reviewedReviews = computed(() => 
    reviews.value.filter(r => r.status === 'reviewed')
  )

  const resolvedReviews = computed(() => 
    reviews.value.filter(r => r.status === 'resolved')
  )

  const getReviewById = (id: string) => 
    reviews.value.find(r => r.id === id)

  const getFollowUpsByReviewId = (reviewId: string) => 
    followUps.value.filter(f => f.reviewId === reviewId)

  const getCompensationByReviewId = (reviewId: string) => 
    compensations.value.find(c => c.reviewId === reviewId)

  const createFollowUp = (reviewId: string, submittedBy: string, submittedByRole: ReviewFollowUp['submittedByRole'], content: string, actionTaken: string) => {
    const newFollowUp: ReviewFollowUp = {
      id: `f${Date.now()}`,
      reviewId,
      submittedBy,
      submittedByRole,
      submittedAt: new Date().toLocaleString('zh-CN'),
      content,
      actionTaken,
      status: 'processing',
      nextAction: submittedByRole === 'customer_service' ? '联系家政员核实情况' : submittedByRole === 'cleaner' ? '提交质检主管审批' : '等待处理'
    }
    followUps.value.push(newFollowUp)
    
    const review = getReviewById(reviewId)
    if (review) {
      review.status = 'reviewed'
    }
    
    return newFollowUp
  }

  const createCompensation = (reviewId: string, followUpId: string, amount: number, type: string, description: string) => {
    const newCompensation: Compensation = {
      id: `com${Date.now()}`,
      reviewId,
      followUpId,
      amount,
      type: type as Compensation['type'],
      approvedBy: null,
      approvedAt: null,
      status: 'pending',
      description,
      createdAt: new Date().toLocaleString('zh-CN')
    }
    compensations.value.push(newCompensation)
    return newCompensation
  }

  const approveCompensation = (compensationId: string, approvedBy: string) => {
    const compensation = compensations.value.find(c => c.id === compensationId)
    if (compensation) {
      compensation.status = 'approved'
      compensation.approvedBy = approvedBy
      compensation.approvedAt = new Date().toLocaleString('zh-CN')
    }
  }

  const rejectCompensation = (compensationId: string) => {
    const compensation = compensations.value.find(c => c.id === compensationId)
    if (compensation) {
      compensation.status = 'rejected'
    }
  }

  const processCompensation = (compensationId: string) => {
    const compensation = compensations.value.find(c => c.id === compensationId)
    if (compensation && compensation.status === 'approved') {
      compensation.status = 'processed'
      
      const review = getReviewById(compensation.reviewId)
      if (review) {
        review.status = 'resolved'
      }
    }
  }

  const updateFollowUpStatus = (followUpId: string, status: ReviewFollowUp['status']) => {
    const followUp = followUps.value.find(f => f.id === followUpId)
    if (followUp) {
      followUp.status = status
      if (status === 'completed') {
        followUp.nextAction = null
      }
    }
  }

  return {
    reviews,
    followUps,
    compensations,
    pendingReviews,
    reviewedReviews,
    resolvedReviews,
    getReviewById,
    getFollowUpsByReviewId,
    getCompensationByReviewId,
    createFollowUp,
    createCompensation,
    approveCompensation,
    rejectCompensation,
    processCompensation,
    updateFollowUpStatus
  }
}

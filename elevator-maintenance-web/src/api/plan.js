import request from '@/utils/request'

export const getPlans = (params) => {
  return request({
    url: '/plans',
    method: 'get',
    params
  })
}

export const getPlanById = (id) => {
  return request({
    url: `/plans/${id}`,
    method: 'get'
  })
}

export const getPlanNotes = (planId) => {
  return request({
    url: `/plans/${planId}/notes`,
    method: 'get'
  })
}

export const createPlan = (data) => {
  return request({
    url: '/plans',
    method: 'post',
    data
  })
}

export const dispatchPlan = (id, data) => {
  return request({
    url: `/plans/${id}/dispatch`,
    method: 'post',
    data
  })
}

export const reviewPlan = (id, data) => {
  return request({
    url: `/plans/${id}/review`,
    method: 'post',
    data
  })
}

export const batchReviewPlans = (data) => {
  return request({
    url: '/plans/batch-review',
    method: 'post',
    data
  })
}

export const addPlanNote = (planId, data) => {
  return request({
    url: `/plans/${planId}/notes`,
    method: 'post',
    data
  })
}

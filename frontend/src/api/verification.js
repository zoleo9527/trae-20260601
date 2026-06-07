import request from '@/utils/request'

export function createVerification(data) {
  return request.post('/verification', data)
}

export function getVerificationPage(params) {
  return request.get('/verification/page', { params })
}

export function getVerification(id) {
  return request.get(`/verification/${id}`)
}

export function getVerificationItems(id) {
  return request.get(`/verification/${id}/items`)
}

export function approveVerification(id) {
  return request.put(`/verification/${id}/approve`)
}

export function rejectVerification(id, reason) {
  return request.put(`/verification/${id}/reject`, { reason })
}

export function getTodayPendingVerification() {
  return request.get('/verification/today/pending')
}

export function getTimeoutVerification() {
  return request.get('/verification/timeout')
}

export function getRecentlyRejectedVerification() {
  return request.get('/verification/recently-rejected')
}

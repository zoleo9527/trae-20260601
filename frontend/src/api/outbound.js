import request from '@/utils/request'

export function createOutbound(data) {
  return request.post('/outbound', data)
}

export function getOutboundPage(params) {
  return request.get('/outbound/page', { params })
}

export function getOutbound(id) {
  return request.get(`/outbound/${id}`)
}

export function getOutboundItems(id) {
  return request.get(`/outbound/${id}/items`)
}

export function completeOutbound(id) {
  return request.put(`/outbound/${id}/complete`)
}

export function rejectOutbound(id, reason) {
  return request.put(`/outbound/${id}/reject`, { reason })
}

export function getTodayPendingOutbound() {
  return request.get('/outbound/today/pending')
}

export function getTimeoutOutbound() {
  return request.get('/outbound/timeout')
}

export function getRecentlyRejectedOutbound() {
  return request.get('/outbound/recently-rejected')
}

import request from './request'

export function getComplaintList(params) {
  return request.get('/complaints', { params })
}

export function getComplaintDetail(id) {
  return request.get(`/complaints/${id}`)
}

export function createComplaint(data) {
  return request.post('/complaints', data)
}

export function claimComplaint(id, operatorId) {
  return request.put(`/complaints/${id}/claim`, { operatorId })
}

export function verifyComplaint(id, data) {
  return request.put(`/complaints/${id}/verify`, data)
}

export function compensateComplaint(id, data) {
  return request.put(`/complaints/${id}/compensate`, data)
}

export function returnComplaint(id, data) {
  return request.put(`/complaints/${id}/return`, data)
}

export function closeComplaint(id, data) {
  return request.put(`/complaints/${id}/close`, data)
}

export function rejectComplaint(id, data) {
  return request.put(`/complaints/${id}/reject`, data)
}

export function addRemark(id, data) {
  return request.post(`/complaints/${id}/remarks`, data)
}

export function getComplaintTypes() {
  return request.get('/complaints/meta/types')
}

export function getStatusList() {
  return request.get('/complaints/meta/statuses')
}

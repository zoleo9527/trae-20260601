import request from './index'

export function createAttachment(data: Record<string, any>) {
  return request.post('/attachments', data)
}

export function deleteAttachment(id: number) {
  return request.delete(`/attachments/${id}`)
}

export function updateAttachment(id: number, data: Record<string, any>) {
  return request.patch(`/attachments/${id}`, data)
}

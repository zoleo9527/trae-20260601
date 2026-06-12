import request from './request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  getCurrentUser: () => request.get('/auth/me')
}

export const propertyApi = {
  getList: (params) => request.get('/properties', { params }),
  getDetail: (id) => request.get(`/properties/${id}`),
  create: (data) => request.post('/properties', data),
  update: (id, data) => request.put(`/properties/${id}`, data),
  updateVacancy: (id, data) => request.put(`/properties/${id}/vacancy`, data),
  getTimeline: (id) => request.get(`/properties/${id}/timeline`),
  getBuildings: () => request.get('/properties/buildings/list')
}

export const viewingApi = {
  getList: (params) => request.get('/viewings', { params }),
  getDetail: (id) => request.get(`/viewings/${id}`),
  create: (data) => request.post('/viewings', data),
  update: (id, data) => request.put(`/viewings/${id}`, data),
  getTimeline: (id) => request.get(`/viewings/${id}/timeline`)
}

export const exceptionApi = {
  getList: (params) => request.get('/exceptions', { params }),
  getDetail: (id) => request.get(`/exceptions/${id}`),
  create: (data) => request.post('/exceptions', data),
  update: (id, data) => request.put(`/exceptions/${id}`, data),
  getTypes: () => request.get('/exceptions/types/list'),
  getTimeline: (id) => request.get(`/exceptions/${id}/timeline`)
}

export const attachmentApi = {
  getList: (params) => request.get('/attachments', { params }),
  create: (data) => request.post('/attachments', data),
  upload: (formData, params) => request.post('/attachments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params
  }),
  delete: (id) => request.delete(`/attachments/${id}`)
}

export const handoverApi = {
  getSummary: (params) => request.get('/handover/summary', { params }),
  getRecords: (params) => request.get('/handover/records', { params }),
  getRecord: (id) => request.get(`/handover/records/${id}`),
  createRecord: (data) => request.post('/handover/records', data),
  confirmRecord: (id, data) => request.put(`/handover/records/${id}/confirm`, data),
  getSnapshot: (id) => request.get(`/handover/records/${id}/snapshot`)
}

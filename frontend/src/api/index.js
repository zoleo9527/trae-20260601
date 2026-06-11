import request from '@/utils/request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  logout: () => request.post('/auth/logout'),
  getCurrentUser: () => request.get('/auth/me'),
  getUsers: () => request.get('/auth/users')
}

export const discountApi = {
  getList: (params) => request.get('/discount', { params }),
  getDetail: (id) => request.get(`/discount/${id}`),
  create: (data) => request.post('/discount', data),
  update: (id, data) => request.put(`/discount/${id}`, data),
  submit: (id, data) => request.post(`/discount/${id}/submit`, data),
  startReview: (id) => request.post(`/discount/${id}/start-review`),
  review: (id, data) => request.post(`/discount/${id}/review`, data),
  approve: (id, data) => request.post(`/discount/${id}/approve`, data),
  reject: (id, data) => request.post(`/discount/${id}/reject`, data),
  raiseException: (id, data) => request.post(`/discount/${id}/raise-exception`, data),
  resolveException: (id, data) => request.post(`/discount/${id}/resolve-exception`, data),
  getStatistics: () => request.get('/discount/statistics'),
  getRecords: (id) => request.get(`/discount/${id}/records`),
  addRecord: (id, data) => request.post(`/discount/${id}/records`, data)
}

export const priceReportApi = {
  getList: (params) => request.get('/price-report', { params }),
  getDetail: (id) => request.get(`/price-report/${id}`),
  create: (data) => request.post('/price-report', data),
  update: (id, data) => request.put(`/price-report/${id}`, data),
  submit: (id, data) => request.post(`/price-report/${id}/submit`, data),
  verify: (id, data) => request.post(`/price-report/${id}/verify`, data),
  reject: (id, data) => request.post(`/price-report/${id}/reject`, data),
  raiseException: (id, data) => request.post(`/price-report/${id}/raise-exception`, data),
  resolveException: (id, data) => request.post(`/price-report/${id}/resolve-exception`, data),
  getStatistics: () => request.get('/price-report/statistics'),
  validate: (data) => request.post('/price-report/validate', data)
}

export const logApi = {
  getList: (params) => request.get('/logs', { params }),
  getCampaignLogs: (id) => request.get(`/logs/campaign/${id}`),
  getPriceReportLogs: (id) => request.get(`/logs/price-report/${id}`),
  getMyLogs: (params) => request.get('/logs/my-logs', { params })
}

export const batchApi = {
  submitCampaigns: (data) => request.post('/batch/discount/submit', data),
  approveCampaigns: (data) => request.post('/batch/discount/approve', data),
  rejectCampaigns: (data) => request.post('/batch/discount/reject', data),
  raiseExceptionCampaigns: (data) => request.post('/batch/discount/raise-exception', data),
  verifyReports: (data) => request.post('/batch/price-report/verify', data),
  rejectReports: (data) => request.post('/batch/price-report/reject', data)
}

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  getCurrentUser: () => api.get('/auth/current-user'),
  switchRole: (role) => api.post('/auth/switch-role', { role }),
  getPermissions: (role) => api.get('/auth/permissions', { params: { role } }),
  getUsers: () => api.get('/auth/users')
};

export const trainingApi = {
  getProjects: (params) => api.get('/training/projects', { params }),
  getProject: (id) => api.get(`/training/projects/${id}`),
  createProject: (data) => api.post('/training/projects', data),
  updateProject: (id, data) => api.put(`/training/projects/${id}`, data),
  getRegistrations: (params) => api.get('/training/registrations', { params }),
  updateRegistration: (id, data) => api.put(`/training/registrations/${id}`, data)
};

export const certificateApi = {
  getList: (params) => api.get('/certificate', { params }),
  getDetail: (id) => api.get(`/certificate/${id}`),
  getHistory: (id) => api.get(`/certificate/${id}/history`),
  create: (data) => api.post('/certificate', data),
  update: (id, data) => api.put(`/certificate/${id}`, data),
  batchAction: (data) => api.post('/certificate/batch', data)
};

export const evaluationApi = {
  getList: (params) => api.get('/evaluation', { params }),
  getDetail: (id) => api.get(`/evaluation/${id}`),
  getStatistics: (params) => api.get('/evaluation/statistics', { params }),
  update: (id, data) => api.put(`/evaluation/${id}`, data),
  recalculate: (projectId, reason) => api.post(`/evaluation/recalculate/${projectId}`, { reason })
};

export const exceptionApi = {
  getList: (params) => api.get('/exception', { params }),
  getDetail: (id) => api.get(`/exception/${id}`),
  getHistory: (id) => api.get(`/exception/${id}/history`),
  create: (data) => api.post('/exception', data),
  update: (id, data) => api.put(`/exception/${id}`, data)
};

export const attendanceApi = {
  checkIn: (id, data) => api.put(`/attendance/${id}/check-in`, data),
  checkOut: (id) => api.put(`/attendance/${id}/check-out`)
};

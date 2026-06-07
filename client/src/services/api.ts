import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/users/login', { username, password }).then(res => res.data)
};

export const inspectionAPI = {
  list: (params?: any) => api.get('/inspections', { params }).then(res => res.data),
  get: (id: string) => api.get(`/inspections/${id}`).then(res => res.data),
  create: (data: any) => api.post('/inspections', data).then(res => res.data),
  complete: (id: string, data: any) => api.put(`/inspections/${id}/complete`, data).then(res => res.data),
  return: (id: string, data: any) => api.put(`/inspections/${id}/return`, data).then(res => res.data),
  supplement: (id: string, data: any) => api.put(`/inspections/${id}/supplement`, data).then(res => res.data),
  review: (id: string, data: any) => api.put(`/inspections/${id}/review`, data).then(res => res.data)
};

export const repairAPI = {
  list: (params?: any) => api.get('/repairs', { params }).then(res => res.data),
  get: (id: string) => api.get(`/repairs/${id}`).then(res => res.data),
  create: (data: any) => api.post('/repairs', data).then(res => res.data),
  submit: (id: string, data: any) => api.put(`/repairs/${id}/submit`, data).then(res => res.data),
  approve: (id: string, data: any) => api.put(`/repairs/${id}/approve`, data).then(res => res.data),
  assign: (id: string, data: any) => api.put(`/repairs/${id}/assign`, data).then(res => res.data),
  start: (id: string, data: any) => api.put(`/repairs/${id}/start`, data).then(res => res.data),
  complete: (id: string, data: any) => api.put(`/repairs/${id}/complete`, data).then(res => res.data),
  return: (id: string, data: any) => api.put(`/repairs/${id}/return`, data).then(res => res.data),
  supplement: (id: string, data: any) => api.put(`/repairs/${id}/supplement`, data).then(res => res.data),
  review: (id: string, data: any) => api.put(`/repairs/${id}/review`, data).then(res => res.data)
};

export const machineAPI = {
  list: (params?: any) => api.get('/machines', { params }).then(res => res.data),
  get: (id: string) => api.get(`/machines/${id}`).then(res => res.data)
};

export const userAPI = {
  list: (params?: any) => api.get('/users', { params }).then(res => res.data)
};

export const notificationAPI = {
  list: (params?: any) => api.get('/notifications', { params }).then(res => res.data),
  markRead: (id: string) => api.put(`/notifications/${id}/read`).then(res => res.data),
  markAllRead: (userId: string) => api.put('/notifications/read-all', { userId }).then(res => res.data)
};

export default api;

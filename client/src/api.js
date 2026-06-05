import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const currentRole = localStorage.getItem('currentRole');
  const currentUserId = localStorage.getItem('currentUserId');
  if (currentRole) config.headers['x-role'] = currentRole;
  if (currentUserId) config.headers['x-user-id'] = currentUserId;
  return config;
});

export const dashboardAPI = {
  getToday: () => api.get('/dashboard/today').then(res => res.data)
};

export const userAPI = {
  getAll: () => api.get('/users').then(res => res.data),
  getCurrent: () => api.get('/users/current').then(res => res.data),
  login: (username, password) => api.post('/auth/login', { username, password }).then(res => res.data)
};

export const scheduleAPI = {
  getAll: (params) => api.get('/schedules', { params }).then(res => res.data),
  create: (data) => api.post('/schedules', data).then(res => res.data),
  updateStatus: (id, data) => api.put(`/schedules/${id}/status`, data).then(res => res.data)
};

export const reservationAPI = {
  getAll: (params) => api.get('/reservations', { params }).then(res => res.data)
};

export const memberAPI = {
  getAll: () => api.get('/members').then(res => res.data)
};

export const routeAPI = {
  getAll: () => api.get('/routes').then(res => res.data)
};

export const maintenanceAPI = {
  getAll: () => api.get('/maintenance').then(res => res.data),
  updateStatus: (id, data) => api.put(`/maintenance/${id}/status`, data).then(res => res.data)
};

export const riskAPI = {
  getAll: (params) => api.get('/risks', { params }).then(res => res.data),
  create: (data) => api.post('/risks', data).then(res => res.data),
  updateStatus: (id, data) => api.put(`/risks/${id}/status`, data).then(res => res.data)
};

export const logAPI = {
  getAll: () => api.get('/logs').then(res => res.data),
  create: (data) => api.post('/logs', data).then(res => res.data)
};

export default api;

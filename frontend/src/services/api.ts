import axios from 'axios';
import { Appointment, Dock, User } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const authApi = {
  login: (username: string, password: string) =>
    api.post<User>('/auth/login', { username, password }).then((res) => res.data),
  getUsers: () => api.get<User[]>('/auth/users').then((res) => res.data),
};

export const appointmentsApi = {
  create: (data: any) => api.post<Appointment>('/appointments', data).then((res) => res.data),
  getList: (params?: any) =>
    api.get<{ items: Appointment[]; total: number }>('/appointments', { params }).then((res) => res.data),
  getDetail: (id: string) => api.get<Appointment>(`/appointments/${id}`).then((res) => res.data),
  getLogs: (id: string) => api.get(`/appointments/${id}/logs`).then((res) => res.data),
  getStats: () => api.get('/appointments/stats').then((res) => res.data),
  approve: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/approve`, data).then((res) => res.data),
  reject: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/reject`, data).then((res) => res.data),
  supplement: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/supplement`, data).then((res) => res.data),
  assignDock: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/assign-dock`, data).then((res) => res.data),
  reassignDock: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/reassign-dock`, data).then((res) => res.data),
  checkIn: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/check-in`, data).then((res) => res.data),
  startLoading: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/start-loading`, data).then((res) => res.data),
  complete: (id: string, data: any) =>
    api.post<Appointment>(`/appointments/${id}/complete`, data).then((res) => res.data),
};

export const docksApi = {
  getAll: () => api.get<Dock[]>('/docks').then((res) => res.data),
  getAvailable: () => api.get<Dock[]>('/docks/available').then((res) => res.data),
  getDetail: (id: string) => api.get<Dock>(`/docks/${id}`).then((res) => res.data),
};

export default api;

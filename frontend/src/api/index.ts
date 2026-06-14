import axios from 'axios';
import { UserRole } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

interface ApiConfig {
  role?: UserRole;
  userId?: string;
  userName?: string;
}

let currentConfig: ApiConfig = {};

export const setApiConfig = (config: ApiConfig) => {
  currentConfig = config;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (currentConfig.role) {
    config.headers['x-role'] = currentConfig.role;
  }
  if (currentConfig.userId) {
    config.headers['x-user-id'] = currentConfig.userId;
  }
  if (currentConfig.userName) {
    config.headers['x-user-name'] = currentConfig.userName;
  }
  return config;
});

export const api = {
  examTracks: {
    list: () => axiosInstance.get('/exam-tracks').then(res => res.data),
    get: (id: string) => axiosInstance.get(`/exam-tracks/${id}`).then(res => res.data),
    create: (data: any) => axiosInstance.post('/exam-tracks', data).then(res => res.data),
    update: (id: string, data: any) => axiosInstance.put(`/exam-tracks/${id}`, data).then(res => res.data),
    submit: (id: string) => axiosInstance.post(`/exam-tracks/${id}/submit`).then(res => res.data),
    approve: (id: string) => axiosInstance.post(`/exam-tracks/${id}/approve`).then(res => res.data),
    reject: (id: string, reason: string) => axiosInstance.post(`/exam-tracks/${id}/reject`, { reason }).then(res => res.data),
    supplement: (id: string, data: any) => axiosInstance.post(`/exam-tracks/${id}/supplement`, data).then(res => res.data),
    startPractice: (id: string) => axiosInstance.post(`/exam-tracks/${id}/start-practice`).then(res => res.data),
    updateProgress: (id: string, progress: number) => axiosInstance.post(`/exam-tracks/${id}/progress`, { progress }).then(res => res.data),
    complete: (id: string) => axiosInstance.post(`/exam-tracks/${id}/complete`).then(res => res.data),
    confirmExam: (id: string, passed: boolean) => axiosInstance.post(`/exam-tracks/${id}/confirm-exam`, { passed }).then(res => res.data),
    logs: (id: string) => axiosInstance.get(`/exam-tracks/${id}/logs`).then(res => res.data),
  },
  users: {
    list: () => axiosInstance.get('/users').then(res => res.data),
    get: (id: string) => axiosInstance.get(`/users/${id}`).then(res => res.data),
    create: (data: any) => axiosInstance.post('/users', data).then(res => res.data),
  },
  health: () => axiosInstance.get('/health').then(res => res.data),
};

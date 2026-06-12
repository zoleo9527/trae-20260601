import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const request = <T>(config: AxiosRequestConfig): Promise<T> => {
  return api.request(config).then((res) => res.data);
};

export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>({
      method: 'POST',
      url: '/auth/login',
      data: { username, password },
    }),
  logout: () =>
    request({
      method: 'POST',
      url: '/auth/logout',
    }),
  me: () =>
    request({
      method: 'GET',
      url: '/auth/me',
    }),
};

export const projectsApi = {
  list: (params?: any) =>
    request<{ items: any[]; total: number }>({
      method: 'GET',
      url: '/projects',
      params,
    }),
  detail: (id: string) =>
    request<{ project: any; arrangement: any; signinRecords: any[]; exceptions: any[] }>({
      method: 'GET',
      url: `/projects/${id}`,
    }),
  analysis: (id: string) =>
    request<{ blockAnalysis: any; signinAnalysis: any; responsibilityMatrix: any }>({
      method: 'GET',
      url: `/projects/${id}/analysis`,
    }),
  timeline: (id: string) =>
    request<{ events: any[] }>({
      method: 'GET',
      url: `/projects/${id}/timeline`,
    }),
  create: (data: any) =>
    request({
      method: 'POST',
      url: '/projects',
      data,
    }),
  transition: (id: string, data: any) =>
    request({
      method: 'POST',
      url: `/projects/${id}/transition`,
      data,
    }),
};

export const arrangementsApi = {
  create: (data: any) =>
    request({
      method: 'POST',
      url: '/arrangements',
      data,
    }),
  submit: (id: string) =>
    request({
      method: 'POST',
      url: `/arrangements/${id}/submit`,
    }),
  approve: (id: string, data: any) =>
    request({
      method: 'POST',
      url: `/arrangements/${id}/approve`,
      data,
    }),
  reject: (id: string, data: any) =>
    request({
      method: 'POST',
      url: `/arrangements/${id}/reject`,
      data,
    }),
  update: (id: string, data: any) =>
    request({
      method: 'PUT',
      url: `/arrangements/${id}`,
      data,
    }),
};

export const signinApi = {
  analysis: (arrangementId: string) =>
    request({
      method: 'GET',
      url: `/signin/analysis/${arrangementId}`,
    }),
  confirm: (id: string, data?: any) =>
    request({
      method: 'POST',
      url: `/signin/${id}/confirm`,
      data,
    }),
  absent: (id: string, data: any) =>
    request({
      method: 'POST',
      url: `/signin/${id}/absent`,
      data,
    }),
  leave: (id: string, data: any) =>
    request({
      method: 'POST',
      url: `/signin/${id}/leave`,
      data,
    }),
};

export const exceptionsApi = {
  list: (params?: any) =>
    request<{ items: any[]; total: number }>({
      method: 'GET',
      url: '/exceptions',
      params,
    }),
  detail: (id: string) =>
    request({
      method: 'GET',
      url: `/exceptions/${id}`,
    }),
  triggerSample: (data: any) =>
    request({
      method: 'POST',
      url: '/exceptions/trigger-sample',
      data,
    }),
  handle: (id: string, data: any) =>
    request({
      method: 'POST',
      url: `/exceptions/${id}/handle`,
      data,
    }),
  reject: (id: string, data: any) =>
    request({
      method: 'POST',
      url: `/exceptions/${id}/reject`,
      data,
    }),
};

export default api;

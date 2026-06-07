import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useStore } from '@/store';

const BASE_URL = '/api';

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const state = useStore.getState();
    if (state.currentUser) {
      config.headers['X-User-Role'] = state.currentUser.role;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data.data;
  },
  (error) => {
    console.error('API Error:', error);
    const message = error.response?.data?.message || error.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

export default request;

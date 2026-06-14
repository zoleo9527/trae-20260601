import axios from 'axios';
import { API_BASE_URL } from '../utils/constants.js';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const STORAGE_KEY = {
  TOKEN: 'judicial_token',
  USER: 'judicial_user'
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEY.TOKEN);
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
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const message = error.response.data?.error?.message || '请求失败';
      console.error('API Error:', message);
      
      if (error.response.status === 401) {
        localStorage.removeItem(STORAGE_KEY.TOKEN);
        localStorage.removeItem(STORAGE_KEY.USER);
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error('网络连接失败'));
    } else {
      return Promise.reject(error);
    }
  }
);

export default api;

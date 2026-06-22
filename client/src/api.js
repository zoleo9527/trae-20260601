import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('API Error:', err);
    return Promise.reject(err.response?.data || err);
  }
);

export default api;

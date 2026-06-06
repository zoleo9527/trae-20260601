import axios from 'axios';

const request = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

request.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code === 0) {
      return response.data.data;
    }
    return Promise.reject(new Error(response.data?.message || '请求失败'));
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default request;

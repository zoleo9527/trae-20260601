import axios from 'axios';
const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    getDemoAccounts: () => api.get('/auth/demo-accounts'),
};
export const propertyAPI = {
    list: (params) => api.get('/properties', { params }),
    get: (id) => api.get(`/properties/${id}`),
    create: (data) => api.post('/properties', data),
    update: (id, data) => api.put(`/properties/${id}`, data),
    transition: (id, toStatus, remark) => api.post(`/properties/${id}/transition`, { toStatus, remark }),
    getAvailableTransitions: (id) => api.get(`/properties/${id}/available-transitions`),
    getRelated: (id) => api.get(`/properties/${id}/related`),
    getStatistics: () => api.get('/properties/statistics/summary'),
};
export const viewingAPI = {
    list: (params) => api.get('/viewings', { params }),
    get: (id) => api.get(`/viewings/${id}`),
    create: (data) => api.post('/viewings', data),
    update: (id, data) => api.put(`/viewings/${id}`, data),
    complete: (id, data) => api.post(`/viewings/${id}/complete`, data),
    cancel: (id, reason) => api.post(`/viewings/${id}/cancel`, { reason }),
};
export const quotationAPI = {
    list: (params) => api.get('/quotations', { params }),
    get: (id) => api.get(`/quotations/${id}`),
    create: (data) => api.post('/quotations', data),
    update: (id, data) => api.put(`/quotations/${id}`, data),
    submit: (id) => api.post(`/quotations/${id}/submit`),
    approve: (id, approvalComment) => api.post(`/quotations/${id}/approve`, { approvalComment }),
    reject: (id, approvalComment) => api.post(`/quotations/${id}/reject`, { approvalComment }),
};
export const contractAPI = {
    list: (params) => api.get('/contracts', { params }),
    get: (id) => api.get(`/contracts/${id}`),
    create: (data) => api.post('/contracts', data),
    update: (id, data) => api.put(`/contracts/${id}`, data),
    submitReview: (id) => api.post(`/contracts/${id}/submit-review`),
    approve: (id, reviewComment) => api.post(`/contracts/${id}/approve`, { reviewComment }),
    reject: (id, reviewComment) => api.post(`/contracts/${id}/reject`, { reviewComment }),
    sign: (id, data) => api.post(`/contracts/${id}/sign`, data),
};
export const handoverAPI = {
    list: (params) => api.get('/handover', { params }),
    get: (id) => api.get(`/handover/${id}`),
    create: (data) => api.post('/handover', data),
    update: (id, data) => api.put(`/handover/${id}`, data),
    signReceiver: (id, receiverName) => api.post(`/handover/${id}/sign-receiver`, { receiverName }),
    complete: (id, data) => api.post(`/handover/${id}/complete`, data),
};
export const depositAPI = {
    list: (params) => api.get('/deposits', { params }),
    get: (id) => api.get(`/deposits/${id}`),
    create: (data) => api.post('/deposits', data),
    confirmPayment: (id) => api.post(`/deposits/${id}/confirm-payment`),
    startRefund: (id, refundAmount) => api.post(`/deposits/${id}/start-refund`, { refundAmount }),
    confirmRefund: (id) => api.post(`/deposits/${id}/confirm-refund`),
    deduct: (id, data) => api.post(`/deposits/${id}/deduct`, data),
    dispute: (id, disputes) => api.post(`/deposits/${id}/dispute`, { disputes }),
    getStatistics: () => api.get('/deposits/statistics/summary'),
};
export const logsAPI = {
    list: (params) => api.get('/logs', { params }),
    getEntityLogs: (entityType, entityId) => api.get(`/logs/entity/${entityType}/${entityId}`),
    getTimeline: (entityType, entityId) => api.get(`/logs/timeline/${entityType}/${entityId}`),
};
export default api;

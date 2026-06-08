import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export const gateApi = {
  registerEntry: (data: Record<string, unknown>) => api.post('/gate/entry', data),
  modifyEntry: (id: number, data: Record<string, unknown>) => api.put(`/gate/entry/${id}`, data),
  listEntries: (params?: Record<string, unknown>) => api.get('/gate/entries', { params }),
  getEntry: (id: number) => api.get(`/gate/entry/${id}`),
  listDeparting: () => api.get('/gate/departing'),
  departConfirm: (data: Record<string, unknown>) => api.post('/gate/depart-confirm', data),
};

export const yardApi = {
  getSlots: (params?: Record<string, unknown>) => api.get('/yard/slots', { params }),
  allocateSlot: (data: Record<string, unknown>) => api.post('/yard/allocate', data),
  reallocateContainer: (id: number, data: Record<string, unknown>) => api.put(`/yard/reallocate/${id}`, data),
  getAllocationHistory: (containerNo: string) => api.get(`/yard/allocation-history/${containerNo}`),
  getMisplaced: () => api.get('/yard/misplaced'),
  fixMisplaced: (id: number, data: Record<string, unknown>) => api.post(`/yard/fix-misplaced/${id}`, data),
};

export const customerApi = {
  getOverdueFees: (params?: Record<string, unknown>) => api.get('/customer/overdue-fees', { params }),
  createFeeDispute: (data: Record<string, unknown>) => api.post('/customer/fee-dispute', data),
  resolveFeeDispute: (id: number, data: Record<string, unknown>) => api.put(`/customer/fee-dispute/${id}`, data),
  getInspectionPlans: (params?: Record<string, unknown>) => api.get('/customer/inspection-plans', { params }),
  notifyInspection: (id: number, data: Record<string, unknown>) => api.post(`/customer/notify-inspection/${id}`, data),
  getMissedNotifications: () => api.get('/customer/missed-notifications'),
  listPickupContainers: () => api.get('/customer/pickup-containers'),
  pickupRequest: (data: Record<string, unknown>) => api.post('/customer/pickup-request', data),
  listPickupRecords: (params?: Record<string, unknown>) => api.get('/customer/pickup-records', { params }),
  pickupCancel: (data: Record<string, unknown>) => api.post('/customer/pickup-cancel', data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentAlerts: (params?: Record<string, unknown>) => api.get('/dashboard/recent-alerts', { params }),
};

export const exportApi = {
  createExportTask: (data: Record<string, unknown>) => api.post('/export/create', data),
  listExportTasks: (params?: Record<string, unknown>) => api.get('/export/tasks', { params }),
  downloadExport: (id: number) => api.get(`/export/download/${id}`, { responseType: 'blob' }),
};

export const statusApi = {
  getChangeHistory: (containerNo: string) => api.get(`/yard/allocation-history/${containerNo}`),
};

export default api;

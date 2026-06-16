const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getStores: () => ipcRenderer.invoke('db:getStores'),
  getProducts: () => ipcRenderer.invoke('db:getProducts'),
  getEmployees: () => ipcRenderer.invoke('db:getEmployees'),
  getShortageRequests: (filters) => ipcRenderer.invoke('db:getShortageRequests', filters),
  createShortageRequest: (data) => ipcRenderer.invoke('db:createShortageRequest', data),
  reviewShortageRequest: (id, data) => ipcRenderer.invoke('db:reviewShortageRequest', id, data),
  getAllocations: (filters) => ipcRenderer.invoke('db:getAllocations', filters),
  createAllocation: (data) => ipcRenderer.invoke('db:createAllocation', data),
  updateAllocationStatus: (id, status) => ipcRenderer.invoke('db:updateAllocationStatus', id, status),
  getReceipts: (filters) => ipcRenderer.invoke('db:getReceipts', filters),
  createReceipt: (data) => ipcRenderer.invoke('db:createReceipt', data),
  getDiscrepancies: (filters) => ipcRenderer.invoke('db:getDiscrepancies', filters),
  createDiscrepancy: (data) => ipcRenderer.invoke('db:createDiscrepancy', data),
  resolveDiscrepancy: (id, data) => ipcRenderer.invoke('db:resolveDiscrepancy', id, data),
  getFeedbacks: (filters) => ipcRenderer.invoke('db:getFeedbacks', filters),
  createFeedback: (data) => ipcRenderer.invoke('db:createFeedback', data),
  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats')
});
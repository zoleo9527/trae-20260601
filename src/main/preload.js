const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAppointments: (filters) => ipcRenderer.invoke('db:getAppointments', filters),
  getAppointment: (id) => ipcRenderer.invoke('db:getAppointment', id),
  createAppointment: (data) => ipcRenderer.invoke('db:createAppointment', data),
  updateAppointment: (id, data) => ipcRenderer.invoke('db:updateAppointment', id, data),
  createStyleConfirmation: (data) => ipcRenderer.invoke('db:createStyleConfirmation', data),
  getStyleConfirmations: (filters) => ipcRenderer.invoke('db:getStyleConfirmations', filters),
  getStyleConfirmation: (id) => ipcRenderer.invoke('db:getStyleConfirmation', id),
  updateStyleConfirmation: (id, data) => ipcRenderer.invoke('db:updateStyleConfirmation', id, data),
  getOperationHistory: (filters) => ipcRenderer.invoke('db:getOperationHistory', filters),
  addOperationHistory: (data) => ipcRenderer.invoke('db:addOperationHistory', data),
  getRecentItems: () => ipcRenderer.invoke('db:getRecentItems'),
  addRecentItem: (data) => ipcRenderer.invoke('db:addRecentItem', data),
  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
  getRiskItems: () => ipcRenderer.invoke('db:getRiskItems'),
  getEmployees: () => ipcRenderer.invoke('db:getEmployees'),
  createMeasurement: (data) => ipcRenderer.invoke('db:createMeasurement', data),
  getMeasurements: (appointmentId) => ipcRenderer.invoke('db:getMeasurements', appointmentId),
  createFittingRecord: (data) => ipcRenderer.invoke('db:createFittingRecord', data),
  getFittingRecords: (appointmentId) => ipcRenderer.invoke('db:getFittingRecords', appointmentId),
  createFabricCard: (data) => ipcRenderer.invoke('db:createFabricCard', data),
  getFabricCards: (appointmentId) => ipcRenderer.invoke('db:getFabricCards', appointmentId)
});

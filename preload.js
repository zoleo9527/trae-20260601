const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getHandlers: (role) => ipcRenderer.invoke('get-handlers', role),

  createOrder: (o) => ipcRenderer.invoke('create-order', o),
  updateOrder: (id, fields) => ipcRenderer.invoke('update-order', id, fields),
  getOrders: (filter) => ipcRenderer.invoke('get-orders', filter),
  getOrderById: (id) => ipcRenderer.invoke('get-order-by-id', id),

  createDispatch: (d) => ipcRenderer.invoke('create-dispatch', d),
  updateDispatch: (id, fields) => ipcRenderer.invoke('update-dispatch', id, fields),
  getDispatchesByOrder: (orderId) => ipcRenderer.invoke('get-dispatches-by-order', orderId),
  getDispatches: (filter) => ipcRenderer.invoke('get-dispatches', filter),

  createSignature: (s) => ipcRenderer.invoke('create-signature', s),
  updateSignature: (id, fields) => ipcRenderer.invoke('update-signature', id, fields),
  getSignaturesByDispatch: (dispatchId) => ipcRenderer.invoke('get-signatures-by-dispatch', dispatchId),
  getSignatures: (filter) => ipcRenderer.invoke('get-signatures', filter),

  createException: (e) => ipcRenderer.invoke('create-exception', e),
  updateException: (id, fields) => ipcRenderer.invoke('update-exception', id, fields),
  getExceptions: (filter) => ipcRenderer.invoke('get-exceptions', filter),

  createHandoverLog: (l) => ipcRenderer.invoke('create-handover-log', l),
  getHandoverLogs: (orderId) => ipcRenderer.invoke('get-handover-logs', orderId),

  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getOrderFullDetail: (orderId) => ipcRenderer.invoke('get-order-full-detail', orderId),
});

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  stalls: {
    list: (params) => ipcRenderer.invoke('stalls:list', params),
    get: (id) => ipcRenderer.invoke('stalls:get', id),
    create: (data) => ipcRenderer.invoke('stalls:create', data),
    update: (id, data) => ipcRenderer.invoke('stalls:update', id, data),
    delete: (id) => ipcRenderer.invoke('stalls:delete', id),
    listWithTenant: () => ipcRenderer.invoke('stalls:listWithTenant')
  },
  
  tenants: {
    list: (params) => ipcRenderer.invoke('tenants:list', params),
    get: (id) => ipcRenderer.invoke('tenants:get', id),
    create: (data) => ipcRenderer.invoke('tenants:create', data),
    update: (id, data) => ipcRenderer.invoke('tenants:update', id, data),
    delete: (id) => ipcRenderer.invoke('tenants:delete', id),
    getActive: () => ipcRenderer.invoke('tenants:getActive')
  },
  
  rent: {
    list: (params) => ipcRenderer.invoke('rent:list', params),
    get: (id) => ipcRenderer.invoke('rent:get', id),
    create: (data) => ipcRenderer.invoke('rent:create', data),
    update: (id, data) => ipcRenderer.invoke('rent:update', id, data),
    delete: (id) => ipcRenderer.invoke('rent:delete', id),
    generateBatch: (year, month) => ipcRenderer.invoke('rent:generateBatch', year, month),
    markPaid: (id, amount, payDate) => ipcRenderer.invoke('rent:markPaid', id, amount, payDate)
  },
  
  utilities: {
    list: (params) => ipcRenderer.invoke('utilities:list', params),
    get: (id) => ipcRenderer.invoke('utilities:get', id),
    create: (data) => ipcRenderer.invoke('utilities:create', data),
    update: (id, data) => ipcRenderer.invoke('utilities:update', id, data),
    delete: (id) => ipcRenderer.invoke('utilities:delete', id),
    getLastReading: (stallId, type) => ipcRenderer.invoke('utilities:getLastReading', stallId, type),
    getAbnormal: () => ipcRenderer.invoke('utilities:getAbnormal')
  },
  
  hygiene: {
    list: (params) => ipcRenderer.invoke('hygiene:list', params),
    get: (id) => ipcRenderer.invoke('hygiene:get', id),
    create: (data) => ipcRenderer.invoke('hygiene:create', data),
    update: (id, data) => ipcRenderer.invoke('hygiene:update', id, data),
    delete: (id) => ipcRenderer.invoke('hygiene:delete', id),
    getUnrectified: () => ipcRenderer.invoke('hygiene:getUnrectified'),
    markRectified: (id, rectifyDate, remark) => ipcRenderer.invoke('hygiene:markRectified', id, rectifyDate, remark)
  },
  
  deductions: {
    list: (params) => ipcRenderer.invoke('deductions:list', params),
    get: (id) => ipcRenderer.invoke('deductions:get', id),
    create: (data) => ipcRenderer.invoke('deductions:create', data),
    update: (id, data) => ipcRenderer.invoke('deductions:update', id, data),
    delete: (id) => ipcRenderer.invoke('deductions:delete', id),
    getSummary: (year, month) => ipcRenderer.invoke('deductions:getSummary', year, month),
    getStats: (year, month) => ipcRenderer.invoke('deductions:getStats', year, month),
    markRectified: (id, rectifyDate, remark) => ipcRenderer.invoke('deductions:markRectified', id, rectifyDate, remark)
  },
  
  reports: {
    getArrears: (year, month) => ipcRenderer.invoke('reports:getArrears', year, month),
    getDeductionDetails: (year, month) => ipcRenderer.invoke('reports:getDeductionDetails', year, month),
    getDashboard: () => ipcRenderer.invoke('reports:getDashboard'),
    generateNotice: (tenantId, type, data) => ipcRenderer.invoke('reports:generateNotice', tenantId, type, data),
    exportToExcel: (type, params) => ipcRenderer.invoke('reports:exportToExcel', type, params)
  },
  
  print: {
    html: (html) => ipcRenderer.invoke('print:html', html)
  }
})

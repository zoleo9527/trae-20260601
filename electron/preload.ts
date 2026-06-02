import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  house: {
    list: () => ipcRenderer.invoke('house:list'),
    search: (keyword: string) => ipcRenderer.invoke('house:search', keyword),
    getById: (id: number) => ipcRenderer.invoke('house:getById', id),
    create: (data: any) => ipcRenderer.invoke('house:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('house:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('house:delete', id)
  },
  resident: {
    list: () => ipcRenderer.invoke('resident:list'),
    search: (keyword: string) => ipcRenderer.invoke('resident:search', keyword),
    getById: (id: number) => ipcRenderer.invoke('resident:getById', id),
    getFullInfo: (id: number) => ipcRenderer.invoke('resident:getFullInfo', id),
    create: (data: any) => ipcRenderer.invoke('resident:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('resident:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('resident:delete', id),
    importCsv: (filePath: string) => ipcRenderer.invoke('resident:importCsv', filePath)
  },
  permissionGroup: {
    list: () => ipcRenderer.invoke('permissionGroup:list'),
    getById: (id: number) => ipcRenderer.invoke('permissionGroup:getById', id),
    create: (data: any) => ipcRenderer.invoke('permissionGroup:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('permissionGroup:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('permissionGroup:delete', id)
  },
  accessCard: {
    list: () => ipcRenderer.invoke('accessCard:list'),
    search: (keyword: string) => ipcRenderer.invoke('accessCard:search', keyword),
    getByResident: (residentId: number) => ipcRenderer.invoke('accessCard:getByResident', residentId),
    create: (data: any) => ipcRenderer.invoke('accessCard:create', data),
    updateStatus: (id: number, status: string, remark?: string) =>
      ipcRenderer.invoke('accessCard:updateStatus', id, status, remark),
    simulateWrite: (cardId: number) => ipcRenderer.invoke('accessCard:simulateWrite', cardId),
    simulateAccess: (cardNo: string, doorName: string) =>
      ipcRenderer.invoke('accessCard:simulateAccess', cardNo, doorName)
  },
  cardApplication: {
    list: (status?: string) => ipcRenderer.invoke('cardApplication:list', status),
    getById: (id: number) => ipcRenderer.invoke('cardApplication:getById', id),
    create: (data: any) => ipcRenderer.invoke('cardApplication:create', data),
    review: (id: number, approved: boolean, comment: string, reviewer: string) =>
      ipcRenderer.invoke('cardApplication:review', id, approved, comment, reviewer),
    process: (id: number) => ipcRenderer.invoke('cardApplication:process', id)
  },
  operationLog: {
    list: (page: number, pageSize: number, filters?: any) =>
      ipcRenderer.invoke('operationLog:list', page, pageSize, filters),
    exportCsv: (filePath: string, filters?: any) =>
      ipcRenderer.invoke('operationLog:exportCsv', filePath, filters)
  },
  accessEvent: {
    list: (page: number, pageSize: number) =>
      ipcRenderer.invoke('accessEvent:list', page, pageSize),
    getRecentFailed: () => ipcRenderer.invoke('accessEvent:getRecentFailed'),
    getStats: () => ipcRenderer.invoke('accessEvent:getStats')
  },
  app: {
    showSaveDialog: (options: any) => ipcRenderer.invoke('app:showSaveDialog', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('app:showOpenDialog', options),
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name)
  }
})

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getEquipment: () => ipcRenderer.invoke('equipment:list'),
  getEquipmentById: (id: number) => ipcRenderer.invoke('equipment:get', id),
  createEquipment: (data: any) => ipcRenderer.invoke('equipment:create', data),
  updateEquipment: (id: number, data: any) => ipcRenderer.invoke('equipment:update', id, data),
  deleteEquipment: (id: number) => ipcRenderer.invoke('equipment:delete', id),

  getContracts: (filters?: any) => ipcRenderer.invoke('contract:list', filters),
  getContractById: (id: number) => ipcRenderer.invoke('contract:get', id),
  createContract: (data: any) => ipcRenderer.invoke('contract:create', data),
  updateContract: (id: number, data: any) => ipcRenderer.invoke('contract:update', id, data),
  deleteContract: (id: number) => ipcRenderer.invoke('contract:delete', id),

  getDispatchRecords: (contractId?: number) => ipcRenderer.invoke('dispatch:list', contractId),
  createDispatchRecord: (data: any) => ipcRenderer.invoke('dispatch:create', data),

  getReturnRecords: (filters?: any) => ipcRenderer.invoke('return:list', filters),
  getReturnRecordById: (id: number) => ipcRenderer.invoke('return:get', id),
  createReturnRecord: (data: any) => ipcRenderer.invoke('return:create', data),
  updateReturnRecord: (id: number, data: any) => ipcRenderer.invoke('return:update', id, data),
  deleteReturnRecord: (id: number) => ipcRenderer.invoke('return:delete', id),

  getDamageItems: (returnRecordId: number) => ipcRenderer.invoke('damage:list', returnRecordId),
  createDamageItem: (data: any) => ipcRenderer.invoke('damage:create', data),
  updateDamageItem: (id: number, data: any) => ipcRenderer.invoke('damage:update', id, data),
  deleteDamageItem: (id: number) => ipcRenderer.invoke('damage:delete', id),

  uploadPhoto: (filePath: string, type: string, relatedId?: number, remark?: string) =>
    ipcRenderer.invoke('photo:upload', filePath, type, relatedId, remark),
  getPhotos: (type?: string, relatedId?: number) => ipcRenderer.invoke('photo:list', type, relatedId),
  getPhotoPath: (id: number) => ipcRenderer.invoke('photo:getPath', id),
  deletePhoto: (id: number) => ipcRenderer.invoke('photo:delete', id),
  selectFile: (options?: any) => ipcRenderer.invoke('dialog:selectFile', options),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),

  exportSettlement: (returnRecordId: number, outputPath: string) =>
    ipcRenderer.invoke('export:settlement', returnRecordId, outputPath),

  getStats: () => ipcRenderer.invoke('stats:get'),
});

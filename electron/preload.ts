import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getProjects: (filters?: { status?: string; keyword?: string; risk?: string }) =>
    ipcRenderer.invoke('getProjects', filters),
  
  getProjectById: (id: number) =>
    ipcRenderer.invoke('getProjectById', id),
  
  createProject: (data: any) =>
    ipcRenderer.invoke('createProject', data),
  
  updateProject: (id: number, data: any) =>
    ipcRenderer.invoke('updateProject', id, data),
  
  deleteProject: (id: number) =>
    ipcRenderer.invoke('deleteProject', id),

  getSurveyByProjectId: (projectId: number) =>
    ipcRenderer.invoke('getSurveyByProjectId', projectId),
  
  saveSurvey: (projectId: number, data: any) =>
    ipcRenderer.invoke('saveSurvey', projectId, data),
  
  submitSurvey: (projectId: number, operator?: string) =>
    ipcRenderer.invoke('submitSurvey', projectId, operator),
  
  approveSurvey: (projectId: number, operator?: string) =>
    ipcRenderer.invoke('approveSurvey', projectId, operator),

  getWiringPlansByProjectId: (projectId: number) =>
    ipcRenderer.invoke('getWiringPlansByProjectId', projectId),
  
  saveWiringPlan: (projectId: number, data: any) =>
    ipcRenderer.invoke('saveWiringPlan', projectId, data),
  
  confirmWiringPlan: (projectId: number, planId: number, operator?: string) =>
    ipcRenderer.invoke('confirmWiringPlan', projectId, planId, operator),

  getMaterials: () =>
    ipcRenderer.invoke('getMaterials'),
  
  getProjectMaterials: (projectId: number) =>
    ipcRenderer.invoke('getProjectMaterials', projectId),
  
  getMaterialUsageByProjectId: (projectId: number) =>
    ipcRenderer.invoke('getMaterialUsageByProjectId', projectId),
  
  addMaterialUsage: (projectId: number, data: any) =>
    ipcRenderer.invoke('addMaterialUsage', projectId, data),

  getActivityLogs: (projectId?: number, limit?: number) =>
    ipcRenderer.invoke('getActivityLogs', projectId, limit),

  getDashboardStats: () =>
    ipcRenderer.invoke('getDashboardStats'),
  
  getRiskyProjects: () =>
    ipcRenderer.invoke('getRiskyProjects'),

  startConstruction: (projectId: number) =>
    ipcRenderer.invoke('startConstruction', projectId),
  
  completeProject: (projectId: number) =>
    ipcRenderer.invoke('completeProject', projectId),

  updateLastOpened: (projectId: number) =>
    ipcRenderer.invoke('updateLastOpened', projectId),
  
  getRecentProjects: (limit?: number) =>
    ipcRenderer.invoke('getRecentProjects', limit),

  getTodoList: () =>
    ipcRenderer.invoke('getTodoList'),

  markProjectOpened: (projectId: number) =>
    ipcRenderer.invoke('markProjectOpened', projectId),

  getRecentActivity: (limit?: number) =>
    ipcRenderer.invoke('getRecentActivity', limit)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api

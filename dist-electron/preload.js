"use strict";
const electron = require("electron");
const api = {
  getProjects: (filters) => electron.ipcRenderer.invoke("getProjects", filters),
  getProjectById: (id) => electron.ipcRenderer.invoke("getProjectById", id),
  createProject: (data) => electron.ipcRenderer.invoke("createProject", data),
  updateProject: (id, data) => electron.ipcRenderer.invoke("updateProject", id, data),
  deleteProject: (id) => electron.ipcRenderer.invoke("deleteProject", id),
  getSurveyByProjectId: (projectId) => electron.ipcRenderer.invoke("getSurveyByProjectId", projectId),
  saveSurvey: (projectId, data) => electron.ipcRenderer.invoke("saveSurvey", projectId, data),
  submitSurvey: (projectId, operator) => electron.ipcRenderer.invoke("submitSurvey", projectId, operator),
  approveSurvey: (projectId, operator) => electron.ipcRenderer.invoke("approveSurvey", projectId, operator),
  getWiringPlansByProjectId: (projectId) => electron.ipcRenderer.invoke("getWiringPlansByProjectId", projectId),
  saveWiringPlan: (projectId, data) => electron.ipcRenderer.invoke("saveWiringPlan", projectId, data),
  confirmWiringPlan: (projectId, planId, operator) => electron.ipcRenderer.invoke("confirmWiringPlan", projectId, planId, operator),
  getMaterials: () => electron.ipcRenderer.invoke("getMaterials"),
  getProjectMaterials: (projectId) => electron.ipcRenderer.invoke("getProjectMaterials", projectId),
  getMaterialUsageByProjectId: (projectId) => electron.ipcRenderer.invoke("getMaterialUsageByProjectId", projectId),
  addMaterialUsage: (projectId, data) => electron.ipcRenderer.invoke("addMaterialUsage", projectId, data),
  getActivityLogs: (projectId, limit) => electron.ipcRenderer.invoke("getActivityLogs", projectId, limit),
  getDashboardStats: () => electron.ipcRenderer.invoke("getDashboardStats"),
  getRiskyProjects: () => electron.ipcRenderer.invoke("getRiskyProjects"),
  startConstruction: (projectId) => electron.ipcRenderer.invoke("startConstruction", projectId),
  completeProject: (projectId) => electron.ipcRenderer.invoke("completeProject", projectId),
  updateLastOpened: (projectId) => electron.ipcRenderer.invoke("updateLastOpened", projectId),
  getRecentProjects: (limit) => electron.ipcRenderer.invoke("getRecentProjects", limit),
  getTodoList: () => electron.ipcRenderer.invoke("getTodoList"),
  markProjectOpened: (projectId) => electron.ipcRenderer.invoke("markProjectOpened", projectId),
  getRecentActivity: (limit) => electron.ipcRenderer.invoke("getRecentActivity", limit)
};
electron.contextBridge.exposeInMainWorld("api", api);

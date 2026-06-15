import axios from 'axios';
import { Equipment, MaintenancePlan, PartsInventory, OperationLog, Exception, User, EquipmentChangeRecord, MaintenanceChangeRecord, OverdueWarning } from '../types';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },
};

export const equipmentAPI = {
  getAll: async () => {
    const response = await api.get<Equipment[]>('/equipment');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Equipment>(`/equipment/${id}`);
    return response.data;
  },
  create: async (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Equipment>('/equipment', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Equipment> & { operator?: string; operatorRole?: string; reason?: string }) => {
    const response = await api.put<{ equipment: Equipment; changeRecord: EquipmentChangeRecord | null }>(`/equipment/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/equipment/${id}`);
    return response.data;
  },
  reportDown: async (id: string, reason: string, operator: string, operatorRole: string) => {
    const response = await api.post<{ equipment: Equipment; exception: Exception }>(`/equipment/${id}/report-down`, { reason, operator, operatorRole });
    return response.data;
  },
  repairComplete: async (id: string, operator: string, operatorRole: string, repairDetails?: string) => {
    const response = await api.post<Equipment>(`/equipment/${id}/repair-complete`, { operator, operatorRole, repairDetails });
    return response.data;
  },
};

export const maintenanceAPI = {
  getAll: async () => {
    const response = await api.get<MaintenancePlan[]>('/maintenance-plans');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<MaintenancePlan>(`/maintenance-plans/${id}`);
    return response.data;
  },
  create: async (data: Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt' | 'hasEquipmentChange' | 'equipmentChangeRecordId' | 'equipmentChangeAcknowledged'> & { operator?: string; operatorRole?: string }) => {
    const response = await api.post<MaintenancePlan>('/maintenance-plans', data);
    return response.data;
  },
  update: async (id: string, data: Partial<MaintenancePlan> & { operator?: string; operatorRole?: string }) => {
    const response = await api.put<MaintenancePlan>(`/maintenance-plans/${id}`, data);
    return response.data;
  },
  acknowledgeChange: async (id: string, operator: string, operatorRole: string) => {
    const response = await api.post<MaintenancePlan>(`/maintenance-plans/${id}/acknowledge-change`, { operator, operatorRole });
    return response.data;
  },
};

export const partsAPI = {
  getAll: async () => {
    const response = await api.get<PartsInventory[]>('/parts');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<PartsInventory>(`/parts/${id}`);
    return response.data;
  },
  create: async (data: Omit<PartsInventory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<PartsInventory>('/parts', data);
    return response.data;
  },
  update: async (id: string, data: Partial<PartsInventory>) => {
    const response = await api.put<PartsInventory>(`/parts/${id}`, data);
    return response.data;
  },
  issue: async (id: string, quantity: number, recipient: string, purpose: string, operator?: string, operatorRole?: string) => {
    const response = await api.post<PartsInventory>(`/parts/${id}/issue`, { quantity, recipient, purpose, operator, operatorRole });
    return response.data;
  },
  reportWrongDelivery: async (id: string, expectedCode: string, actualCode: string, recipient: string, destination: string, operator?: string, operatorRole?: string) => {
    const response = await api.post<Exception>(`/parts/${id}/report-wrong-delivery`, { expectedCode, actualCode, recipient, destination, operator, operatorRole });
    return response.data;
  },
  resolveWrongDelivery: async (exceptionId: string, resolution: string, operator?: string, operatorRole?: string) => {
    const response = await api.post<Exception>('/parts/wrong-delivery/resolve', { exceptionId, resolution, operator, operatorRole });
    return response.data;
  },
};

export const logsAPI = {
  getAll: async () => {
    const response = await api.get<OperationLog[]>('/logs');
    return response.data;
  },
};

export const exceptionsAPI = {
  getAll: async () => {
    const response = await api.get<Exception[]>('/exceptions');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Exception>(`/exceptions/${id}`);
    return response.data;
  },
  update: async (id: string, data: Partial<Exception> & { operator?: string; operatorRole?: string; resolution?: string }) => {
    const response = await api.put<Exception>(`/exceptions/${id}`, data);
    return response.data;
  },
  create: async (data: Omit<Exception, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Exception>('/exceptions', data);
    return response.data;
  },
};

export const systemAPI = {
  checkOverdue: async () => {
    const response = await api.post<{ message: string; newExceptions: Exception[] }>('/check-overdue');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
  getOverdueWarnings: async () => {
    const response = await api.get<OverdueWarning>('/overdue-warnings');
    return response.data;
  },
};

export const changeRecordsAPI = {
  getEquipmentChangeRecords: async () => {
    const response = await api.get<EquipmentChangeRecord[]>('/equipment-change-records');
    return response.data;
  },
  getEquipmentChangeRecordById: async (id: string) => {
    const response = await api.get<EquipmentChangeRecord>(`/equipment-change-records/${id}`);
    return response.data;
  },
  getMaintenanceChangeRecords: async () => {
    const response = await api.get<MaintenanceChangeRecord[]>('/maintenance-change-records');
    return response.data;
  },
};
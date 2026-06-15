import axios from 'axios';
import { Equipment, MaintenancePlan, PartsInventory, OperationLog, Exception, User } from '../types';

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
  update: async (id: string, data: Partial<Equipment>) => {
    const response = await api.put<Equipment>(`/equipment/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/equipment/${id}`);
    return response.data;
  },
  down: async (id: string, reason: string) => {
    const response = await api.post(`/equipment/${id}/down`, { reason });
    return response.data;
  },
  repair: async (id: string) => {
    const response = await api.post(`/equipment/${id}/repair`);
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
  create: async (data: Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<MaintenancePlan>('/maintenance-plans', data);
    return response.data;
  },
  update: async (id: string, data: Partial<MaintenancePlan>) => {
    const response = await api.put<MaintenancePlan>(`/maintenance-plans/${id}`, data);
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
  issue: async (id: string, quantity: number, recipient: string, purpose: string) => {
    const response = await api.post<PartsInventory>(`/parts/${id}/issue`, { quantity, recipient, purpose });
    return response.data;
  },
  reportWrongDelivery: async (id: string, expectedCode: string, actualCode: string) => {
    const response = await api.post<Exception>(`/parts/${id}/wrong-delivery`, { expectedCode, actualCode });
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
  update: async (id: string, data: Partial<Exception>) => {
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
    const response = await api.post('/check-overdue');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};

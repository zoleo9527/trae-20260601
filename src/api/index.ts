import axios from 'axios';
import { User, Queue, Table, SystemLog } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },
};

export const queueApi = {
  getQueues: async (): Promise<Queue[]> => {
    const response = await api.get('/queues');
    return response.data;
  },
  getQueueById: async (id: string): Promise<Queue> => {
    const response = await api.get(`/queues/${id}`);
    return response.data;
  },
  createQueue: async (customerName: string, phone: string, partySize: number, submittedBy: string): Promise<Queue> => {
    const response = await api.post('/queues', { customerName, phone, partySize, submittedBy });
    return response.data;
  },
  updateQueueStatus: async (id: string, status: Queue['status'], operatedBy: string): Promise<Queue> => {
    const response = await api.put(`/queues/${id}`, { status, operatedBy });
    return response.data;
  },
  assignTable: async (queueId: string, tableId: string, assignedBy: string): Promise<Queue> => {
    const response = await api.post(`/queues/${queueId}/assign`, { tableId, assignedBy });
    return response.data;
  },
  deleteQueue: async (id: string): Promise<void> => {
    await api.delete(`/queues/${id}`);
  },
};

export const tableApi = {
  getTables: async (): Promise<Table[]> => {
    const response = await api.get('/tables');
    return response.data;
  },
  getTableById: async (id: string): Promise<Table> => {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },
  createTable: async (name: string, capacity: number, position: string, createdBy: string): Promise<Table> => {
    const response = await api.post('/tables', { name, capacity, position, createdBy });
    return response.data;
  },
  updateTable: async (id: string, status?: Table['status'], name?: string, capacity?: number, position?: string, operatedBy?: string): Promise<Table> => {
    const response = await api.put(`/tables/${id}`, { status, name, capacity, position, operatedBy });
    return response.data;
  },
  deleteTable: async (id: string): Promise<void> => {
    await api.delete(`/tables/${id}`);
  },
};

export const logApi = {
  getLogs: async (): Promise<SystemLog[]> => {
    const response = await api.get('/logs');
    return response.data;
  },
};

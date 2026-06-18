import apiClient from './client';
import { MaterialList, MaterialStatus } from '@/types';

export interface MaterialQueryParams {
  scheduleId?: string;
  status?: MaterialStatus;
  preparedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateMaterialData {
  scheduleId: string;
  materials: {
    name: string;
    category: 'DEMO' | 'OPERATION' | 'DISPLAY';
    quantity: number;
    unit: string;
    remarks?: string;
  }[];
}

export interface UpdateMaterialData {
  materials?: any[];
  remarks?: string;
}

export interface TransitionData {
  action: 'START_PREPARE' | 'MARK_READY' | 'MARK_BLOCKED' | 'IN_USE' | 'RETURN';
  materialId?: string;
  reason?: string;
  remarks?: string;
}

export const materialApi = {
  getList: async (params?: MaterialQueryParams) => {
    return apiClient.get('/materials', { params });
  },

  getById: async (id: string) => {
    return apiClient.get(`/materials/${id}`);
  },

  getByScheduleId: async (scheduleId: string) => {
    return apiClient.get(`/materials/schedule/${scheduleId}`);
  },

  create: async (data: CreateMaterialData) => {
    return apiClient.post('/materials', data);
  },

  update: async (id: string, data: UpdateMaterialData) => {
    return apiClient.put(`/materials/${id}`, data);
  },

  claim: async (id: string, preparedBy: string) => {
    return apiClient.post(`/materials/${id}/claim`, { preparedBy });
  },

  transition: async (id: string, data: TransitionData) => {
    return apiClient.post(`/materials/${id}/transition`, data);
  },

  acknowledge: async (id: string, acknowledged: boolean, remarks?: string) => {
    return apiClient.post(`/materials/${id}/acknowledge`, { acknowledged, remarks });
  },

  reportIssue: async (id: string, data: {
    materialId: string;
    type: 'DAMAGED' | 'MISSING';
    description: string;
    photoUrls?: string[];
  }) => {
    return apiClient.post(`/materials/${id}/report-issue`, data);
  },

  getHistory: async (startDate: string, endDate: string, courseType?: string) => {
    return apiClient.get('/materials/history', { params: { startDate, endDate, courseType } });
  },

  getReport: async (startDate: string, endDate: string) => {
    return apiClient.get('/materials/report', { params: { startDate, endDate } });
  },
};

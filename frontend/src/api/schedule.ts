import apiClient from './client';
import { ActivitySchedule, ScheduleStatus } from '@/types';

export interface ScheduleQueryParams {
  status?: ScheduleStatus;
  lecturerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateScheduleData {
  courseId: string;
  courseName: string;
  scheduledAt: string;
  location: string;
  expectedParticipants: number;
  participantType: 'STUDENT' | 'ADULT' | 'FAMILY';
  lecturerId: string;
  lecturerName: string;
  lecturerPhone: string;
  lecturerEmail: string;
  lecturerRequirements?: string;
}

export interface UpdateScheduleData {
  scheduledAt?: string;
  location?: string;
  expectedParticipants?: number;
  lecturerId?: string;
  lecturerName?: string;
  lecturerPhone?: string;
  lecturerEmail?: string;
  lecturerRequirements?: string;
}

export interface TransitionData {
  action: 'CONFIRM' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'CANCEL';
  reason?: string;
  remarks?: string;
}

export const scheduleApi = {
  getList: async (params?: ScheduleQueryParams) => {
    return apiClient.get('/schedules', { params });
  },

  getById: async (id: string) => {
    return apiClient.get(`/schedules/${id}`);
  },

  create: async (data: CreateScheduleData) => {
    return apiClient.post('/schedules', data);
  },

  update: async (id: string, data: UpdateScheduleData) => {
    return apiClient.put(`/schedules/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/schedules/${id}`);
  },

  transition: async (id: string, data: TransitionData) => {
    return apiClient.post(`/schedules/${id}/transition`, data);
  },

  getChangeHistory: async (id: string) => {
    return apiClient.get(`/schedules/${id}/changes`);
  },

  getAttachments: async (id: string) => {
    return apiClient.get(`/schedules/${id}/attachments`);
  },

  uploadAttachment: async (id: string, formData: FormData) => {
    return apiClient.post(`/schedules/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

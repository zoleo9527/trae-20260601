import apiClient from './client';
import { Notification, NotificationType } from '@/types';

export interface NotificationQueryParams {
  userId: string;
  type?: NotificationType;
  read?: boolean;
  page?: number;
  pageSize?: number;
}

export const notificationApi = {
  getList: async (params: NotificationQueryParams) => {
    return apiClient.get('/notifications', { params });
  },

  getUnreadCount: async (userId: string) => {
    return apiClient.get('/notifications/unread-count', { params: { userId } });
  },

  getById: async (id: string) => {
    return apiClient.get(`/notifications/${id}`);
  },

  markAsRead: async (id: string, userId: string) => {
    return apiClient.post(`/notifications/${id}/read`, { userId });
  },

  batchMarkAsRead: async (userId: string, notificationIds: string[]) => {
    return apiClient.post('/notifications/batch-read', { userId, notificationIds });
  },

  executeAction: async (id: string, data: {
    userId: string;
    actionType: string;
    params?: any;
  }) => {
    return apiClient.post(`/notifications/${id}/action`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/notifications/${id}`);
  },
};

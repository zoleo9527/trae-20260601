import { create } from 'zustand';
import { Notification } from '@/types';
import { mockNotifications } from '@/data/mockNotifications';
import { notificationApi } from '@/api/notification';
import { getCurrentUser } from '@/data/mockUsers';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  batchMarkAsRead: (ids: string[]) => Promise<void>;
  executeAction: (id: string, actionType: string, params?: any) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = getCurrentUser();
      const response = await notificationApi.getList({
        userId: currentUser.id,
        pageSize: 20,
      });

      const allNotifications = response.data?.items || mockNotifications;
      const userNotifications = allNotifications.filter(
        n => n.recipients.includes(currentUser.id)
      );

      set({
        notifications: userNotifications,
        unreadCount: userNotifications.filter(n => !n.readBy.includes(currentUser.id)).length,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      const currentUser = getCurrentUser();
      const userNotifications = mockNotifications.filter(
        n => n.recipients.includes(currentUser.id)
      );
      set({
        notifications: userNotifications,
        unreadCount: userNotifications.filter(n => !n.readBy.includes(currentUser.id)).length,
        isLoading: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const currentUser = getCurrentUser();
      const response = await notificationApi.getUnreadCount(currentUser.id);
      set({ unreadCount: response.data?.count || 0 });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      const currentUser = getCurrentUser();
      await notificationApi.markAsRead(id, currentUser.id);

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id
            ? { ...n, readBy: [...n.readBy, currentUser.id] }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  batchMarkAsRead: async (ids: string[]) => {
    try {
      const currentUser = getCurrentUser();
      await notificationApi.batchMarkAsRead(currentUser.id, ids);

      set(state => ({
        notifications: state.notifications.map(n =>
          ids.includes(n.id)
            ? { ...n, readBy: [...n.readBy, currentUser.id] }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - ids.length),
      }));
    } catch (error) {
      console.error('Failed to batch mark as read:', error);
    }
  },

  executeAction: async (id: string, actionType: string, params?: any) => {
    try {
      const currentUser = getCurrentUser();
      await notificationApi.executeAction(id, {
        userId: currentUser.id,
        actionType,
        params,
      });

      await get().markAsRead(id);

      return true;
    } catch (error) {
      console.error('Failed to execute action:', error);
      return false;
    }
  },
}));

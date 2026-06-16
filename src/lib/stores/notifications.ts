import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Notification } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getFromStorage, setToStorage, generateId } from '../storage';

function createNotificationStore() {
  const initial: Notification[] = browser ? getFromStorage(STORAGE_KEYS.NOTIFICATIONS, []) : [];
  
  const { subscribe, set, update } = writable<Notification[]>(initial);
  
  return {
    subscribe,
    init: () => {
      if (browser) {
        const data = getFromStorage(STORAGE_KEYS.NOTIFICATIONS, []);
        set(data);
      }
    },
    add: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
      update(items => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          created_at: new Date().toISOString(),
          is_read: false
        };
        const updated = [newNotification, ...items];
        if (browser) setToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
        return updated;
      });
    },
    markAsRead: (id: string) => {
      update(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            return { ...item, is_read: true };
          }
          return item;
        });
        if (browser) setToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
        return updated;
      });
    },
    markAllAsRead: () => {
      update(items => {
        const updated = items.map(item => ({ ...item, is_read: true }));
        if (browser) setToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
        return updated;
      });
    },
    remove: (id: string) => {
      update(items => {
        const updated = items.filter(item => item.id !== id);
        if (browser) setToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
        return updated;
      });
    },
    clearAll: () => {
      if (browser) setToStorage(STORAGE_KEYS.NOTIFICATIONS, []);
      set([]);
    }
  };
}

export const notifications = createNotificationStore();

export const unreadNotifications = derived(notifications, $notifications => 
  $notifications.filter(n => !n.is_read)
);

export const unreadCount = derived(notifications, $notifications => 
  $notifications.filter(n => !n.is_read).length
);
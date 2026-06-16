import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Alert, AlertHandler } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getFromStorage, setToStorage, generateId } from '../storage';
import { notifications } from './notifications';

function createAlertStore() {
  const initial: Alert[] = browser ? getFromStorage(STORAGE_KEYS.ALERTS, []) : [];
  
  const { subscribe, set, update } = writable<Alert[]>(initial);
  
  return {
    subscribe,
    init: () => {
      if (browser) {
        const data = getFromStorage(STORAGE_KEYS.ALERTS, []);
        set(data);
      }
    },
    add: (alert: Omit<Alert, 'id' | 'created_at' | 'resolved_at' | 'handlers'>) => {
      update(items => {
        const newAlert: Alert = {
          ...alert,
          id: generateId(),
          created_at: new Date().toISOString(),
          resolved_at: null,
          handlers: []
        };
        const updated = [...items, newAlert];
        if (browser) setToStorage(STORAGE_KEYS.ALERTS, updated);
        
        notifications.add({
          title: alert.title,
          content: alert.description,
          type: 'alert'
        });
        
        return updated;
      });
    },
    resolve: (id: string, handler: string, action: string) => {
      update(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            const newHandler: AlertHandler = {
              id: generateId(),
              alert_id: id,
              handler,
              action,
              created_at: new Date().toISOString()
            };
            return {
              ...item,
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              handlers: [...item.handlers, newHandler]
            };
          }
          return item;
        });
        if (browser) setToStorage(STORAGE_KEYS.ALERTS, updated);
        
        notifications.add({
          title: '异常已处理',
          content: `${handler}处理了异常：${action}`,
          type: 'success'
        });
        
        return updated;
      });
    },
    getById: (id: string) => {
      let result: Alert | undefined;
      subscribe(items => {
        result = items.find(item => item.id === id);
      })();
      return result;
    },
    getAll: () => {
      let result: Alert[] = [];
      subscribe(items => {
        result = items;
      })();
      return result;
    }
  };
}

export const alerts = createAlertStore();

export const activeAlerts = derived(alerts, $alerts => 
  $alerts.filter(a => a.status === 'active')
);

export const resolvedAlerts = derived(alerts, $alerts => 
  $alerts.filter(a => a.status === 'resolved')
);

export const highSeverityAlerts = derived(alerts, $alerts => 
  $alerts.filter(a => a.severity === 'high' && a.status === 'active')
);
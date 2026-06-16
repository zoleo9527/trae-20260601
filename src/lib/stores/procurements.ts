import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Procurement, ProcurementItem, ProcurementStatus } from '../types';
import { STORAGE_KEYS, PROCUREMENT_STATUS_LABELS } from '../constants';
import { getFromStorage, setToStorage, generateId } from '../storage';
import { notifications } from './notifications';

function createProcurementStore() {
  const initial: Procurement[] = browser ? getFromStorage(STORAGE_KEYS.PROCUREMENTS, []) : [];
  
  const { subscribe, set, update } = writable<Procurement[]>(initial);
  
  return {
    subscribe,
    init: () => {
      if (browser) {
        const data = getFromStorage(STORAGE_KEYS.PROCUREMENTS, []);
        set(data);
      }
    },
    add: (procurement: Omit<Procurement, 'id' | 'created_at' | 'updated_at' | 'status_history'>) => {
      update(items => {
        const newProcurement: Procurement = {
          ...procurement,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status_history: [
            {
              id: generateId(),
              procurement_id: '',
              status: procurement.status,
              handler: procurement.applicant,
              note: '提交采购申请',
              created_at: new Date().toISOString()
            }
          ]
        };
        newProcurement.status_history[0].procurement_id = newProcurement.id;
        newProcurement.items.forEach(item => {
          item.id = generateId();
          item.procurement_id = newProcurement.id;
        });
        const updated = [...items, newProcurement];
        if (browser) setToStorage(STORAGE_KEYS.PROCUREMENTS, updated);
        return updated;
      });
    },
    updateStatus: (id: string, status: Procurement['status'], handler: string, note: string, approver?: string) => {
      update(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            const newStatus: ProcurementStatus = {
              id: generateId(),
              procurement_id: id,
              status,
              handler,
              note,
              created_at: new Date().toISOString()
            };
            const updates: Partial<Procurement> = {
              status,
              updated_at: new Date().toISOString(),
              status_history: [...item.status_history, newStatus]
            };
            if (approver) {
              updates.approver = approver;
              updates.approve_time = new Date().toISOString();
            }
            
            if (browser) {
              const notificationType = status === 'approved' ? 'success' : 
                                       status === 'rejected' ? 'alert' : 
                                       status === 'completed' ? 'success' : 'info';
              notifications.add({
                title: '采购状态更新',
                content: `采购申请（${item.items.length}项食材）状态已更新为 ${PROCUREMENT_STATUS_LABELS[status]}，处理人：${handler}`,
                type: notificationType
              });
            }
            
            return { ...item, ...updates };
          }
          return item;
        });
        if (browser) setToStorage(STORAGE_KEYS.PROCUREMENTS, updated);
        return updated;
      });
    },
    getById: (id: string) => {
      let result: Procurement | undefined;
      subscribe(items => {
        result = items.find(item => item.id === id);
      })();
      return result;
    }
  };
}

export const procurements = createProcurementStore();

export const pendingProcurements = derived(procurements, $procurements => 
  $procurements.filter(p => p.status === 'pending')
);

export const activeProcurements = derived(procurements, $procurements => 
  $procurements.filter(p => ['approved', 'purchasing', 'received'].includes(p.status))
);

export const completedProcurements = derived(procurements, $procurements => 
  $procurements.filter(p => ['completed', 'rejected'].includes(p.status))
);
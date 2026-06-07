import { create } from 'zustand';
import { OperationLog } from '../types';
import { storage, generateId } from '../utils/storage';
import { mockOperationLogs } from '../data/mockData';
import { useAuthStore } from './authStore';

interface AuditStore {
  logs: OperationLog[];
  addLog: (
    entityType: string,
    entityId: string,
    action: OperationLog['action'],
    beforeData?: Record<string, unknown>,
    afterData?: Record<string, unknown>,
    note?: string
  ) => void;
  getLogsByEntity: (entityType: string, entityId: string) => OperationLog[];
  getLogsByOperator: (operator: string) => OperationLog[];
}

const initialLogs = storage.get<OperationLog[]>('audit_logs', mockOperationLogs);

export const useAuditStore = create<AuditStore>((set, get) => ({
  logs: initialLogs,
  
  addLog: (entityType, entityId, action, beforeData, afterData, note) => {
    const { currentUser } = useAuthStore.getState();
    const log: OperationLog = {
      id: generateId(),
      entityType,
      entityId,
      action,
      beforeData,
      afterData,
      operator: currentUser,
      note,
      createdAt: new Date().toISOString(),
    };
    const logs = [...get().logs, log];
    set({ logs });
    storage.set('audit_logs', logs);
  },
  
  getLogsByEntity: (entityType, entityId) => {
    return get().logs.filter(
      (log) => log.entityType === entityType && log.entityId === entityId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getLogsByOperator: (operator) => {
    return get().logs.filter((log) => log.operator === operator)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));

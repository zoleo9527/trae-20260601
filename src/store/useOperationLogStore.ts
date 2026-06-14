import { create } from 'zustand';
import { OperationLog, LogType } from '@/types';
import { mockOperationLogs } from '@/data/operationLogs';
import { generateId } from '@/utils/date';
import { useStudentStore } from './useStudentStore';

interface OperationLogState {
  logs: OperationLog[];
  
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
  
  getLogsByType: (type: LogType) => OperationLog[];
  getLogsByTarget: (type: LogType, targetId: string) => OperationLog[];
  getRecentLogs: (limit?: number) => OperationLog[];
}

export const useOperationLogStore = create<OperationLogState>((set, get) => ({
  logs: mockOperationLogs,

  addLog: (log) => {
    const newLog: OperationLog = {
      ...log,
      id: generateId('log'),
      timestamp: new Date().toISOString(),
    };
    set(state => ({
      logs: [newLog, ...state.logs],
    }));
  },

  getLogsByType: (type) => {
    return get().logs
      .filter(l => l.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getLogsByTarget: (type, targetId) => {
    return get().logs
      .filter(l => l.type === type && l.targetId === targetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getRecentLogs: (limit = 10) => {
    return get().logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },
}));

export function logOperation(
  type: LogType,
  targetId: string,
  action: string,
  operator: string,
  details: string
) {
  const student = useStudentStore.getState().students.find(s => s.id === targetId);
  const targetName = student?.name || '';
  
  useOperationLogStore.getState().addLog({
    type,
    targetId,
    targetName,
    action,
    operator,
    details,
  });
}

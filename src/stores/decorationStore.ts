import { create } from 'zustand';
import { DecorationTask, DecorationStatus } from '../types';
import { storage, generateId } from '../utils/storage';
import { mockDecorationTasks } from '../data/mockData';
import { useAuditStore } from './auditStore';
import { useBookingStore } from './bookingStore';

interface DecorationStore {
  tasks: DecorationTask[];
  addTask: (task: Omit<DecorationTask, 'id' | 'photos' | 'createdAt'>) => string;
  updateTask: (id: string, updates: Partial<DecorationTask>) => void;
  updateTaskStatus: (id: string, status: DecorationStatus, note?: string) => void;
  addPhoto: (id: string, photoUrl: string) => void;
  getTaskById: (id: string) => DecorationTask | undefined;
  getTasksByBooking: (bookingId: string) => DecorationTask | undefined;
  getTasksByStatus: (status: DecorationStatus) => DecorationTask[];
  getTodayTasks: () => DecorationTask[];
}

const initialTasks = storage.get<DecorationTask[]>('decoration_tasks', mockDecorationTasks);

export const useDecorationStore = create<DecorationStore>((set, get) => ({
  tasks: initialTasks,
  
  addTask: (taskData) => {
    const existingTask = get().tasks.find((t) => t.bookingId === taskData.bookingId);
    if (existingTask) return existingTask.id;

    const task: DecorationTask = {
      ...taskData,
      id: generateId(),
      photos: [],
      createdAt: new Date().toISOString(),
    };
    const tasks = [...get().tasks, task];
    set({ tasks });
    storage.set('decoration_tasks', tasks);

    if (taskData.bookingId) {
      useBookingStore.getState().updateBooking(taskData.bookingId, { decorationTaskId: task.id });
    }

    useAuditStore.getState().addLog(
      'decoration',
      task.id,
      'create',
      undefined,
      task as unknown as Record<string, unknown>,
      '创建设置任务'
    );

    return task.id;
  },
  
  updateTask: (id, updates) => {
    const tasks = get().tasks.map((t) => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        
        useAuditStore.getState().addLog(
          'decoration',
          id,
          'update',
          t as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>
        );
        
        return updated;
      }
      return t;
    });
    set({ tasks });
    storage.set('decoration_tasks', tasks);
  },
  
  updateTaskStatus: (id, status, note) => {
    const now = new Date().toISOString();
    const tasks = get().tasks.map((t) => {
      if (t.id === id) {
        const beforeData = { status: t.status };
        const updates: Partial<DecorationTask> = { status };
        
        if (status === 'in_progress' && !t.startedAt) {
          updates.startedAt = now;
        }
        if (status === 'completed' && !t.completedAt) {
          updates.completedAt = now;
        }
        
        const updated = { ...t, ...updates };
        
        useAuditStore.getState().addLog(
          'decoration',
          id,
          'status_change',
          beforeData,
          { status, ...updates },
          note
        );
        
        return updated;
      }
      return t;
    });
    set({ tasks });
    storage.set('decoration_tasks', tasks);
  },
  
  addPhoto: (id, photoUrl) => {
    const tasks = get().tasks.map((t) => {
      if (t.id === id) {
        const updated = { ...t, photos: [...t.photos, photoUrl] };
        return updated;
      }
      return t;
    });
    set({ tasks });
    storage.set('decoration_tasks', tasks);
  },
  
  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id);
  },
  
  getTasksByBooking: (bookingId) => {
    return get().tasks.find((t) => t.bookingId === bookingId);
  },
  
  getTasksByStatus: (status) => {
    return get().tasks.filter((t) => t.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
  
  getTodayTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter((t) => {
      const taskDate = t.createdAt.split('T')[0];
      return taskDate === today;
    });
  },
}));

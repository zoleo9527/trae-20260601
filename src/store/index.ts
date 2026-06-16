import { create } from 'zustand';
import { User, Queue, Table, SystemLog } from '../types';

interface AppState {
  user: User | null;
  queues: Queue[];
  tables: Table[];
  logs: SystemLog[];
  selectedQueueId: string | null;
  setUser: (user: User | null) => void;
  setQueues: (queues: Queue[]) => void;
  setTables: (tables: Table[]) => void;
  setLogs: (logs: SystemLog[]) => void;
  setSelectedQueueId: (id: string | null) => void;
  addQueue: (queue: Queue) => void;
  updateQueue: (queue: Queue) => void;
  deleteQueue: (id: string) => void;
  updateTable: (table: Table) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  queues: [],
  tables: [],
  logs: [],
  selectedQueueId: null,
  setUser: (user) => set({ user }),
  setQueues: (queues) => set({ queues }),
  setTables: (tables) => set({ tables }),
  setLogs: (logs) => set({ logs }),
  setSelectedQueueId: (id) => set({ selectedQueueId: id }),
  addQueue: (queue) => set((state) => ({ queues: [queue, ...state.queues] })),
  updateQueue: (updatedQueue) => set((state) => ({
    queues: state.queues.map((q) => (q.id === updatedQueue.id ? updatedQueue : q)),
  })),
  deleteQueue: (id) => set((state) => ({ queues: state.queues.filter((q) => q.id !== id) })),
  updateTable: (updatedTable) => set((state) => ({
    tables: state.tables.map((t) => (t.id === updatedTable.id ? updatedTable : t)),
  })),
  logout: () => set({ user: null, queues: [], tables: [], logs: [], selectedQueueId: null }),
}));

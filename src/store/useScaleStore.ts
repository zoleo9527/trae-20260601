import { create } from 'zustand';
import type { ScaleRecord } from '../types';
import { mockScaleRecords } from '../data/mockData';

interface ScaleState {
  scaleRecords: ScaleRecord[];
  selectedRecord: ScaleRecord | null;
  filterStatus: ScaleRecord['status'] | 'all';
  setScaleRecords: (records: ScaleRecord[]) => void;
  setSelectedRecord: (record: ScaleRecord | null) => void;
  setFilterStatus: (status: ScaleRecord['status'] | 'all') => void;
  sendScale: (id: string) => void;
  markSubmitted: (id: string) => void;
  markRetestNeeded: (id: string, deadline: string) => void;
  notifyClient: (id: string) => void;
  getFilteredRecords: () => ScaleRecord[];
  getPendingScales: () => ScaleRecord[];
  getRetestNeeded: () => ScaleRecord[];
}

export const useScaleStore = create<ScaleState>((set, get) => ({
  scaleRecords: mockScaleRecords,
  selectedRecord: null,
  filterStatus: 'all',
  
  setScaleRecords: (records) => set({ scaleRecords: records }),
  setSelectedRecord: (record) => set({ selectedRecord: record }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  
  sendScale: (id) =>
    set((state) => ({
      scaleRecords: state.scaleRecords.map((s) =>
        s.id === id ? { ...s, status: 'sent' as const, sentAt: new Date().toISOString(), clientNotified: true } : s
      ),
    })),
  
  markSubmitted: (id) =>
    set((state) => ({
      scaleRecords: state.scaleRecords.map((s) =>
        s.id === id ? { ...s, status: s.needsRetest ? 'retest_submitted' as const : 'submitted' as const, submittedAt: new Date().toISOString() } : s
      ),
    })),
  
  markRetestNeeded: (id, deadline) =>
    set((state) => ({
      scaleRecords: state.scaleRecords.map((s) =>
        s.id === id ? { ...s, status: 'retest_needed' as const, needsRetest: true, retestDeadline: deadline } : s
      ),
    })),
  
  notifyClient: (id) =>
    set((state) => ({
      scaleRecords: state.scaleRecords.map((s) =>
        s.id === id ? { ...s, clientNotified: true } : s
      ),
    })),
  
  getFilteredRecords: () => {
    const { scaleRecords, filterStatus } = get();
    return filterStatus === 'all' ? scaleRecords : scaleRecords.filter((s) => s.status === filterStatus);
  },
  
  getPendingScales: () => get().scaleRecords.filter((s) => s.status === 'not_sent'),
  getRetestNeeded: () => get().scaleRecords.filter((s) => s.status === 'retest_needed'),
}));

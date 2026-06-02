import { create } from 'zustand';
import type { ScaleRecord, ScaleStatus } from '../types';
import { mockScaleRecords } from '../data/mockData';
import { useAppointmentStore } from './useAppointmentStore';

interface ScaleState {
  scaleRecords: ScaleRecord[];
  selectedRecord: ScaleRecord | null;
  filterStatus: ScaleStatus | 'all';
  setScaleRecords: (records: ScaleRecord[]) => void;
  setSelectedRecord: (record: ScaleRecord | null) => void;
  setFilterStatus: (status: ScaleStatus | 'all') => void;
  sendScale: (id: string) => void;
  markSubmitted: (id: string) => void;
  markRetestNeeded: (id: string, deadline: string) => void;
  notifyClient: (id: string) => void;
  getFilteredRecords: () => ScaleRecord[];
  getPendingScales: () => ScaleRecord[];
  getRetestNeeded: () => ScaleRecord[];
}

function syncScaleToAppointment(recordId: string, newStatus: ScaleStatus) {
  const scaleStore = useScaleStore.getState();
  const record = scaleStore.scaleRecords.find((s) => s.id === recordId);
  if (!record || !record.appointmentId) return;

  const appointmentStore = useAppointmentStore.getState();
  appointmentStore.setAppointments(
    appointmentStore.appointments.map((a) =>
      a.id === record.appointmentId ? { ...a, scaleStatus: newStatus } : a
    )
  );
}

export const useScaleStore = create<ScaleState>((set, get) => ({
  scaleRecords: mockScaleRecords,
  selectedRecord: null,
  filterStatus: 'all',

  setScaleRecords: (records) => set({ scaleRecords: records }),
  setSelectedRecord: (record) => set({ selectedRecord: record }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  sendScale: (id) => {
    set((state) => ({
      scaleRecords: state.scaleRecords.map((s) =>
        s.id === id ? { ...s, status: 'sent' as const, sentAt: new Date().toISOString(), clientNotified: true } : s
      ),
    }));
    syncScaleToAppointment(id, 'sent');
  },

  markSubmitted: (id) => {
    set((state) => ({
      scaleRecords: state.scaleRecords.map((s) =>
        s.id === id ? { ...s, status: s.needsRetest ? 'retest_submitted' as const : 'submitted' as const, submittedAt: new Date().toISOString() } : s
      ),
    }));
    const record = get().scaleRecords.find((s) => s.id === id);
    if (record) {
      syncScaleToAppointment(id, record.needsRetest ? 'retest_submitted' : 'submitted');
    }
  },

  markRetestNeeded: (id, deadline) => {
    set((state) => ({
      scaleRecords: state.scaleRecords.map((s) =>
        s.id === id ? { ...s, status: 'retest_needed' as const, needsRetest: true, retestDeadline: deadline } : s
      ),
    }));
    syncScaleToAppointment(id, 'retest_needed');
  },

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

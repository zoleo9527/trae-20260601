import { create } from 'zustand';
import type { TriageItem } from '../types';
import { mockTriageItems } from '../data/mockData';

interface TriageState {
  triageItems: TriageItem[];
  selectedTriage: TriageItem | null;
  setTriageItems: (items: TriageItem[]) => void;
  setSelectedTriage: (item: TriageItem | null) => void;
  assignCounselor: (id: string, counselorId: string) => void;
  getPendingTriage: () => TriageItem[];
  getAssignedTriage: () => TriageItem[];
}

export const useTriageStore = create<TriageState>((set, get) => ({
  triageItems: mockTriageItems,
  selectedTriage: null,
  
  setTriageItems: (items) => set({ triageItems: items }),
  setSelectedTriage: (item) => set({ selectedTriage: item }),
  
  assignCounselor: (id, counselorId) =>
    set((state) => ({
      triageItems: state.triageItems.map((t) =>
        t.id === id ? { ...t, assignedCounselorId: counselorId, status: 'assigned' as const } : t
      ),
    })),
  
  getPendingTriage: () => get().triageItems.filter((t) => t.status === 'pending'),
  getAssignedTriage: () => get().triageItems.filter((t) => t.status === 'assigned'),
}));

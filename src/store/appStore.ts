import { create } from 'zustand';
import { mockCases, mockRecalls, mockReinspections, mockTraces } from '../data/mockData';
import type { BatchTrace, RecallTask, Reinspection, ReturnCase } from '../types';

interface AppState {
  cases: ReturnCase[];
  traces: Record<string, BatchTrace>;
  reinspections: Record<string, Reinspection>;
  recalls: RecallTask[];
  currentCase: ReturnCase | null;
  setCurrentCase: (caseItem: ReturnCase | null) => void;
  addCase: (caseItem: ReturnCase) => void;
  updateCase: (id: string, updates: Partial<ReturnCase>) => void;
  updateRecallCustomer: (recallId: string, customerId: string, updates: Partial<RecallTask['customers'][0]>) => void;
  updateReinspection: (caseId: string, updates: Partial<Reinspection>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  cases: mockCases,
  traces: mockTraces,
  reinspections: mockReinspections,
  recalls: mockRecalls,
  currentCase: null,
  setCurrentCase: (caseItem) => set({ currentCase: caseItem }),
  addCase: (caseItem) => set((state) => ({ cases: [caseItem, ...state.cases] })),
  updateCase: (id, updates) => set((state) => ({
    cases: state.cases.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  updateRecallCustomer: (recallId, customerId, updates) => set((state) => ({
    recalls: state.recalls.map((r) =>
      r.id === recallId
        ? {
            ...r,
            customers: r.customers.map((c) =>
              c.id === customerId ? { ...c, ...updates } : c
            ),
          }
        : r
    ),
  })),
  updateReinspection: (caseId, updates) => set((state) => ({
    reinspections: {
      ...state.reinspections,
      [caseId]: { ...state.reinspections[caseId], ...updates },
    },
  })),
}));

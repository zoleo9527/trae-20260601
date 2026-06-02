import { create } from 'zustand';
import type { RiskCase } from '../types';
import { mockRiskCases } from '../data/mockData';

interface RiskState {
  riskCases: RiskCase[];
  selectedCase: RiskCase | null;
  setRiskCases: (cases: RiskCase[]) => void;
  setSelectedCase: (caseItem: RiskCase | null) => void;
  reviewCase: (id: string, notes: string) => void;
  markActionTaken: (id: string) => void;
  getPendingReview: () => RiskCase[];
  getReviewed: () => RiskCase[];
  getHighRiskCount: () => number;
}

export const useRiskStore = create<RiskState>((set, get) => ({
  riskCases: mockRiskCases,
  selectedCase: null,
  
  setRiskCases: (cases) => set({ riskCases: cases }),
  setSelectedCase: (caseItem) => set({ selectedCase: caseItem }),
  
  reviewCase: (id, notes) =>
    set((state) => ({
      riskCases: state.riskCases.map((c) =>
        c.id === id ? { ...c, status: 'reviewed' as const, supervisorNotes: notes, reviewedAt: new Date().toISOString() } : c
      ),
    })),
  
  markActionTaken: (id) =>
    set((state) => ({
      riskCases: state.riskCases.map((c) =>
        c.id === id ? { ...c, status: 'action_taken' as const } : c
      ),
    })),
  
  getPendingReview: () => get().riskCases.filter((c) => c.status === 'pending_review'),
  getReviewed: () => get().riskCases.filter((c) => c.status !== 'pending_review'),
  getHighRiskCount: () => get().riskCases.filter((c) => c.status === 'pending_review').length,
}));

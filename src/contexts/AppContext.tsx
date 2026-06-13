import { createContext, useContext, ReactNode } from 'react';
import { create } from 'zustand';
import type { User, Settlement, Appeal, Position, Candidate, HistoryRecord } from '../types';
import { mockUsers } from '../data/mockUsers';
import { mockSettlements } from '../data/mockSettlements';
import { mockAppeals } from '../data/mockAppeals';
import { mockPositions } from '../data/mockPositions';
import { mockCandidates } from '../data/mockCandidates';

interface AppState {
  user: User | null;
  settlements: Settlement[];
  appeals: Appeal[];
  positions: Position[];
  candidates: Candidate[];
  setUser: (user: User) => void;
  logout: () => void;
  updateSettlement: (settlement: Settlement) => void;
  updateAppeal: (appeal: Appeal) => void;
  addHistoryRecord: (type: 'settlement' | 'appeal', id: string, record: HistoryRecord) => void;
}

const useStore = create<AppState>((set) => ({
  user: null,
  settlements: mockSettlements,
  appeals: mockAppeals,
  positions: mockPositions,
  candidates: mockCandidates,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
  updateSettlement: (settlement) =>
    set((state) => ({
      settlements: state.settlements.map((s) =>
        s.id === settlement.id ? settlement : s
      ),
    })),
  updateAppeal: (appeal) =>
    set((state) => ({
      appeals: state.appeals.map((a) =>
        a.id === appeal.id ? appeal : a
      ),
    })),
  addHistoryRecord: (type, id, record) =>
    set((state) => {
      if (type === 'settlement') {
        return {
          settlements: state.settlements.map((s) =>
            s.id === id
              ? { ...s, history: [...s.history, record], updatedAt: record.time }
              : s
          ),
        };
      } else {
        return {
          appeals: state.appeals.map((a) =>
            a.id === id
              ? { ...a, history: [...a.history, record], updatedAt: record.time }
              : a
          ),
        };
      }
    }),
}));

const AppContext = createContext<{
  user: User | null;
  settlements: Settlement[];
  appeals: Appeal[];
  positions: Position[];
  candidates: Candidate[];
  setUser: (user: User) => void;
  logout: () => void;
  updateSettlement: (settlement: Settlement) => void;
  updateAppeal: (appeal: Appeal) => void;
  addHistoryRecord: (type: 'settlement' | 'appeal', id: string, record: HistoryRecord) => void;
} | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const store = useStore();
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export { useStore };
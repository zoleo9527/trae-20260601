import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localForage from 'localforage';
import { useEffect } from 'react';
import { RecordItem, RecordDetail, HistoryItem, NoteItem, UserInfo, UserRole, RecordStatus, FilterParams } from '../types';
import { sampleRecords, sampleHistory, sampleNotes, sampleUsers } from '../data/sampleData';

interface AppState {
  user: UserInfo | null;
  records: RecordItem[];
  history: HistoryItem[];
  notes: NoteItem[];
  filters: FilterParams;
  isOnline: boolean;
  isLoading: boolean;

  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  login: (role: UserRole) => void;
  logout: () => void;

  setRecords: (records: RecordItem[]) => void;
  addRecord: (record: RecordItem) => void;
  updateRecord: (id: string, updates: Partial<RecordItem>) => void;
  deleteRecord: (id: string) => void;

  addHistory: (history: HistoryItem) => void;
  addNote: (note: NoteItem) => void;

  setFilters: (filters: FilterParams) => void;
  clearFilters: () => void;

  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;

  getRecordDetail: (id: string) => RecordDetail | undefined;
  getFilteredRecords: () => RecordItem[];
  getStatusStats: () => Record<RecordStatus, number>;
}

const generateId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      records: sampleRecords,
      history: sampleHistory,
      notes: sampleNotes,
      filters: {},
      isOnline: navigator.onLine,
      isLoading: false,

      setUser: (user) => set({ user }),

      clearUser: () => set({ user: null }),

      login: (role) => {
        const user = sampleUsers.find(u => u.role === role);
        if (user) {
          set({ user: { id: user.id, name: user.name, role: user.role } });
        }
      },

      logout: () => set({ user: null }),

      setRecords: (records) => set({ records }),

      addRecord: (record) => set((state) => ({
        records: [...state.records, record],
      })),

      updateRecord: (id, updates) => set((state) => ({
        records: state.records.map(r =>
          r.id === id ? { ...r, ...updates, updatedAt: getCurrentTime() } : r
        ),
      })),

      deleteRecord: (id) => set((state) => ({
        records: state.records.filter(r => r.id !== id),
      })),

      addHistory: (history) => set((state) => ({
        history: [...state.history, history],
      })),

      addNote: (note) => set((state) => ({
        notes: [...state.notes, note],
      })),

      setFilters: (filters) => set({ filters }),

      clearFilters: () => set({ filters: {} }),

      setOnline: (online) => set({ isOnline: online }),

      setLoading: (loading) => set({ isLoading: loading }),

      getRecordDetail: (id) => {
        const state = get();
        const record = state.records.find(r => r.id === id);
        if (!record) return undefined;
        return {
          ...record,
          history: state.history.filter(h => h.recordId === id).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          notes: state.notes.filter(n => n.recordId === id).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        };
      },

      getFilteredRecords: () => {
        const state = get();
        let filtered = [...state.records];

        if (!state.user) return [];

        const viewPermissions = state.user.role === 'counter'
          ? ['pending', 'rejected']
          : state.user.role === 'warehouse'
          ? ['pending', 'reviewing']
          : ['approved', 'recheck', 'closed'];

        filtered = filtered.filter(r => viewPermissions.includes(r.status));

        if (state.filters.status) {
          filtered = filtered.filter(r => r.status === state.filters.status);
        }

        if (state.filters.keyword) {
          const keyword = state.filters.keyword.toLowerCase();
          filtered = filtered.filter(r =>
            r.id.toLowerCase().includes(keyword) ||
            r.category.toLowerCase().includes(keyword) ||
            r.brand.toLowerCase().includes(keyword) ||
            r.model.toLowerCase().includes(keyword) ||
            r.operatorName.toLowerCase().includes(keyword)
          );
        }

        if (state.filters.startDate) {
          filtered = filtered.filter(r => r.createdAt >= state.filters.startDate);
        }

        if (state.filters.endDate) {
          filtered = filtered.filter(r => r.createdAt <= state.filters.endDate);
        }

        return filtered.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      getStatusStats: () => {
        const state = get();
        const stats: Record<RecordStatus, number> = {
          pending: 0,
          reviewing: 0,
          approved: 0,
          rejected: 0,
          closed: 0,
          recheck: 0,
        };

        const filtered = state.getFilteredRecords();
        filtered.forEach(r => {
          stats[r.status]++;
        });

        return stats;
      },
    }),
    {
      name: 'pawn-shop-storage',
      storage: createJSONStorage(() => localForage),
    }
  )
);

export const useOfflineStatus = () => {
  const { isOnline, setOnline } = useAppStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return isOnline;
};

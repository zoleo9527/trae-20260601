import { create } from 'zustand';
import type { BanquetSummary, Banquet, Alert, UserRole, PlanVersion, CompareResult, CreateVersionRequest, ConfirmItem } from '@shared/types';
import { api } from '@/services/api';

interface AppState {
  currentRole: UserRole;
  banquets: BanquetSummary[];
  currentBanquet: Banquet | null;
  alerts: Alert[];
  compareResult: CompareResult | null;
  loading: boolean;
  error: string | null;

  setRole: (role: UserRole) => void;
  fetchBanquets: (params?: { type?: string; status?: string; search?: string }) => Promise<void>;
  fetchBanquet: (id: string) => Promise<void>;
  fetchAlerts: (params?: { scope?: string; priority?: string; acknowledged?: string }) => Promise<void>;
  compareVersions: (banquetId: string, v1: number, v2: number) => Promise<void>;
  confirmBanquet: (banquetId: string, data: { version: number; role: UserRole; confirmer: string; remark?: string; confirmItem?: ConfirmItem }) => Promise<void>;
  createVersion: (banquetId: string, data: CreateVersionRequest) => Promise<void>;
  acknowledgeAlert: (alertId: string, acknowledgedBy: string) => Promise<void>;
  clearCurrentBanquet: () => void;
  clearCompareResult: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'hall_manager',
  banquets: [],
  currentBanquet: null,
  alerts: [],
  compareResult: null,
  loading: false,
  error: null,

  setRole: async (role) => {
    set({ currentRole: role });
    await get().fetchBanquets();
    await get().fetchAlerts();
  },

  fetchBanquets: async (params) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const banquets = await api.getBanquets({
        ...params,
        role: state.currentRole,
      });
      set({ banquets, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchBanquet: async (id) => {
    set({ loading: true, error: null });
    try {
      const banquet = await api.getBanquet(id);
      set({ currentBanquet: banquet, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchAlerts: async (params) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const alerts = await api.getAlerts({
        ...params,
        role: state.currentRole,
      });
      set({ alerts, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  compareVersions: async (banquetId, v1, v2) => {
    set({ loading: true, error: null });
    try {
      const result = await api.compareVersions(banquetId, v1, v2);
      set({ compareResult: result, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  confirmBanquet: async (banquetId, data) => {
    set({ loading: true, error: null });
    try {
      await api.confirmBanquet(banquetId, {
        version: data.version,
        role: data.role,
        confirmer: data.confirmer,
        remark: data.remark,
        confirmItem: data.confirmItem,
      });
      await get().fetchBanquet(banquetId);
      await get().fetchBanquets();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createVersion: async (banquetId, data) => {
    set({ loading: true, error: null });
    try {
      await api.createVersion(banquetId, data);
      await get().fetchBanquet(banquetId);
      await get().fetchBanquets();
      await get().fetchAlerts();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  acknowledgeAlert: async (alertId, acknowledgedBy) => {
    try {
      await api.acknowledgeAlert(alertId, acknowledgedBy);
      await get().fetchAlerts();
      const { currentBanquet } = get();
      if (currentBanquet) {
        await get().fetchBanquet(currentBanquet.id);
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  clearCurrentBanquet: () => set({ currentBanquet: null }),
  clearCompareResult: () => set({ compareResult: null }),
}));

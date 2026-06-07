import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Store,
  Product,
  User,
  InventoryDifference,
  LossRecord,
  Alert,
  InventoryDifferenceStatus,
  LossAnalysisStatus,
  AlertStatus,
  DifferenceFilterParams,
  LossFilterParams,
  AlertFilterParams,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import { mockStores, mockProducts, mockUsers } from '@/data/mockData';
import {
  differenceApi,
  lossApi,
  alertApi,
  dashboardApi,
} from '@/services/api';

interface StoreState {
  stores: Store[];
  products: Product[];
  users: User[];
  currentUser: User;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;

  setCurrentUser: (user: User) => void;
  switchRole: (role: User['role']) => void;
  setLoading: (key: string, value: boolean) => void;
  setError: (key: string, error: string | null) => void;

  getInventoryDifferences: (
    pagination: PaginationParams,
    filters?: DifferenceFilterParams
  ) => Promise<PaginatedResponse<InventoryDifference>>;
  getInventoryDifferenceById: (id: string) => Promise<InventoryDifference | undefined>;
  updateDifferenceStatus: (
    id: string,
    status: InventoryDifferenceStatus,
    remark?: string,
    relatedLossId?: string
  ) => Promise<InventoryDifference | null>;

  getLossRecords: (
    pagination: PaginationParams,
    filters?: LossFilterParams
  ) => Promise<PaginatedResponse<LossRecord>>;
  getLossRecordById: (id: string) => Promise<LossRecord | undefined>;
  updateLossStatus: (
    id: string,
    status: LossAnalysisStatus,
    analysisData?: {
      rootCause?: string;
      preventiveMeasure?: string;
      responsibleParty?: string;
      conclusion?: string;
      relatedDifferenceId?: string;
    }
  ) => Promise<LossRecord | null>;

  getAlerts: (
    pagination: PaginationParams,
    filters?: AlertFilterParams
  ) => Promise<PaginatedResponse<Alert>>;
  getActiveAlerts: () => Promise<Alert[]>;
  updateAlertStatus: (
    id: string,
    status: AlertStatus,
    resolution?: string
  ) => Promise<Alert | null>;

  getDashboardStats: () => Promise<{
    totalDifferences: number;
    pendingDifferences: number;
    totalLoss: number;
    activeAlerts: number;
    criticalAlerts: number;
  }>;
  getLossTrendData: () => Promise<Array<{ date: string; amount: number; count: number }>>;
  getLossTypeDistribution: () => Promise<Array<{ type: string; value: number; name: string }>>;
  getDifferenceTypeDistribution: () => Promise<Array<{ type: string; value: number; name: string }>>;
}

const getCurrentUserByRole = (role: User['role']): User => {
  switch (role) {
    case 'store_manager':
      return mockUsers[0];
    case 'supervisor':
      return mockUsers[2];
    case 'product_specialist':
      return mockUsers[3];
    default:
      return mockUsers[0];
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      stores: mockStores,
      products: mockProducts,
      users: mockUsers,
      currentUser: getCurrentUserByRole('store_manager'),
      loading: {},
      error: {},

      setLoading: (key, value) =>
        set((state) => ({
          loading: { ...state.loading, [key]: value },
        })),

      setError: (key, error) =>
        set((state) => ({
          error: { ...state.error, [key]: error },
        })),

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      switchRole: (role) => {
        const user = getCurrentUserByRole(role);
        set({ currentUser: user });
      },

      getInventoryDifferences: async (pagination, filters) => {
        const key = 'getInventoryDifferences';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await differenceApi.getList(pagination, filters);
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getInventoryDifferenceById: async (id) => {
        const key = 'getInventoryDifferenceById';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await differenceApi.getById(id);
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      updateDifferenceStatus: async (id, status, remark, relatedLossId) => {
        const key = 'updateDifferenceStatus';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await differenceApi.updateStatus(id, {
            status,
            remark,
            relatedLossId,
          });
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getLossRecords: async (pagination, filters) => {
        const key = 'getLossRecords';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await lossApi.getList(pagination, filters);
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getLossRecordById: async (id) => {
        const key = 'getLossRecordById';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await lossApi.getById(id);
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      updateLossStatus: async (id, status, analysisData) => {
        const key = 'updateLossStatus';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await lossApi.updateStatus(id, {
            status,
            ...analysisData,
          });
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getAlerts: async (pagination, filters) => {
        const key = 'getAlerts';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await alertApi.getList(pagination, filters);
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getActiveAlerts: async () => {
        const key = 'getActiveAlerts';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await alertApi.getActive();
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      updateAlertStatus: async (id, status, resolution) => {
        const key = 'updateAlertStatus';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await alertApi.updateStatus(id, {
            status,
            resolution,
          });
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getDashboardStats: async () => {
        const key = 'getDashboardStats';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await dashboardApi.getStats();
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getLossTrendData: async () => {
        const key = 'getLossTrendData';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await dashboardApi.getLossTrend();
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getLossTypeDistribution: async () => {
        const key = 'getLossTypeDistribution';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await dashboardApi.getLossTypeDistribution();
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },

      getDifferenceTypeDistribution: async () => {
        const key = 'getDifferenceTypeDistribution';
        get().setLoading(key, true);
        get().setError(key, null);
        try {
          const result = await dashboardApi.getDifferenceTypeDistribution();
          return result;
        } catch (error: any) {
          get().setError(key, error.message);
          throw error;
        } finally {
          get().setLoading(key, false);
        }
      },
    }),
    {
      name: 'convenience-store-inventory',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);

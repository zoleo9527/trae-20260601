import { create } from 'zustand';
import { Store, User, Product, StockRequest, Inspection, Difference, RequestWithDetails } from '../types';
import { api } from '../api';

interface AppState {
  stores: Store[];
  users: User[];
  products: Product[];
  stockRequests: RequestWithDetails[];
  differences: Difference[];
  currentUser: User;
  isLoading: boolean;
  error: string | null;
  
  setCurrentUser: (user: User) => void;
  loadData: () => Promise<void>;
  addStockRequest: (request: Omit<StockRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'supervisorComment' | 'confirmedQty'>) => Promise<void>;
  updateRequestStatus: (id: number, status: StockRequest['status'], comment?: string, confirmedQty?: number) => Promise<void>;
  addInspection: (inspection: Omit<Inspection, 'id' | 'inspectedAt'>) => Promise<void>;
  addDifference: (difference: Omit<Difference, 'id' | 'processedAt' | 'status' | 'handlerId' | 'processingResult'>) => Promise<void>;
  updateDifferenceStatus: (id: number, status: Difference['status'], processingResult?: string, handlerId?: number) => Promise<void>;
}

const defaultUser: User = { id: 1, name: '张三', role: 'manager', storeId: 1, createdAt: '2024-01-01T00:00:00Z' };

export const useAppStore = create<AppState>((set, get) => ({
  stores: [],
  users: [],
  products: [],
  stockRequests: [],
  differences: [],
  currentUser: defaultUser,
  isLoading: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [stores, users, products, stockRequests, differences] = await Promise.all([
        api.stores.getAll(),
        api.users.getAll(),
        api.products.getAll(),
        api.stockRequests.getAll(),
        api.differences.getAll(),
      ]);
      set({
        stores,
        users,
        products,
        stockRequests,
        differences,
        isLoading: false,
      });
    } catch (err) {
      set({ error: '加载数据失败', isLoading: false });
      console.error('Failed to load data:', err);
    }
  },

  addStockRequest: async (request) => {
    try {
      await api.stockRequests.create({
        storeId: request.storeId,
        userId: request.userId,
        productId: request.productId,
        requestQty: request.requestQty,
        reason: request.reason,
        affectsBusiness: request.affectsBusiness,
        expectedDate: request.expectedDate,
      });
      await get().loadData();
    } catch (err) {
      set({ error: '创建申领失败' });
      console.error('Failed to create stock request:', err);
    }
  },

  updateRequestStatus: async (id, status, comment, confirmedQty) => {
    try {
      await api.stockRequests.updateStatus(id, { status, supervisorComment: comment, confirmedQty });
      await get().loadData();
    } catch (err) {
      set({ error: '更新状态失败' });
      console.error('Failed to update request status:', err);
    }
  },

  addInspection: async (inspection) => {
    try {
      await api.inspections.create({
        requestId: inspection.requestId,
        actualQty: inspection.actualQty,
        actualSpec: inspection.actualSpec,
        temperature: inspection.temperature,
        isNormal: inspection.isNormal,
        inspectorId: inspection.inspectorId,
      });
      await get().loadData();
    } catch (err) {
      set({ error: '创建验收记录失败' });
      console.error('Failed to create inspection:', err);
    }
  },

  addDifference: async (difference) => {
    try {
      await api.differences.create({
        inspectionId: difference.inspectionId,
        type: difference.type,
        description: difference.description,
      });
      await get().loadData();
    } catch (err) {
      set({ error: '创建差异记录失败' });
      console.error('Failed to create difference:', err);
    }
  },

  updateDifferenceStatus: async (id, status, processingResult, handlerId) => {
    try {
      await api.differences.updateStatus(id, { status, processingResult, handlerId });
      await get().loadData();
    } catch (err) {
      set({ error: '更新差异状态失败' });
      console.error('Failed to update difference status:', err);
    }
  },
}));

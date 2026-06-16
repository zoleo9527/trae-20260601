import { create } from 'zustand';
import type { 
  ReturnExchangeRequest, 
  ReissueTracking, 
  SalesOrder, 
  WarehouseLocation,
  PaginatedResult,
  UserRole,
} from '../types';
import { returnsApi, reissueApi, ordersApi, warehouseApi, attachmentsApi } from '../api';

interface CurrentUser {
  name: string;
  role: UserRole;
}

interface AppState {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;

  returnList: PaginatedResult<ReturnExchangeRequest> | null;
  returnDetail: ReturnExchangeRequest | null;
  returnDetailId: string | null;
  returnListParams: any;
  loadingReturns: boolean;
  
  reissueList: PaginatedResult<ReissueTracking> | null;
  reissueDetail: ReissueTracking | null;
  reissueDetailId: string | null;
  reissueListParams: any;
  loadingReissues: boolean;

  orderList: PaginatedResult<SalesOrder> | null;
  orderDetail: SalesOrder | null;
  loadingOrders: boolean;

  warehouseLocations: WarehouseLocation[];
  loadingLocations: boolean;

  error: string | null;
  setError: (error: string | null) => void;

  serviceHealthy: boolean;
  setServiceHealthy: (healthy: boolean) => void;
  refreshPageData: () => void;

  fetchReturnList: (params?: any) => Promise<void>;
  fetchReturnDetail: (id: string) => Promise<void>;
  clearReturnDetail: () => void;

  fetchReissueList: (params?: any) => Promise<void>;
  fetchReissueDetail: (id: string) => Promise<void>;
  clearReissueDetail: () => void;

  fetchOrderList: (params?: any) => Promise<void>;
  fetchOrderDetail: (id: string) => Promise<void>;

  fetchWarehouseLocations: () => Promise<void>;

  createReturnRequest: (data: any) => Promise<ReturnExchangeRequest>;
  submitReturnRequest: (id: string, data: any) => Promise<void>;
  warehouseConfirm: (id: string, data: any) => Promise<void>;
  cancelReturnRequest: (id: string, data: any) => Promise<void>;
  batchWarehouseConfirm: (data: any) => Promise<void>;
  completeReturnRequest: (id: string, data: any) => Promise<void>;
  batchCancel: (data: any) => Promise<void>;

  createReissue: (data: any) => Promise<ReissueTracking>;
  updateDraftStatus: (draftId: string, targetStatus: string, remark?: string) => Promise<void>;
  startPicking: (id: string, data: any) => Promise<void>;
  shipReissue: (id: string, data: any) => Promise<void>;
  outForDelivery: (id: string, data: any) => Promise<void>;
  deliverReissue: (id: string, data: any) => Promise<void>;
  cancelReissue: (id: string, data: any) => Promise<void>;

  addAttachment: (requestId: string, data: any) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    name: '陈客服',
    role: 'customer_service',
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  returnList: null,
  returnDetail: null,
  returnDetailId: null,
  returnListParams: { page: 1, pageSize: 10 },
  loadingReturns: false,

  reissueList: null,
  reissueDetail: null,
  reissueDetailId: null,
  reissueListParams: { page: 1, pageSize: 10 },
  loadingReissues: false,

  orderList: null,
  orderDetail: null,
  loadingOrders: false,

  warehouseLocations: [],
  loadingLocations: false,

  error: null,
  setError: (error) => set({ error }),

  serviceHealthy: true,

  setServiceHealthy: (healthy) => {
    const oldState = get();
    if (oldState.serviceHealthy !== healthy) {
      set({ serviceHealthy: healthy });
      if (healthy) {
        console.log('服务恢复，自动刷新数据...');
        get().refreshPageData();
      }
    }
  },

  refreshPageData: () => {
    const { 
      fetchReturnList, returnListParams,
      fetchReissueList, reissueListParams,
      returnDetailId, fetchReturnDetail,
      reissueDetailId, fetchReissueDetail,
    } = get();
    
    fetchReturnList(returnListParams);
    fetchReissueList(reissueListParams);
    
    if (returnDetailId) fetchReturnDetail(returnDetailId);
    if (reissueDetailId) fetchReissueDetail(reissueDetailId);
    
    set({ error: null });
  },

  fetchReturnList: async (params) => {
    const currentParams = params || get().returnListParams;
    set({ loadingReturns: true, error: null, returnListParams: currentParams });
    try {
      const data = await returnsApi.getList(currentParams);
      set({ returnList: data, loadingReturns: false });
    } catch (error: any) {
      set({ loadingReturns: false, error: error.message || '加载失败' });
      throw error;
    }
  },

  fetchReturnDetail: async (id) => {
    set({ loadingReturns: true, error: null, returnDetailId: id });
    try {
      const data = await returnsApi.getDetail(id);
      set({ returnDetail: data, loadingReturns: false });
    } catch (error: any) {
      set({ loadingReturns: false, error: error.message || '加载失败' });
      throw error;
    }
  },

  clearReturnDetail: () => set({ returnDetail: null, returnDetailId: null }),

  fetchReissueList: async (params) => {
    const currentParams = params || get().reissueListParams;
    set({ loadingReissues: true, error: null, reissueListParams: currentParams });
    try {
      const data = await reissueApi.getList(currentParams);
      set({ reissueList: data, loadingReissues: false });
    } catch (error: any) {
      set({ loadingReissues: false, error: error.message || '加载失败' });
      throw error;
    }
  },

  fetchReissueDetail: async (id) => {
    set({ loadingReissues: true, error: null, reissueDetailId: id });
    try {
      const data = await reissueApi.getDetail(id);
      set({ reissueDetail: data, loadingReissues: false });
    } catch (error: any) {
      set({ loadingReissues: false, error: error.message || '加载失败' });
      throw error;
    }
  },

  clearReissueDetail: () => set({ reissueDetail: null, reissueDetailId: null }),

  fetchOrderList: async (params) => {
    set({ loadingOrders: true, error: null });
    try {
      const data = await ordersApi.getList(params);
      set({ orderList: data, loadingOrders: false });
    } catch (error: any) {
      set({ loadingOrders: false, error: error.message || '加载失败' });
      throw error;
    }
  },

  fetchOrderDetail: async (id) => {
    set({ loadingOrders: true, error: null });
    try {
      const data = await ordersApi.getDetail(id);
      set({ orderDetail: data, loadingOrders: false });
    } catch (error: any) {
      set({ loadingOrders: false, error: error.message || '加载失败' });
      throw error;
    }
  },

  fetchWarehouseLocations: async () => {
    set({ loadingLocations: true, error: null });
    try {
      const data = await warehouseApi.getLocations();
      set({ warehouseLocations: data, loadingLocations: false });
    } catch (error: any) {
      set({ loadingLocations: false, error: error.message || '加载失败' });
      throw error;
    }
  },

  createReturnRequest: async (data) => {
    const result = await returnsApi.create(data);
    const { fetchReturnList, returnListParams } = get();
    fetchReturnList(returnListParams);
    return result;
  },

  submitReturnRequest: async (id, data) => {
    await returnsApi.submit(id, data);
    const { fetchReturnDetail, fetchReturnList } = get();
    fetchReturnDetail(id);
  },

  warehouseConfirm: async (id, data) => {
    await returnsApi.warehouseConfirm(id, data);
    const { fetchReturnDetail } = get();
    fetchReturnDetail(id);
  },

  cancelReturnRequest: async (id, data) => {
    await returnsApi.cancel(id, data);
    const { fetchReturnDetail } = get();
    fetchReturnDetail(id);
  },

  completeReturnRequest: async (id, data) => {
    await returnsApi.complete(id, data);
    const { fetchReturnDetail, fetchReturnList, returnListParams } = get();
    fetchReturnDetail(id);
    fetchReturnList(returnListParams);
    set({ error: null });
  },

  batchWarehouseConfirm: async (data) => {
    await returnsApi.batchWarehouseConfirm(data);
    const { fetchReturnList } = get();
    fetchReturnList();
  },

  batchCancel: async (data) => {
    await returnsApi.batchCancel(data);
    const { fetchReturnList } = get();
    fetchReturnList();
  },

  createReissue: async (data) => {
    const result = await reissueApi.create(data);
    return result;
  },

  updateDraftStatus: async (draftId, targetStatus, remark) => {
    const { currentUser } = get();
    const data = {
      operator: currentUser.name,
      operator_role: currentUser.role,
      remark,
    };

    switch (targetStatus) {
      case 'pending_warehouse':
        await returnsApi.submit(draftId, data);
        break;
      case 'warehouse_confirmed':
        await returnsApi.warehouseConfirm(draftId, data);
        break;
      case 'cancelled':
        await returnsApi.cancel(draftId, data);
        break;
      default:
        break;
    }

    const { fetchReturnDetail } = get();
    fetchReturnDetail(draftId);
  },

  startPicking: async (id, data) => {
    await reissueApi.startPicking(id, data);
    const { fetchReissueDetail } = get();
    fetchReissueDetail(id);
  },

  shipReissue: async (id, data) => {
    await reissueApi.ship(id, data);
    const { fetchReissueDetail } = get();
    fetchReissueDetail(id);
  },

  outForDelivery: async (id, data) => {
    await reissueApi.outForDelivery(id, data);
    const { fetchReissueDetail } = get();
    fetchReissueDetail(id);
  },

  deliverReissue: async (id, data) => {
    await reissueApi.deliver(id, data);
    const { fetchReissueDetail } = get();
    fetchReissueDetail(id);
  },

  cancelReissue: async (id, data) => {
    await reissueApi.cancel(id, data);
    const { fetchReissueDetail } = get();
    fetchReissueDetail(id);
  },

  addAttachment: async (requestId, data) => {
    await attachmentsApi.addToRequest(requestId, data);
    const { fetchReturnDetail } = get();
    fetchReturnDetail(requestId);
  },

  deleteAttachment: async (id) => {
    await attachmentsApi.delete(id);
    const { returnDetailId, fetchReturnDetail, reissueDetailId, fetchReissueDetail } = get();
    if (returnDetailId) fetchReturnDetail(returnDetailId);
    if (reissueDetailId) fetchReissueDetail(reissueDetailId);
  },
}));

export default useAppStore;

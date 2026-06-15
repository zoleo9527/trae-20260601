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
  loadingReturns: boolean;
  
  reissueList: PaginatedResult<ReissueTracking> | null;
  reissueDetail: ReissueTracking | null;
  loadingReissues: boolean;

  orderList: PaginatedResult<SalesOrder> | null;
  orderDetail: SalesOrder | null;
  loadingOrders: boolean;

  warehouseLocations: WarehouseLocation[];
  loadingLocations: boolean;

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
  loadingReturns: false,

  reissueList: null,
  reissueDetail: null,
  loadingReissues: false,

  orderList: null,
  orderDetail: null,
  loadingOrders: false,

  warehouseLocations: [],
  loadingLocations: false,

  fetchReturnList: async (params) => {
    set({ loadingReturns: true });
    try {
      const data = await returnsApi.getList(params);
      set({ returnList: data, loadingReturns: false });
    } catch (error) {
      set({ loadingReturns: false });
      throw error;
    }
  },

  fetchReturnDetail: async (id) => {
    set({ loadingReturns: true });
    try {
      const data = await returnsApi.getDetail(id);
      set({ returnDetail: data, loadingReturns: false });
    } catch (error) {
      set({ loadingReturns: false });
      throw error;
    }
  },

  clearReturnDetail: () => set({ returnDetail: null }),

  fetchReissueList: async (params) => {
    set({ loadingReissues: true });
    try {
      const data = await reissueApi.getList(params);
      set({ reissueList: data, loadingReissues: false });
    } catch (error) {
      set({ loadingReissues: false });
      throw error;
    }
  },

  fetchReissueDetail: async (id) => {
    set({ loadingReissues: true });
    try {
      const data = await reissueApi.getDetail(id);
      set({ reissueDetail: data, loadingReissues: false });
    } catch (error) {
      set({ loadingReissues: false });
      throw error;
    }
  },

  clearReissueDetail: () => set({ reissueDetail: null }),

  fetchOrderList: async (params) => {
    set({ loadingOrders: true });
    try {
      const data = await ordersApi.getList(params);
      set({ orderList: data, loadingOrders: false });
    } catch (error) {
      set({ loadingOrders: false });
      throw error;
    }
  },

  fetchOrderDetail: async (id) => {
    set({ loadingOrders: true });
    try {
      const data = await ordersApi.getDetail(id);
      set({ orderDetail: data, loadingOrders: false });
    } catch (error) {
      set({ loadingOrders: false });
      throw error;
    }
  },

  fetchWarehouseLocations: async () => {
    set({ loadingLocations: true });
    try {
      const data = await warehouseApi.getLocations();
      set({ warehouseLocations: data, loadingLocations: false });
    } catch (error) {
      set({ loadingLocations: false });
      throw error;
    }
  },

  createReturnRequest: async (data) => {
    const result = await returnsApi.create(data);
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
    const { fetchReissueDetail, fetchReturnDetail } = get();
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
  },
}));

export default useAppStore;

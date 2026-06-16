import { create } from 'zustand';
import { Store, User, Product, StockRequest, Inspection, Difference, RequestWithDetails } from '../types';
import { mockStores, mockUsers, mockProducts, mockStockRequests, mockInspections, mockDifferences } from '../data/mockData';

interface AppState {
  stores: Store[];
  users: User[];
  products: Product[];
  stockRequests: StockRequest[];
  inspections: Inspection[];
  differences: Difference[];
  currentUser: User;
  
  setCurrentUser: (user: User) => void;
  getRequestWithDetails: (id: number) => RequestWithDetails | undefined;
  getAllRequestsWithDetails: () => RequestWithDetails[];
  addStockRequest: (request: Omit<StockRequest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRequestStatus: (id: number, status: StockRequest['status'], comment?: string) => void;
  addInspection: (inspection: Omit<Inspection, 'id' | 'inspectedAt'>) => void;
  addDifference: (difference: Omit<Difference, 'id' | 'processedAt'>) => void;
  updateDifferenceStatus: (id: number, status: Difference['status']) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stores: mockStores,
  users: mockUsers,
  products: mockProducts,
  stockRequests: mockStockRequests,
  inspections: mockInspections,
  differences: mockDifferences,
  currentUser: mockUsers[0],

  setCurrentUser: (user) => set({ currentUser: user }),

  getRequestWithDetails: (id) => {
    const { stockRequests, stores, users, products, inspections, differences } = get();
    const request = stockRequests.find(r => r.id === id);
    if (!request) return undefined;

    return {
      ...request,
      store: stores.find(s => s.id === request.storeId)!,
      user: users.find(u => u.id === request.userId)!,
      product: products.find(p => p.id === request.productId)!,
      inspection: inspections.find(i => i.requestId === id),
      differences: differences.filter(d => {
        const inspection = inspections.find(i => i.requestId === id);
        return inspection && d.inspectionId === inspection.id;
      }),
    };
  },

  getAllRequestsWithDetails: () => {
    const { stockRequests, stores, users, products, inspections, differences } = get();
    return stockRequests.map(request => ({
      ...request,
      store: stores.find(s => s.id === request.storeId)!,
      user: users.find(u => u.id === request.userId)!,
      product: products.find(p => p.id === request.productId)!,
      inspection: inspections.find(i => i.requestId === request.id),
      differences: differences.filter(d => {
        const inspection = inspections.find(i => i.requestId === request.id);
        return inspection && d.inspectionId === inspection.id;
      }),
    }));
  },

  addStockRequest: (request) => {
    const newRequest: StockRequest = {
      ...request,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({ stockRequests: [...state.stockRequests, newRequest] }));
  },

  updateRequestStatus: (id, status, comment) => {
    set(state => ({
      stockRequests: state.stockRequests.map(r =>
        r.id === id
          ? {
              ...r,
              status,
              supervisorComment: comment || r.supervisorComment,
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }));
  },

  addInspection: (inspection) => {
    const newInspection: Inspection = {
      ...inspection,
      id: Date.now(),
      inspectedAt: new Date().toISOString(),
    };
    set(state => ({ inspections: [...state.inspections, newInspection] }));
    get().updateRequestStatus(inspection.requestId, 'inspected');
  },

  addDifference: (difference) => {
    const newDifference: Difference = {
      ...difference,
      id: Date.now(),
      processedAt: null,
    };
    set(state => ({ differences: [...state.differences, newDifference] }));
  },

  updateDifferenceStatus: (id, status) => {
    set(state => ({
      differences: state.differences.map(d =>
        d.id === id
          ? {
              ...d,
              status,
              processedAt: status === 'resolved' ? new Date().toISOString() : d.processedAt,
            }
          : d
      ),
    }));
  },
}));

import { create } from 'zustand';
import { WorkOrder, FilterType, Status, Operation } from '../types';
import { mockWorkOrders } from '../data/mockData';

interface WorkOrderStore {
  orders: WorkOrder[];
  selectedOrder: WorkOrder | null;
  filter: FilterType;
  searchQuery: string;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  selectOrder: (order: WorkOrder | null) => void;
  updateOrderStatus: (id: string, status: Status) => void;
  addOperation: (id: string, operation: Operation) => void;
  addSatisfaction: (id: string, score: number, comment: string, operator: string) => void;
  filteredOrders: () => WorkOrder[];
}

const today = new Date().toISOString().split('T')[0];

export const useWorkOrderStore = create<WorkOrderStore>((set, get) => ({
  orders: mockWorkOrders,
  selectedOrder: null,
  filter: 'all',
  searchQuery: '',

  setFilter: (filter) => set({ filter }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  selectOrder: (order) => set({ selectedOrder: order }),

  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              updatedAt: new Date().toISOString(),
            }
          : order
      ),
      selectedOrder:
        state.selectedOrder?.id === id
          ? {
              ...state.selectedOrder,
              status,
              updatedAt: new Date().toISOString(),
            }
          : state.selectedOrder,
    })),

  addOperation: (id, operation) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? {
              ...order,
              history: [...order.history, operation],
              updatedAt: operation.timestamp,
            }
          : order
      ),
      selectedOrder:
        state.selectedOrder?.id === id
          ? {
              ...state.selectedOrder,
              history: [...state.selectedOrder.history, operation],
              updatedAt: operation.timestamp,
            }
          : state.selectedOrder,
    })),

  addSatisfaction: (id, score, comment, operator) => {
    const now = new Date().toISOString();
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? {
              ...order,
              satisfaction: {
                score,
                comment,
                createdAt: now,
                operator,
              },
              updatedAt: now,
            }
          : order
      ),
      selectedOrder:
        state.selectedOrder?.id === id
          ? {
              ...state.selectedOrder,
              satisfaction: {
                score,
                comment,
                createdAt: now,
                operator,
              },
              updatedAt: now,
            }
          : state.selectedOrder,
    }));
  },

  filteredOrders: () => {
    const { orders, filter, searchQuery } = get();

    let result = orders;

    if (filter === 'today') {
      result = result.filter(
        (order) =>
          order.createdAt.startsWith(today) &&
          (order.status === 'pending' || order.status === 'processing')
      );
    } else if (filter === 'overdue') {
      result = result.filter((order) => order.status === 'overdue');
    } else if (filter === 'rejected') {
      result = result.filter((order) => order.status === 'rejected');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.title.toLowerCase().includes(query) ||
          order.location.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const statusOrder: Record<Status, number> = {
        overdue: 0,
        rejected: 1,
        pending: 2,
        processing: 3,
        completed: 4,
      };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },
}));

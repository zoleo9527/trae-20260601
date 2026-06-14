import { create } from 'zustand';
import { WorkOrder, OrderStatus, Priority, Exception, OperationLog } from '../types';
import { mockWorkOrders } from '../data/mockData';

interface WorkOrderFilters {
  status: OrderStatus | 'all';
  priority: Priority | 'all';
  dateRange: [Date, Date] | null;
  search: string;
}

interface WorkOrderStore {
  orders: WorkOrder[];
  selectedOrderId: string | null;
  filters: WorkOrderFilters;
  loadOrders: () => void;
  selectOrder: (id: string | null) => void;
  updateOrder: (id: string, updates: Partial<WorkOrder>) => void;
  addException: (orderId: string, exception: Exception) => void;
  addLog: (orderId: string, log: Omit<OperationLog, 'id'>) => void;
  setFilters: (filters: Partial<WorkOrderFilters>) => void;
  getFilteredOrders: () => WorkOrder[];
  getSelectedOrder: () => WorkOrder | undefined;
  getOrderById: (id: string) => WorkOrder | undefined;
}

export const useWorkOrderStore = create<WorkOrderStore>((set, get) => ({
  orders: [],
  selectedOrderId: null,
  filters: {
    status: 'all',
    priority: 'all',
    dateRange: null,
    search: '',
  },

  loadOrders: () => {
    set({ orders: mockWorkOrders });
  },

  selectOrder: (id) => {
    set({ selectedOrderId: id });
  },

  updateOrder: (id, updates) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? { ...order, ...updates, updatedAt: new Date() }
          : order
      ),
    }));
  },

  addException: (orderId, exception) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              exceptions: [...order.exceptions, exception],
              updatedAt: new Date(),
            }
          : order
      ),
    }));
  },

  addLog: (orderId, logData) => {
    const newLog: OperationLog = {
      ...logData,
      id: `LOG${Date.now()}`,
    };
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              logs: [...order.logs, newLog],
              updatedAt: new Date(),
            }
          : order
      ),
    }));
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  getFilteredOrders: () => {
    const { orders, filters } = get();
    return orders.filter((order) => {
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }
      if (filters.priority !== 'all' && order.priority !== filters.priority) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          order.orderNo.toLowerCase().includes(searchLower) ||
          order.vehicle.plateNo.toLowerCase().includes(searchLower) ||
          order.vehicle.model.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  },

  getSelectedOrder: () => {
    const { orders, selectedOrderId } = get();
    return orders.find((order) => order.id === selectedOrderId);
  },

  getOrderById: (id) => {
    const { orders } = get();
    return orders.find((order) => order.id === id);
  },
}));

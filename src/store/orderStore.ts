import { create } from 'zustand';
import type { Order, Measurement, FittingRecord, Adjustment, StatusType, ProductType } from '@/types';

interface OrderStore {
  orders: Order[];
  selectedOrder: Order | null;
  measurements: Measurement[];
  fittingRecords: FittingRecord[];
  adjustments: Adjustment[];
  statusFilter: StatusType;
  productFilter: ProductType;
  searchQuery: string;
  
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setMeasurements: (measurements: Measurement[]) => void;
  setFittingRecords: (records: FittingRecord[]) => void;
  setAdjustments: (adjustments: Adjustment[]) => void;
  setStatusFilter: (status: StatusType) => void;
  setProductFilter: (product: ProductType) => void;
  setSearchQuery: (query: string) => void;
  
  filteredOrders: () => Order[];
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  selectedOrder: null,
  measurements: [],
  fittingRecords: [],
  adjustments: [],
  statusFilter: 'all',
  productFilter: 'all',
  searchQuery: '',
  
  setOrders: (orders) => set({ orders }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setMeasurements: (measurements) => set({ measurements }),
  setFittingRecords: (records) => set({ fittingRecords: records }),
  setAdjustments: (adjustments) => set({ adjustments }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setProductFilter: (product) => set({ productFilter: product }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  filteredOrders: () => {
    const { orders, statusFilter, productFilter, searchQuery } = get();
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesProduct = productFilter === 'all' || order.productType === productFilter;
      const matchesSearch = 
        order.customerName.includes(searchQuery) || 
        order.id.includes(searchQuery);
      return matchesStatus && matchesProduct && matchesSearch;
    });
  },
}));

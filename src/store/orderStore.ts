import { create } from 'zustand';
import type { Order, Measurement, FittingRecord, Adjustment, FollowUpRecord, StatusType, ProductType, PickupStatusType } from '@/types';

interface OrderStore {
  orders: Order[];
  selectedOrder: Order | null;
  measurements: Measurement[];
  fittingRecords: FittingRecord[];
  adjustments: Adjustment[];
  followUpRecords: FollowUpRecord[];
  statusFilter: StatusType;
  productFilter: ProductType;
  pickupStatusFilter: PickupStatusType;
  searchQuery: string;
  
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setMeasurements: (measurements: Measurement[]) => void;
  setFittingRecords: (records: FittingRecord[]) => void;
  setAdjustments: (adjustments: Adjustment[]) => void;
  setFollowUpRecords: (records: FollowUpRecord[]) => void;
  setStatusFilter: (status: StatusType) => void;
  setProductFilter: (product: ProductType) => void;
  setPickupStatusFilter: (status: PickupStatusType) => void;
  setSearchQuery: (query: string) => void;
  
  filteredOrders: () => Order[];
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  selectedOrder: null,
  measurements: [],
  fittingRecords: [],
  adjustments: [],
  followUpRecords: [],
  statusFilter: 'all',
  productFilter: 'all',
  pickupStatusFilter: 'all',
  searchQuery: '',
  
  setOrders: (orders) => set({ orders }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setMeasurements: (measurements) => set({ measurements }),
  setFittingRecords: (records) => set({ fittingRecords: records }),
  setAdjustments: (adjustments) => set({ adjustments }),
  setFollowUpRecords: (records) => set({ followUpRecords: records }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setProductFilter: (product) => set({ productFilter: product }),
  setPickupStatusFilter: (status) => set({ pickupStatusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  filteredOrders: () => {
    const { orders, statusFilter, productFilter, pickupStatusFilter, searchQuery } = get();
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesProduct = productFilter === 'all' || order.productType === productFilter;
      const matchesPickupStatus = pickupStatusFilter === 'all' || order.pickupStatus === pickupStatusFilter;
      const matchesSearch = 
        order.customerName.includes(searchQuery) || 
        order.id.includes(searchQuery);
      return matchesStatus && matchesProduct && matchesPickupStatus && matchesSearch;
    });
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, Part, User, ModifyRecord, DeliveryRecord, InstalledPart } from '../types';
import { mockOrders, mockParts, mockUsers } from '../data/mockData';

interface Store {
  orders: Order[];
  parts: Part[];
  users: User[];
  currentUser: User | null;
  selectedOrderId: string | null;

  setCurrentUser: (user: User) => void;
  getOrderById: (id: string) => Order | undefined;
  addModifyRecord: (orderId: string, record: Omit<ModifyRecord, 'id' | 'created_at'>) => void;
  addDeliveryRecord: (orderId: string, record: Omit<DeliveryRecord, 'id' | 'created_at'>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updatePaidAmount: (orderId: string, amount: number) => void;
  addInstalledPart: (orderId: string, part: Omit<InstalledPart, 'id' | 'installed_at'>) => void;
  updateInstalledPart: (orderId: string, partId: string, updates: Partial<InstalledPart>) => void;
  removeInstalledPart: (orderId: string, partId: string) => void;
  updateInstallStatus: (orderId: string, status: Order['install_status']) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      parts: mockParts,
      users: mockUsers,
      currentUser: mockUsers[0],
      selectedOrderId: null,

      setCurrentUser: (user) => set({ currentUser: user }),

      getOrderById: (id) => {
        const { orders } = get();
        return orders.find((order) => order.id === id);
      },

      addModifyRecord: (orderId, record) => {
        const { orders } = get();
        const newRecord: ModifyRecord = {
          ...record,
          id: `mr${Date.now()}`,
          created_at: new Date().toLocaleString('zh-CN'),
        };

        const updatedOrders = orders.map((order) => {
          if (order.id === orderId) {
            const priceDiff = record.price_diff;
            return {
              ...order,
              total_price: order.total_price + priceDiff,
              modify_records: [...order.modify_records, newRecord],
            };
          }
          return order;
        });

        set({ orders: updatedOrders });
      },

      addDeliveryRecord: (orderId, record) => {
        const { orders } = get();
        const newRecord: DeliveryRecord = {
          ...record,
          id: `dr${Date.now()}`,
          created_at: new Date().toLocaleString('zh-CN'),
        };

        const updatedOrders = orders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              delivery_records: [...order.delivery_records, newRecord],
            };
          }
          return order;
        });

        set({ orders: updatedOrders });
      },

      updateOrderStatus: (orderId, status) => {
        const { orders } = get();
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        );
        set({ orders: updatedOrders });
      },

      updatePaidAmount: (orderId, amount) => {
        const { orders } = get();
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, paid_amount: amount } : order
        );
        set({ orders: updatedOrders });
      },

      addInstalledPart: (orderId, part) => {
        const { orders } = get();
        const newPart: InstalledPart = {
          ...part,
          id: `ip${Date.now()}`,
          installed_at: new Date().toLocaleString('zh-CN'),
        };

        const updatedOrders: Order[] = orders.map((order) => {
          if (order.id === orderId) {
            const newInstallStatus: Order['install_status'] = 
              order.installed_parts.length + 1 >= order.config_items.length ? 'completed' : 'in_progress';
            return {
              ...order,
              installed_parts: [...order.installed_parts, newPart],
              install_status: newInstallStatus,
            };
          }
          return order;
        });

        set({ orders: updatedOrders });
      },

      updateInstalledPart: (orderId, partId, updates) => {
        const { orders } = get();
        const updatedOrders = orders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              installed_parts: order.installed_parts.map((part) =>
                part.id === partId ? { ...part, ...updates } : part
              ),
            };
          }
          return order;
        });
        set({ orders: updatedOrders });
      },

      removeInstalledPart: (orderId, partId) => {
        const { orders } = get();
        const updatedOrders: Order[] = orders.map((order) => {
          if (order.id === orderId) {
            const updatedParts = order.installed_parts.filter((part) => part.id !== partId);
            const newInstallStatus: Order['install_status'] = 
              updatedParts.length === 0 ? 'not_started' : 'in_progress';
            return {
              ...order,
              installed_parts: updatedParts,
              install_status: newInstallStatus,
            };
          }
          return order;
        });
        set({ orders: updatedOrders });
      },

      updateInstallStatus: (orderId, status) => {
        const { orders } = get();
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, install_status: status } : order
        );
        set({ orders: updatedOrders });
      },
    }),
    {
      name: 'pc-build-store',
    }
  )
);

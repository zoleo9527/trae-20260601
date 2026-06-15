import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, Part, User, ModifyRecord, DeliveryRecord } from '../types';
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
    }),
    {
      name: 'pc-build-store',
    }
  )
);

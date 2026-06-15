import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus, UserRole, Note, PartItem, ChargeMethod } from '../types/order';
import { mockOrders } from '../data/mockData';
import { importFromExcelOrCSV } from '../utils/export';

interface OrderState {
  orders: Order[];
  currentRole: UserRole;
  currentUser: string;
  searchKeyword: string;
  statusFilter: OrderStatus | 'all';
}

interface OrderActions {
  setCurrentRole: (role: UserRole) => void;
  setCurrentUser: (user: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: OrderStatus | 'all') => void;
  getOrderById: (id: string) => Order | undefined;
  addNote: (orderId: string, content: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  assignEngineer: (orderId: string, engineer: string) => void;
  confirmCharge: (orderId: string, amount: number, method: ChargeMethod) => void;
  uploadReceipt: (orderId: string, imageBase64: string) => void;
  confirmReceipt: (orderId: string) => void;
  submitPartReturn: (orderId: string, hasReturn: boolean, reason: string) => void;
  confirmPartReturn: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'notes'>) => void;
  addPart: (orderId: string, part: PartItem) => void;
  importOrders: (orders: Order[]) => void;
  handleImportFile: (file: File) => Promise<number>;
  resetToMock: () => void;
}

const generateId = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `AS${dateStr}${random}`;
};

const formatDateTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

export const useOrderStore = create<OrderState & OrderActions>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      currentRole: '客服',
      currentUser: '王小丽',
      searchKeyword: '',
      statusFilter: 'all',

      setCurrentRole: (role) => {
        const userMap: Record<UserRole, string> = {
          '客服': '王小丽',
          '工程师': '李明',
          '配件管理员': '陈仓库',
        };
        set({ currentRole: role, currentUser: userMap[role] });
      },

      setCurrentUser: (user) => set({ currentUser: user }),
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setStatusFilter: (status) => set({ statusFilter: status }),

      getOrderById: (id) => {
        return get().orders.find((o) => o.id === id);
      },

      addNote: (orderId, content) => {
        const { currentRole, currentUser } = get();
        const note: Note = {
          id: `n${Date.now()}`,
          role: currentRole,
          author: currentUser,
          content,
          createdAt: formatDateTime(new Date()),
        };
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, notes: [...o.notes, note] } : o
          ),
        }));
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }));
      },

      assignEngineer: (orderId, engineer) => {
        const { addNote } = get();
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, assignedTo: engineer, status: 'pending_work' as OrderStatus }
              : o
          ),
        }));
        addNote(orderId, `已分配工程师：${engineer}`);
      },

      confirmCharge: (orderId, amount, method) => {
        const { currentUser, addNote, updateOrderStatus } = get();
        const now = formatDateTime(new Date());
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  charge: {
                    ...o.charge,
                    amount,
                    method,
                    paidAt: now,
                    confirmedBy: currentUser,
                    confirmedAt: now,
                  },
                }
              : o
          ),
        }));
        addNote(orderId, `收费确认：${amount}元，收款方式：${method}`);
        updateOrderStatus(orderId, 'pending_receipt');
      },

      uploadReceipt: (orderId, imageBase64) => {
        const { addNote } = get();
        const now = formatDateTime(new Date());
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  receipt: {
                    ...o.receipt,
                    images: [...o.receipt.images, imageBase64],
                    uploadedAt: now,
                  },
                }
              : o
          ),
        }));
        addNote(orderId, '已上传电子回单');
      },

      confirmReceipt: (orderId) => {
        const { currentUser, addNote, updateOrderStatus } = get();
        const now = formatDateTime(new Date());
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  receipt: {
                    ...o.receipt,
                    confirmedBy: currentUser,
                    confirmedAt: now,
                  },
                }
              : o
          ),
        }));
        addNote(orderId, '电子回单已确认');
        updateOrderStatus(orderId, 'pending_return');
      },

      submitPartReturn: (orderId, hasReturn, reason) => {
        const { currentUser, addNote } = get();
        const now = formatDateTime(new Date());
        if (hasReturn) {
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    partReturn: {
                      ...o.partReturn,
                      hasReturn: true,
                      reason,
                      status: 'submitted' as const,
                      submittedBy: currentUser,
                      submittedAt: now,
                    },
                  }
                : o
            ),
          }));
          addNote(orderId, `工程师提交配件退回申请，原因：${reason}`);
        } else {
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    partReturn: {
                      ...o.partReturn,
                      hasReturn: false,
                      reason: '',
                      status: 'confirmed' as const,
                      submittedBy: currentUser,
                      submittedAt: now,
                      confirmedBy: currentUser,
                      confirmedAt: now,
                    },
                  }
                : o
            ),
          }));
          addNote(orderId, '工程师确认无配件退回，直接进入客服审核');
          get().updateOrderStatus(orderId, 'pending_review');
        }
      },

      confirmPartReturn: (orderId) => {
        const { currentUser, addNote, updateOrderStatus } = get();
        const now = formatDateTime(new Date());
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  partReturn: {
                    ...o.partReturn,
                    status: 'confirmed' as const,
                    confirmedBy: currentUser,
                    confirmedAt: now,
                    returnedAt: now,
                  },
                }
              : o
          ),
        }));
        addNote(orderId, `配件管理员已确认配件退回`);
        updateOrderStatus(orderId, 'pending_review');
      },

      completeOrder: (orderId) => {
        const { addNote } = get();
        const now = formatDateTime(new Date());
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'completed', closedAt: now } : o
          ),
        }));
        addNote(orderId, '工单已结案');
      },

      addOrder: (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: generateId(),
          createdAt: formatDateTime(new Date()),
          notes: [],
        };
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));
      },

      addPart: (orderId, part) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, parts: [...o.parts, part] } : o
          ),
        }));
      },

      importOrders: (orders) => {
        set({ orders });
      },

      handleImportFile: async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          const data = await importFromExcelOrCSV(file);
          const { orders } = get();
          set({ orders: [...data, ...orders] });
          return data.length;
        } else if (ext === 'json') {
          const text = await file.text();
          const data = JSON.parse(text) as Order[];
          const { orders } = get();
          set({ orders: [...data, ...orders] });
          return data.length;
        } else {
          throw new Error('不支持的文件格式，请使用 Excel(.xlsx/.xls)、CSV 或 JSON 文件');
        }
      },

      resetToMock: () => {
        set({ orders: mockOrders });
      },
    }),
    {
      name: 'appliance-repair-orders',
    }
  )
);

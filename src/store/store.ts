import { create } from 'zustand';
import type { User, SoupBase, SoldOutItem, Order, AuditLog, TodoItem, Role } from '@/types';
import { soupBaseApi, soldOutApi, orderApi, auditLogApi, todoApi } from '@/services/api';

interface AppState {
  currentUser: User | null;
  soupBases: SoupBase[];
  soldOutItems: SoldOutItem[];
  orders: Order[];
  auditLogs: AuditLog[];
  todos: TodoItem[];
  selectedRole: Role;
  loading: boolean;

  setCurrentUser: (user: User | null) => void;
  setSelectedRole: (role: Role) => void;
  loadData: () => Promise<void>;

  fetchSoupBases: () => Promise<void>;
  fetchSoldOutItems: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchTodos: () => Promise<void>;

  updateSoupBase: (id: string, data: Partial<Omit<SoupBase, 'id' | 'createdAt'>>) => Promise<void>;
  prepareSoupBase: (id: string) => Promise<void>;
  completePrepareSoupBase: (id: string, quantity: number) => Promise<void>;

  createSoldOut: (data: Omit<SoldOutItem, 'id' | 'status' | 'history' | 'reportedAt'>) => Promise<void>;
  confirmSoldOut: (id: string) => Promise<void>;
  resolveSoldOut: (id: string, notes?: string) => Promise<void>;

  verifyGroupBuy: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;

  completeTodo: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  soupBases: [],
  soldOutItems: [],
  orders: [],
  auditLogs: [],
  todos: [],
  selectedRole: '前厅经理',
  loading: false,

  setCurrentUser: (user) => set({ currentUser: user }),
  setSelectedRole: (role) => set({ selectedRole: role }),

  loadData: async () => {
    set({ loading: true });
    await Promise.all([
      get().fetchSoupBases(),
      get().fetchSoldOutItems(),
      get().fetchOrders(),
      get().fetchAuditLogs(),
      get().fetchTodos(),
    ]);
    set({ loading: false });
  },

  fetchSoupBases: async () => {
    const data = await soupBaseApi.getAll();
    set({ soupBases: data });
  },

  fetchSoldOutItems: async () => {
    const data = await soldOutApi.getAll();
    set({ soldOutItems: data });
  },

  fetchOrders: async () => {
    const data = await orderApi.getAll();
    set({ orders: data });
  },

  fetchAuditLogs: async () => {
    const data = await auditLogApi.getAll();
    set({ auditLogs: data });
  },

  fetchTodos: async () => {
    const data = await todoApi.getAll();
    set({ todos: data });
  },

  updateSoupBase: async (id, data) => {
    await soupBaseApi.update(id, data);
    await get().fetchSoupBases();
  },

  prepareSoupBase: async (id) => {
    await soupBaseApi.prepare(id);
    await get().fetchSoupBases();
  },

  completePrepareSoupBase: async (id, quantity) => {
    await soupBaseApi.completePrepare(id, quantity);
    await get().fetchSoupBases();
    await get().fetchTodos();
  },

  createSoldOut: async (data) => {
    await soldOutApi.create(data);
    await get().fetchSoldOutItems();
    await get().fetchTodos();
  },

  confirmSoldOut: async (id) => {
    const { currentUser } = get();
    if (!currentUser) return;
    await soldOutApi.confirm(id, currentUser.name, currentUser.role);
    await get().fetchSoldOutItems();
    await get().fetchTodos();
  },

  resolveSoldOut: async (id, notes) => {
    const { currentUser } = get();
    if (!currentUser) return;
    await soldOutApi.resolve(id, currentUser.name, notes);
    await get().fetchSoldOutItems();
  },

  verifyGroupBuy: async (id) => {
    await orderApi.verifyGroupBuy(id);
    await get().fetchOrders();
    await get().fetchTodos();
  },

  updateOrderStatus: async (id, status) => {
    await orderApi.updateStatus(id, status);
    await get().fetchOrders();
  },

  completeTodo: async (id) => {
    await todoApi.complete(id);
    await get().fetchTodos();
  },
}));

export const useCurrentUser = () => useStore((state) => state.currentUser);
export const useSelectedRole = () => useStore((state) => state.selectedRole);
export const useSoupBases = () => useStore((state) => state.soupBases);
export const useSoldOutItems = () => useStore((state) => state.soldOutItems);
export const useOrders = () => useStore((state) => state.orders);
export const useAuditLogs = () => useStore((state) => state.auditLogs);
export const useTodos = () => useStore((state) => state.todos);
export const useLoading = () => useStore((state) => state.loading);

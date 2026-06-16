import { create } from 'zustand';
import type { User, SoupBase, SoldOut, Order, AuditLog, TodoItem, Role } from '../types';
import { userApi, soupBaseApi, soldOutApi, orderApi, auditLogApi, todoItemApi, getCurrentUser, setCurrentUser } from '../services/api';

interface Store {
  users: User[];
  soupBases: SoupBase[];
  soldOuts: SoldOut[];
  orders: Order[];
  auditLogs: AuditLog[];
  todoItems: TodoItem[];
  currentUser: { name: string; role: Role };
  loading: boolean;

  fetchUsers: () => Promise<void>;
  fetchSoupBases: () => Promise<void>;
  fetchSoldOuts: (status?: string) => Promise<void>;
  fetchOrders: (status?: string, isGroupBuy?: boolean) => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchTodoItems: (role?: string) => Promise<void>;

  startPrepareSoupBase: (id: string) => Promise<void>;
  completePrepareSoupBase: (id: string, additionalStock?: number) => Promise<void>;
  updateSoupBase: (id: string, data: Partial<SoupBase>) => Promise<void>;

  reportSoldOut: (data: Omit<SoldOut, 'id' | 'status' | 'reportedAt' | 'resolvedAt' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  confirmSoldOut: (id: string) => Promise<void>;
  resolveSoldOut: (id: string) => Promise<void>;
  updateSoldOut: (id: string, data: Partial<Pick<SoldOut, 'notes' | 'refundReason' | 'supplementNotes'>>) => Promise<void>;

  createOrder: (data: Omit<Order, 'id' | 'status' | 'paidAmount' | 'groupBuyVerified' | 'createdAt' | 'updatedAt' | 'servedAt' | 'completedAt'>) => Promise<void>;
  verifyGroupBuy: (id: string) => Promise<void>;
  confirmOrder: (id: string) => Promise<void>;
  serveOrder: (id: string) => Promise<void>;
  completeOrder: (id: string) => Promise<void>;

  completeTodo: (id: string) => Promise<void>;

  switchRole: (role: Role) => void;
  setCurrentUser: (user: { name: string; role: Role }) => void;
}

export const useStore = create<Store>((set, get) => ({
  users: [],
  soupBases: [],
  soldOuts: [],
  orders: [],
  auditLogs: [],
  todoItems: [],
  currentUser: getCurrentUser(),
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    const users = await userApi.getAll();
    set({ users, loading: false });
  },

  fetchSoupBases: async () => {
    set({ loading: true });
    const soupBases = await soupBaseApi.getAll();
    set({ soupBases, loading: false });
  },

  fetchSoldOuts: async (status) => {
    set({ loading: true });
    const soldOuts = await soldOutApi.getAll(status);
    set({ soldOuts, loading: false });
  },

  fetchOrders: async (status, isGroupBuy) => {
    set({ loading: true });
    const orders = await orderApi.getAll(status, isGroupBuy);
    set({ orders, loading: false });
  },

  fetchAuditLogs: async () => {
    set({ loading: true });
    const logs = await auditLogApi.getAll();
    set({ auditLogs: logs, loading: false });
  },

  fetchTodoItems: async (role) => {
    set({ loading: true });
    const todos = await todoItemApi.getAll(role);
    set({ todoItems: todos, loading: false });
  },

  startPrepareSoupBase: async (id) => {
    await soupBaseApi.prepare(id);
    await get().fetchSoupBases();
    await get().fetchTodoItems(get().currentUser.role);
  },

  completePrepareSoupBase: async (id, additionalStock) => {
    await soupBaseApi.complete(id, additionalStock);
    await get().fetchSoupBases();
    await get().fetchSoldOuts();
    await get().fetchTodoItems(get().currentUser.role);
    await get().fetchAuditLogs();
  },

  updateSoupBase: async (id, data) => {
    await soupBaseApi.update(id, data);
    await get().fetchSoupBases();
  },

  reportSoldOut: async (data) => {
    await soldOutApi.create(data);
    await get().fetchSoldOuts();
    await get().fetchTodoItems(get().currentUser.role);
    await get().fetchAuditLogs();
  },

  confirmSoldOut: async (id) => {
    await soldOutApi.confirm(id);
    await get().fetchSoldOuts();
    await get().fetchAuditLogs();
  },

  resolveSoldOut: async (id) => {
    await soldOutApi.resolve(id);
    await get().fetchSoldOuts();
    await get().fetchSoupBases();
    await get().fetchTodoItems(get().currentUser.role);
    await get().fetchAuditLogs();
  },

  updateSoldOut: async (id, data) => {
    await soldOutApi.update(id, data);
    await get().fetchSoldOuts();
  },

  createOrder: async (data) => {
    await orderApi.create(data);
    await get().fetchOrders();
    await get().fetchTodoItems(get().currentUser.role);
    await get().fetchAuditLogs();
  },

  verifyGroupBuy: async (id) => {
    await orderApi.verify(id);
    await get().fetchOrders();
    await get().fetchTodoItems(get().currentUser.role);
    await get().fetchAuditLogs();
  },

  confirmOrder: async (id) => {
    await orderApi.confirm(id);
    await get().fetchOrders();
    await get().fetchAuditLogs();
  },

  serveOrder: async (id) => {
    await orderApi.serve(id);
    await get().fetchOrders();
    await get().fetchAuditLogs();
  },

  completeOrder: async (id) => {
    await orderApi.complete(id);
    await get().fetchOrders();
    await get().fetchSoupBases();
    await get().fetchAuditLogs();
  },

  completeTodo: async (id) => {
    await todoItemApi.complete(id);
    await get().fetchTodoItems(get().currentUser.role);
  },

  switchRole: (role) => {
    const users = get().users;
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser({ name: user.name, role: user.role });
      set({ currentUser: { name: user.name, role: user.role } });
      get().fetchTodoItems(role);
    }
  },

  setCurrentUser: (user) => {
    setCurrentUser(user);
    set({ currentUser: user });
    get().fetchTodoItems(user.role);
  },
}));

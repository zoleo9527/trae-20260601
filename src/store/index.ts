import { create } from 'zustand';
import type { Order, Addon, Damage, Expense, OperationLog, Exception, User, UserRole } from '../types';
import localforage from 'localforage';

interface AppState {
  user: User | null;
  orders: Order[];
  currentOrder: Order | null;
  addons: Addon[];
  damages: Damage[];
  expenses: Expense | null;
  logs: OperationLog[];
  exceptions: Exception[];
  isOnline: boolean;
  lastSyncTime: string;
  searchTerm: string;
  filterStatus: string;
  notificationMessages: string[];

  setUser: (user: User) => void;
  login: (role: UserRole) => void;
  logout: () => void;
  loadOrders: () => Promise<void>;
  loadOrderDetails: (orderId: string) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  assignVehicle: (orderId: string, vehicleId: string, driverName: string) => Promise<void>;
  addAddon: (orderId: string, addonData: Omit<Addon, 'id' | 'orderId' | 'createdAt'>) => Promise<void>;
  addDamage: (orderId: string, damageData: Omit<Damage, 'id' | 'orderId' | 'createdAt'>) => Promise<void>;
  updateExpenses: (orderId: string, expenseData: Omit<Expense, 'id' | 'orderId'>) => Promise<void>;
  recalculateExpenses: (orderId: string) => Promise<void>;
  addLog: (orderId: string, action: string, operator: string, details?: string) => Promise<void>;
  reportException: (exceptionData: Omit<Exception, 'id' | 'createdAt' | 'resolved' | 'resolvedAt'>) => Promise<void>;
  resolveException: (exceptionId: string) => Promise<void>;
  loadExceptions: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: string) => void;
  addNotification: (message: string) => void;
  removeNotification: (index: number) => void;
  checkOnlineStatus: () => void;
  syncLocalData: () => Promise<void>;
  loadFromLocalStorage: () => Promise<void>;
}

const API_BASE = 'http://localhost:3001/api';

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  orders: [],
  currentOrder: null,
  addons: [],
  damages: [],
  expenses: null,
  logs: [],
  exceptions: [],
  isOnline: navigator.onLine,
  lastSyncTime: '',
  searchTerm: '',
  filterStatus: '',
  notificationMessages: [],

  setUser: (user) => {
    set({ user });
    localforage.setItem('user', user);
  },

  login: (role: UserRole) => {
    const userNames: Record<UserRole, string> = {
      dispatcher: '调度员小王',
      teamLead: '搬运组长老李',
      customerService: '客服小张',
    };
    const user: User = {
      id: role,
      name: userNames[role],
      role,
    };
    get().setUser(user);
    get().loadOrders();
    get().loadExceptions();
  },

  logout: () => {
    set({ user: null, orders: [], currentOrder: null });
    localforage.removeItem('user');
  },

  async loadOrders() {
    try {
      const response = await fetch(`${API_BASE}/orders`);
      if (response.ok) {
        const orders = await response.json();
        set({ orders });
        localforage.setItem('orders', orders);
        set({ lastSyncTime: new Date().toISOString() });
      }
    } catch {
      const storedOrders = await localforage.getItem<Order[]>('orders');
      if (storedOrders) {
        set({ orders: storedOrders });
      }
    }
  },

  async loadOrderDetails(orderId: string) {
    try {
      const [orderRes, addonsRes, damagesRes, expensesRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/orders/${orderId}`),
        fetch(`${API_BASE}/orders/${orderId}/addons`),
        fetch(`${API_BASE}/orders/${orderId}/damages`),
        fetch(`${API_BASE}/orders/${orderId}/expenses`),
        fetch(`${API_BASE}/orders/${orderId}/logs`),
      ]);

      if (orderRes.ok) {
        const currentOrder = await orderRes.json();
        set({ currentOrder });
        localforage.setItem(`order_${orderId}`, currentOrder);
      }
      if (addonsRes.ok) {
        const addons = await addonsRes.json();
        set({ addons });
        localforage.setItem(`addons_${orderId}`, addons);
      }
      if (damagesRes.ok) {
        const damages = await damagesRes.json();
        set({ damages });
        localforage.setItem(`damages_${orderId}`, damages);
      }
      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        set({ expenses: expenses || null });
        localforage.setItem(`expenses_${orderId}`, expenses);
      }
      if (logsRes.ok) {
        const logs = await logsRes.json();
        set({ logs });
        localforage.setItem(`logs_${orderId}`, logs);
      }
    } catch {
      const [currentOrder, addons, damages, expenses, logs] = await Promise.all([
        localforage.getItem<Order>(`order_${orderId}`),
        localforage.getItem<Addon[]>(`addons_${orderId}`),
        localforage.getItem<Damage[]>(`damages_${orderId}`),
        localforage.getItem<Expense>(`expenses_${orderId}`),
        localforage.getItem<OperationLog[]>(`logs_${orderId}`),
      ]);
      set({
        currentOrder: currentOrder || null,
        addons: addons || [],
        damages: damages || [],
        expenses: expenses || null,
        logs: logs || [],
      });
    }
  },

  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (response.ok) {
        const order = await response.json();
        set((state) => ({ orders: [order, ...state.orders] }));
        get().addLog(order.id, '创建订单', get().user?.name || '系统', '订单已创建');
      }
    } catch {
      const order: Order = {
        ...orderData,
        id: `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({ orders: [order, ...state.orders] }));
      await localforage.setItem('orders', get().orders);
      await localforage.setItem(`pending_create_${order.id}`, order);
      get().addNotification('订单已保存，将在联网后同步');
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o)),
        currentOrder: state.currentOrder?.id === orderId ? { ...state.currentOrder, status, updatedAt: new Date().toISOString() } : state.currentOrder,
      }));
      get().addLog(orderId, '更新状态', get().user?.name || '系统', `状态变更为: ${status}`);
    } catch {
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o)),
        currentOrder: state.currentOrder?.id === orderId ? { ...state.currentOrder, status, updatedAt: new Date().toISOString() } : state.currentOrder,
      }));
      await localforage.setItem('orders', get().orders);
      await localforage.setItem(`pending_update_${orderId}`, { orderId, status });
      get().addNotification('状态已更新，将在联网后同步');
    }
  },

  async assignVehicle(orderId, vehicleId, driverName) {
    try {
      await fetch(`${API_BASE}/orders/${orderId}/vehicle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, driverName }),
      });
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? { ...o, vehicleId, driverName, status: 'transporting', updatedAt: new Date().toISOString() } : o)),
        currentOrder: state.currentOrder?.id === orderId ? { ...state.currentOrder, vehicleId, driverName, status: 'transporting', updatedAt: new Date().toISOString() } : state.currentOrder,
      }));
      get().addLog(orderId, '分配车辆', get().user?.name || '系统', `车辆: ${vehicleId}, 司机: ${driverName}`);
    } catch {
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? { ...o, vehicleId, driverName, status: 'transporting', updatedAt: new Date().toISOString() } : o)),
        currentOrder: state.currentOrder?.id === orderId ? { ...state.currentOrder, vehicleId, driverName, status: 'transporting', updatedAt: new Date().toISOString() } : state.currentOrder,
      }));
      await localforage.setItem('orders', get().orders);
      await localforage.setItem(`pending_assign_${orderId}`, { orderId, vehicleId, driverName });
      get().addNotification('车辆已分配，将在联网后同步');
    }
  },

  async addAddon(orderId, addonData) {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addonData),
      });
      if (response.ok) {
        const addon = await response.json();
        set((state) => ({ addons: [addon, ...state.addons] }));
        get().addLog(orderId, '添加加项', get().user?.name || '系统', `加项: ${addon.type}`);
        get().recalculateExpenses(orderId);
      }
    } catch {
      const addon: Addon = {
        ...addonData,
        id: `local_${Date.now()}`,
        orderId,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ addons: [addon, ...state.addons] }));
      await localforage.setItem(`addons_${orderId}`, get().addons);
      await localforage.setItem(`pending_addon_${addon.id}`, addon);
      get().addNotification('加项已保存，将在联网后同步');
    }
  },

  async addDamage(orderId, damageData) {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/damages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(damageData),
      });
      if (response.ok) {
        const damage = await response.json();
        set((state) => ({ damages: [damage, ...state.damages] }));
        get().addLog(orderId, '申报物损', get().user?.name || '系统', `物损: ${damage.description}`);
        get().reportException({ orderId, type: 'damage', message: damage.description, severity: 'error' });
        get().recalculateExpenses(orderId);
      }
    } catch {
      const damage: Damage = {
        ...damageData,
        id: `local_${Date.now()}`,
        orderId,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ damages: [damage, ...state.damages] }));
      await localforage.setItem(`damages_${orderId}`, get().damages);
      await localforage.setItem(`pending_damage_${damage.id}`, damage);
      get().addNotification('物损已保存，将在联网后同步');
    }
  },

  async recalculateExpenses(orderId) {
    const { currentOrder, addons, damages } = get();
    if (!currentOrder) return;

    const baseFee = currentOrder.baseFee;
    const addonFee = addons.reduce((sum, a) => sum + a.unitPrice * a.quantity, 0);
    const damageFee = damages.reduce((sum, d) => sum + d.value, 0);
    const totalFee = baseFee + addonFee - damageFee;

    await get().updateExpenses(orderId, {
      baseFee,
      addonFee,
      damageFee,
      totalFee,
      status: 'pending',
    });
  },

  async updateExpenses(orderId, expenseData) {
    try {
      await fetch(`${API_BASE}/orders/${orderId}/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      set({ expenses: { ...expenseData, orderId, id: `exp_${orderId}` } as Expense });
      await localforage.setItem(`expenses_${orderId}`, get().expenses);
    } catch {
      set({ expenses: { ...expenseData, orderId, id: `exp_${orderId}` } as Expense });
      await localforage.setItem(`expenses_${orderId}`, get().expenses);
      await localforage.setItem(`pending_expense_${orderId}`, expenseData);
    }
  },

  async addLog(orderId, action, operator, details) {
    try {
      await fetch(`${API_BASE}/orders/${orderId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, operator, details }),
      });
      const log: OperationLog = {
        id: `log_${Date.now()}`,
        orderId,
        action,
        operator,
        timestamp: new Date().toISOString(),
        details,
      };
      set((state) => ({ logs: [log, ...state.logs] }));
      await localforage.setItem(`logs_${orderId}`, get().logs);
    } catch {
      const log: OperationLog = {
        id: `log_${Date.now()}`,
        orderId,
        action,
        operator,
        timestamp: new Date().toISOString(),
        details,
      };
      set((state) => ({ logs: [log, ...state.logs] }));
      await localforage.setItem(`logs_${orderId}`, get().logs);
    }
  },

  async reportException(exceptionData) {
    try {
      await fetch(`${API_BASE}/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exceptionData),
      });
      const exception: Exception = {
        ...exceptionData,
        id: `exc_${Date.now()}`,
        createdAt: new Date().toISOString(),
        resolved: false,
      };
      set((state) => ({ exceptions: [exception, ...state.exceptions] }));
      get().addNotification(`异常已上报: ${exception.message}`);
    } catch {
      const exception: Exception = {
        ...exceptionData,
        id: `exc_${Date.now()}`,
        createdAt: new Date().toISOString(),
        resolved: false,
      };
      set((state) => ({ exceptions: [exception, ...state.exceptions] }));
      await localforage.setItem('exceptions', get().exceptions);
      await localforage.setItem(`pending_exception_${exception.id}`, exception);
      get().addNotification('异常已保存，将在联网后同步');
    }
  },

  async resolveException(exceptionId) {
    try {
      await fetch(`${API_BASE}/exceptions/${exceptionId}/resolve`, {
        method: 'PUT',
      });
      set((state) => ({
        exceptions: state.exceptions.map((e) => (e.id === exceptionId ? { ...e, resolved: true, resolvedAt: new Date().toISOString() } : e)),
      }));
    } catch {
      set((state) => ({
        exceptions: state.exceptions.map((e) => (e.id === exceptionId ? { ...e, resolved: true, resolvedAt: new Date().toISOString() } : e)),
      }));
      await localforage.setItem('exceptions', get().exceptions);
      await localforage.setItem(`pending_resolve_${exceptionId}`, true);
      get().addNotification('异常已标记为已处理');
    }
  },

  async loadExceptions() {
    try {
      const response = await fetch(`${API_BASE}/exceptions`);
      if (response.ok) {
        const exceptions = await response.json();
        set({ exceptions });
        localforage.setItem('exceptions', exceptions);
      }
    } catch {
      const storedExceptions = await localforage.getItem<Exception[]>('exceptions');
      if (storedExceptions) {
        set({ exceptions: storedExceptions });
      }
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  addNotification: (message) => {
    set((state) => ({ notificationMessages: [...state.notificationMessages, message] }));
    setTimeout(() => {
      set((state) => ({ notificationMessages: state.notificationMessages.slice(1) }));
    }, 5000);
  },

  removeNotification: (index) => {
    set((state) => ({
      notificationMessages: state.notificationMessages.filter((_, i) => i !== index),
    }));
  },

  checkOnlineStatus: () => {
    const isOnline = navigator.onLine;
    set({ isOnline });
    if (isOnline) {
      get().syncLocalData();
    }
  },

  async syncLocalData() {
    const keys = await localforage.keys();
    const pendingKeys = keys.filter((k) => k.startsWith('pending_'));

    for (const key of pendingKeys) {
      try {
        const data = await localforage.getItem(key);
        if (key.startsWith('pending_create_')) {
          const order = data as Order;
          await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          });
        } else if (key.startsWith('pending_update_')) {
          const { orderId, status } = data as { orderId: string; status: Order['status'] };
          await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
        } else if (key.startsWith('pending_addon_')) {
          const addon = data as Addon;
          await fetch(`${API_BASE}/orders/${addon.orderId}/addons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addon),
          });
        }
        await localforage.removeItem(key);
      } catch {
        continue;
      }
    }

    await get().loadOrders();
    await get().loadExceptions();
    get().addNotification('数据已同步');
  },

  async loadFromLocalStorage() {
    const user = await localforage.getItem<User>('user');
    if (user) {
      set({ user });
      await get().loadOrders();
      await get().loadExceptions();
    }
  },
}));

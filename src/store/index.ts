import { create } from 'zustand';
import type { Order, Addon, Damage, Expense, OperationLog, Exception, User, UserRole } from '../types';
import localforage from 'localforage';

interface PendingAction {
  id: string;
  type: 'create_order' | 'update_status' | 'assign_vehicle' | 'add_addon' | 'add_damage' | 'update_expenses' | 'confirm_expenses' | 'reject_expenses' | 'report_exception' | 'resolve_exception';
  data: unknown;
  timestamp: string;
  orderId?: string;
}

interface AppState {
  user: User | null;
  orders: Order[];
  currentOrder: Order | null;
  addons: Addon[];
  damages: Damage[];
  expenses: Expense | null;
  logs: OperationLog[];
  allLogs: OperationLog[];
  exceptions: Exception[];
  isOnline: boolean;
  lastSyncTime: string;
  searchTerm: string;
  filterStatus: string;
  notificationMessages: string[];
  recentOrders: Order[];
  pendingActions: PendingAction[];

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
  confirmExpenses: (orderId: string) => Promise<void>;
  rejectExpenses: (orderId: string, reason: string) => Promise<void>;
  recalculateExpenses: (orderId: string) => Promise<void>;
  addLog: (orderId: string, action: string, operator: string, details?: string) => Promise<void>;
  reportException: (exceptionData: Omit<Exception, 'id' | 'createdAt' | 'resolved' | 'resolvedAt'>) => Promise<void>;
  resolveException: (exceptionId: string) => Promise<void>;
  loadExceptions: () => Promise<void>;
  loadAllLogs: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: string) => void;
  addNotification: (message: string) => void;
  removeNotification: (index: number) => void;
  checkOnlineStatus: () => void;
  syncLocalData: () => Promise<void>;
  loadFromLocalStorage: () => Promise<void>;
  getTodosByRole: () => Order[];
  addToRecentOrders: (order: Order) => void;
  loadRecentOrders: () => Promise<void>;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp'>) => void;
  removePendingAction: (actionId: string) => void;
  savePendingActions: () => Promise<void>;
  loadPendingActions: () => Promise<void>;
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
  allLogs: [],
  exceptions: [],
  isOnline: navigator.onLine,
  lastSyncTime: '',
  searchTerm: '',
  filterStatus: '',
  notificationMessages: [],
  recentOrders: [],
  pendingActions: [],

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
    const order: Order = {
      ...orderData,
      id: `local_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (response.ok) {
        const savedOrder = await response.json();
        set((state) => ({ orders: [savedOrder, ...state.orders.map((o) => (o.id === order.id ? savedOrder : o))] }));
        get().addLog(savedOrder.id, '创建订单', get().user?.name || '系统', '订单已创建');
      }
    } catch {
      set((state) => ({ orders: [order, ...state.orders] }));
      await localforage.setItem('orders', get().orders);
      get().addPendingAction({
        type: 'create_order',
        data: order,
        orderId: order.id,
      });
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
      if (get().currentOrder?.id === orderId) {
        await localforage.setItem(`order_${orderId}`, get().currentOrder);
      }
      get().addPendingAction({
        type: 'update_status',
        data: { orderId, status },
        orderId,
      });
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
      get().addPendingAction({
        type: 'assign_vehicle',
        data: { orderId, vehicleId, driverName },
        orderId,
      });
      get().addNotification('车辆已分配，将在联网后同步');
    }
  },

  async addAddon(orderId, addonData) {
    const addon: Addon = {
      ...addonData,
      id: `local_${Date.now()}`,
      orderId,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addonData),
      });
      if (response.ok) {
        const savedAddon = await response.json();
        set((state) => ({ addons: [savedAddon, ...state.addons.map((a) => (a.id === addon.id ? savedAddon : a))] }));
        await get().addLog(orderId, '现场加项', get().user?.name || '系统', `加项: ${savedAddon.type} x${savedAddon.quantity}，单价: ¥${savedAddon.unitPrice.toFixed(2)}，小计: ¥${(savedAddon.unitPrice * savedAddon.quantity).toFixed(2)}`);
        await get().recalculateExpenses(orderId);
      }
    } catch {
      set((state) => ({ addons: [addon, ...state.addons] }));
      await localforage.setItem(`addons_${orderId}`, get().addons);
      await get().addLog(orderId, '现场加项', get().user?.name || '系统', `加项: ${addon.type} x${addon.quantity}，单价: ¥${addon.unitPrice.toFixed(2)}，小计: ¥${(addon.unitPrice * addon.quantity).toFixed(2)}（待同步）`);
      await get().recalculateExpenses(orderId);
      get().addPendingAction({
        type: 'add_addon',
        data: addon,
        orderId,
      });
      get().addNotification('加项已保存，将在联网后同步');
    }
  },

  async addDamage(orderId, damageData) {
    const damage: Damage = {
      ...damageData,
      id: `local_${Date.now()}`,
      orderId,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/damages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(damageData),
      });
      if (response.ok) {
        const savedDamage = await response.json();
        set((state) => ({ damages: [savedDamage, ...state.damages.map((d) => (d.id === damage.id ? savedDamage : d))] }));
        await get().addLog(orderId, '申报物损', get().user?.name || '系统', `物品: ${savedDamage.description}，价值: ¥${savedDamage.value.toFixed(2)}，责任认定: ${savedDamage.responsibility}`);
        await get().reportException({ orderId, type: 'damage', message: `物品破损: ${savedDamage.description}，金额: ¥${savedDamage.value.toFixed(2)}`, severity: 'error' });
        await get().recalculateExpenses(orderId);
      }
    } catch {
      set((state) => ({ damages: [damage, ...state.damages] }));
      await localforage.setItem(`damages_${orderId}`, get().damages);
      await get().addLog(orderId, '申报物损', get().user?.name || '系统', `物品: ${damage.description}，价值: ¥${damage.value.toFixed(2)}，责任认定: ${damage.responsibility}（待同步）`);
      await get().reportException({ orderId, type: 'damage', message: `物品破损: ${damage.description}，金额: ¥${damage.value.toFixed(2)}`, severity: 'error' });
      await get().recalculateExpenses(orderId);
      get().addPendingAction({
        type: 'add_damage',
        data: damage,
        orderId,
      });
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
    const { expenses } = get();
    const newExpenses = { ...expenseData, orderId, id: expenses?.id || `exp_${orderId}` } as Expense;
    
    try {
      await fetch(`${API_BASE}/orders/${orderId}/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      set({ expenses: newExpenses });
      await localforage.setItem(`expenses_${orderId}`, newExpenses);
    } catch {
      set({ expenses: newExpenses });
      await localforage.setItem(`expenses_${orderId}`, newExpenses);
      get().addPendingAction({
        type: 'update_expenses',
        data: { orderId, expenseData },
        orderId,
      });
    }
  },

  async confirmExpenses(orderId) {
    const expenseData = {
      status: 'confirmed' as const,
      confirmedAt: new Date().toISOString(),
    };
    
    try {
      await fetch(`${API_BASE}/orders/${orderId}/expenses/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const { expenses } = get();
      const newExpenses = expenses ? { ...expenses, ...expenseData } : null;
      set({ expenses: newExpenses });
      await localforage.setItem(`expenses_${orderId}`, newExpenses);
      await get().updateOrderStatus(orderId, 'completed');
      await get().addLog(orderId, '费用审核通过', get().user?.name || '系统', `审核结果：通过，最终金额 ¥${newExpenses?.totalFee?.toFixed(2)}`);
      get().addNotification('费用审核通过');
    } catch {
      const { expenses } = get();
      const newExpenses = expenses ? { ...expenses, ...expenseData } : null;
      set({ expenses: newExpenses });
      await localforage.setItem(`expenses_${orderId}`, newExpenses);
      await localforage.setItem(`pending_expense_confirm_${orderId}`, { orderId, ...expenseData });
      await get().addLog(orderId, '费用审核通过', get().user?.name || '系统', `审核结果：通过，最终金额 ¥${newExpenses?.totalFee?.toFixed(2)}（待同步）`);
      get().addPendingAction({
        type: 'confirm_expenses',
        data: { orderId, expenseData },
        orderId,
      });
      get().addNotification('费用审核通过，将在联网后同步');
    }
  },

  async rejectExpenses(orderId, reason) {
    const expenseData = {
      status: 'rejected' as const,
      rejectReason: reason,
    };
    
    try {
      await fetch(`${API_BASE}/orders/${orderId}/expenses/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const { expenses } = get();
      const newExpenses = expenses ? { ...expenses, ...expenseData } : null;
      set({ expenses: newExpenses });
      await localforage.setItem(`expenses_${orderId}`, newExpenses);
      await get().updateOrderStatus(orderId, 'serving');
      await get().addLog(orderId, '费用审核退回', get().user?.name || '系统', `退回原因: ${reason}`);
      await get().reportException({ orderId, type: 'fee_dispute', message: `费用审核未通过: ${reason}`, severity: 'warning' });
      get().addNotification('费用已退回');
    } catch {
      const { expenses } = get();
      const newExpenses = expenses ? { ...expenses, ...expenseData } : null;
      set({ expenses: newExpenses });
      await localforage.setItem(`expenses_${orderId}`, newExpenses);
      await localforage.setItem(`pending_expense_reject_${orderId}`, { orderId, reason, ...expenseData });
      await get().addLog(orderId, '费用审核退回', get().user?.name || '系统', `退回原因: ${reason}（待同步）`);
      await get().reportException({ orderId, type: 'fee_dispute', message: `费用审核未通过: ${reason}`, severity: 'warning' });
      get().addPendingAction({
        type: 'reject_expenses',
        data: { orderId, reason, expenseData },
        orderId,
      });
      get().addNotification('费用已退回，将在联网后同步');
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
    const exception: Exception = {
      ...exceptionData,
      id: `exc_${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    
    const exceptionTypeLabels: Record<string, string> = {
      late: '车辆迟到',
      damage: '物品破损',
      dispute: '费用争议',
      unconfirmed: '费用未确认',
      fee_dispute: '费用退回',
    };
    
    const severityLabels: Record<string, string> = {
      warning: '警告',
      error: '错误',
      critical: '紧急',
    };
    
    try {
      await fetch(`${API_BASE}/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exceptionData),
      });
      set((state) => ({ exceptions: [exception, ...state.exceptions] }));
      await get().addLog(exceptionData.orderId, '异常上报', get().user?.name || '系统', `类型: ${exceptionTypeLabels[exceptionData.type] || exceptionData.type}，严重程度: ${severityLabels[exceptionData.severity] || exceptionData.severity}，描述: ${exceptionData.message}`);
      get().addNotification(`异常已上报: ${exception.message}`);
    } catch {
      set((state) => ({ exceptions: [exception, ...state.exceptions] }));
      await localforage.setItem('exceptions', get().exceptions);
      await get().addLog(exceptionData.orderId, '异常上报', get().user?.name || '系统', `类型: ${exceptionTypeLabels[exceptionData.type] || exceptionData.type}，严重程度: ${severityLabels[exceptionData.severity] || exceptionData.severity}，描述: ${exceptionData.message}（待同步）`);
      get().addPendingAction({
        type: 'report_exception',
        data: exceptionData,
        orderId: exceptionData.orderId,
      });
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
      get().addPendingAction({
        type: 'resolve_exception',
        data: { exceptionId },
      });
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

  async loadAllLogs() {
    try {
      const response = await fetch(`${API_BASE}/logs`);
      if (response.ok) {
        const logs = await response.json();
        set({ allLogs: logs });
        localforage.setItem('allLogs', logs);
      }
    } catch {
      const storedLogs = await localforage.getItem<OperationLog[]>('allLogs');
      if (storedLogs) {
        set({ allLogs: storedLogs });
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
    const { pendingActions } = get();
    const failedActions: PendingAction[] = [];

    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case 'create_order':
            await fetch(`${API_BASE}/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action.data),
            });
            break;
          case 'update_status': {
            const { orderId, status } = action.data as { orderId: string; status: Order['status'] };
            await fetch(`${API_BASE}/orders/${orderId}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            });
            break;
          }
          case 'assign_vehicle': {
            const { orderId, vehicleId, driverName } = action.data as { orderId: string; vehicleId: string; driverName: string };
            await fetch(`${API_BASE}/orders/${orderId}/vehicle`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ vehicleId, driverName }),
            });
            break;
          }
          case 'add_addon': {
            const addon = action.data as Addon;
            await fetch(`${API_BASE}/orders/${addon.orderId}/addons`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(addon),
            });
            break;
          }
          case 'add_damage': {
            const damage = action.data as Damage;
            await fetch(`${API_BASE}/orders/${damage.orderId}/damages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(damage),
            });
            break;
          }
          case 'update_expenses': {
            const { orderId, expenseData } = action.data as { orderId: string; expenseData: Omit<Expense, 'id' | 'orderId'> };
            await fetch(`${API_BASE}/orders/${orderId}/expenses`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(expenseData),
            });
            break;
          }
          case 'confirm_expenses': {
            const { orderId, expenseData } = action.data as { orderId: string; expenseData?: { status: string; confirmedAt: string } };
            await fetch(`${API_BASE}/orders/${orderId}/expenses/confirm`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(expenseData || {}),
            });
            break;
          }
          case 'reject_expenses': {
            const { orderId, reason } = action.data as { orderId: string; reason: string };
            await fetch(`${API_BASE}/orders/${orderId}/expenses/reject`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason }),
            });
            break;
          }
          case 'report_exception': {
            const exceptionData = action.data as Omit<Exception, 'id' | 'createdAt' | 'resolved' | 'resolvedAt'>;
            await fetch(`${API_BASE}/exceptions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(exceptionData),
            });
            break;
          }
          case 'resolve_exception': {
            const { exceptionId } = action.data as { exceptionId: string };
            await fetch(`${API_BASE}/exceptions/${exceptionId}/resolve`, {
              method: 'PUT',
            });
            break;
          }
        }
      } catch {
        failedActions.push(action);
      }
    }

    set({ pendingActions: failedActions });
    await get().savePendingActions();

    const keys = await localforage.keys();
    const legacyPendingKeys = keys.filter((k) => k.startsWith('pending_') && !k.startsWith('pendingActions'));
    for (const key of legacyPendingKeys) {
      await localforage.removeItem(key);
    }

    await get().loadOrders();
    await get().loadExceptions();
    get().addNotification(`数据已同步，${pendingActions.length - failedActions.length} 项已上传`);
  },

  async loadFromLocalStorage() {
    const user = await localforage.getItem<User>('user');
    if (user) {
      set({ user });
      await get().loadOrders();
      await get().loadExceptions();
    }
    await get().loadRecentOrders();
    await get().loadPendingActions();
  },

  getTodosByRole: () => {
    const { user, orders } = get();
    if (!user) return [];

    const roleTodos: Record<UserRole, Order['status'][]> = {
      dispatcher: ['reserved'],
      teamLead: ['transporting', 'serving'],
      customerService: ['pending', 'settling'],
    };

    return orders.filter((order) => roleTodos[user.role].includes(order.status));
  },

  addToRecentOrders: (order) => {
    set((state) => {
      const existingIndex = state.recentOrders.findIndex((o) => o.id === order.id);
      let newRecentOrders;
      if (existingIndex >= 0) {
        newRecentOrders = [order, ...state.recentOrders.filter((o) => o.id !== order.id)];
      } else {
        newRecentOrders = [order, ...state.recentOrders].slice(0, 10);
      }
      localforage.setItem('recentOrders', newRecentOrders);
      return { recentOrders: newRecentOrders };
    });
  },

  loadRecentOrders: async () => {
    const stored = await localforage.getItem<Order[]>('recentOrders');
    if (stored) {
      set({ recentOrders: stored });
    }
  },

  addPendingAction: (action) => {
    const newAction: PendingAction = {
      ...action,
      id: `action_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ pendingActions: [...state.pendingActions, newAction] }));
    get().savePendingActions();
  },

  removePendingAction: (actionId) => {
    set((state) => ({ pendingActions: state.pendingActions.filter((a) => a.id !== actionId) }));
    get().savePendingActions();
  },

  savePendingActions: async () => {
    await localforage.setItem('pendingActions', get().pendingActions);
  },

  loadPendingActions: async () => {
    const stored = await localforage.getItem<PendingAction[]>('pendingActions');
    if (stored) {
      set({ pendingActions: stored });
    }
  },
}));

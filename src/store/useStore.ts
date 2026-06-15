import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  InstallationOrder,
  OrderStatus,
  User,
  Role,
  FilterOptions,
  SiteConditionRecord,
  ChangeLog,
  APPOINTMENT_FIELDS,
} from '../types';
import { generateMockData, generateOrderNo } from '../utils/mockData';

interface AppState {
  currentUser: User | null;
  orders: InstallationOrder[];
  users: User[];
  filters: FilterOptions;
  selectedOrderId: string | null;
  showOrderDetail: boolean;
  showBatchEntry: boolean;
  showSiteCheckModal: boolean;

  setCurrentUser: (user: User | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setSelectedOrderId: (id: string | null) => void;
  setShowOrderDetail: (show: boolean) => void;
  setShowBatchEntry: (show: boolean) => void;
  setShowSiteCheckModal: (show: boolean) => void;

  getFilteredOrders: () => InstallationOrder[];
  getOrderById: (id: string) => InstallationOrder | undefined;
  getUsersByRole: (role: Role) => User[];

  createOrder: (order: Partial<InstallationOrder>) => void;
  batchCreateOrders: (orders: Partial<InstallationOrder>[]) => void;
  updateOrder: (id: string, updates: Partial<InstallationOrder>) => void;
  updateOrderStatus: (id: string, status: OrderStatus, reason?: string) => void;
  assignOrder: (id: string, assigneeId: string, assigneeName: string) => void;
  addSiteCheck: (orderId: string, siteCheck: Omit<SiteConditionRecord, 'id' | 'orderId' | 'checkedAt' | 'orderVersion' | 'appointmentVersion'>) => void;
  rejectOrder: (id: string, reason: string) => void;
  delayOrder: (id: string, reason: string, newDate?: string) => void;
  supplementOrder: (id: string, updates: Partial<InstallationOrder>) => void;
  completeReview: (id: string, passed: boolean, note: string) => void;
  addChangeLog: (orderId: string, field: string, oldValue: string, newValue: string) => void;

  resetToMockData: () => void;
}

const initialFilters: FilterOptions = {
  status: 'all',
  dateRange: 'week',
  assignee: 'all',
  priority: 'all',
  keyword: '',
};

const isAppointmentField = (field: string): boolean => {
  return (APPOINTMENT_FIELDS as readonly string[]).includes(field);
};

const hasAppointmentFieldChanges = (
  order: InstallationOrder,
  updates: Partial<InstallationOrder>
): boolean => {
  for (const field of APPOINTMENT_FIELDS) {
    if (field in updates) {
      const oldVal = String((order as any)[field] || '');
      const newVal = String((updates as any)[field] || '');
      if (oldVal !== newVal) {
        return true;
      }
    }
  }
  return false;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const mockData = generateMockData();

      return {
        currentUser: mockData.users[0],
        orders: mockData.orders,
        users: mockData.users,
        filters: initialFilters,
        selectedOrderId: null,
        showOrderDetail: false,
        showBatchEntry: false,
        showSiteCheckModal: false,

        setCurrentUser: (user) => set({ currentUser: user }),
        setFilters: (newFilters) =>
          set((state) => ({ filters: { ...state.filters, ...newFilters } })),
        setSelectedOrderId: (id) => set({ selectedOrderId: id }),
        setShowOrderDetail: (show) => set({ showOrderDetail: show }),
        setShowBatchEntry: (show) => set({ showBatchEntry: show }),
        setShowSiteCheckModal: (show) => set({ showSiteCheckModal: show }),

        getFilteredOrders: () => {
          const { orders, filters } = get();
          let filtered = [...orders];

          if (filters.status !== 'all') {
            filtered = filtered.filter((o) => o.status === filters.status);
          }

          if (filters.assignee !== 'all') {
            filtered = filtered.filter((o) => o.assignee === filters.assignee);
          }

          if (filters.priority !== 'all') {
            filtered = filtered.filter((o) => o.priority === filters.priority);
          }

          if (filters.keyword) {
            const kw = filters.keyword.toLowerCase();
            filtered = filtered.filter(
              (o) =>
                o.orderNo.toLowerCase().includes(kw) ||
                o.customerName.toLowerCase().includes(kw) ||
                o.customerPhone.includes(kw) ||
                o.address.toLowerCase().includes(kw)
            );
          }

          if (filters.dateRange !== 'all') {
            const now = new Date();
            let startDate: Date;
            switch (filters.dateRange) {
              case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
              case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
              default:
                startDate = new Date(0);
            }
            filtered = filtered.filter(
              (o) => new Date(o.appointmentDate) >= startDate
            );
          }

          filtered.sort((a, b) => {
            const dateCompare = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            if (dateCompare !== 0) return dateCompare;
            const priorityOrder = { urgent: 0, vip: 1, normal: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });

          return filtered;
        },

        getOrderById: (id) => {
          return get().orders.find((o) => o.id === id);
        },

        getUsersByRole: (role) => {
          return get().users.filter((u) => u.role === role);
        },

        createOrder: (order) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;

          const newOrder: InstallationOrder = {
            id: crypto.randomUUID(),
            orderNo: generateOrderNo(),
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            address: order.address || '',
            productType: order.productType || '',
            productModel: order.productModel || '',
            appointmentDate: order.appointmentDate || '',
            appointmentTime: order.appointmentTime || '',
            status: 'scheduled',
            assignee: null,
            assigneeName: null,
            dispatcher: currentUser.id,
            dispatcherName: currentUser.name,
            priority: order.priority || 'normal',
            version: 1,
            appointmentVersion: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scheduledAt: new Date().toISOString(),
            completedAt: null,
            remarks: order.remarks || '',
            internalNotes: order.internalNotes || '',
            delayReason: '',
            rejectionReason: '',
            reviewNote: '',
            siteChecks: [],
            changeLogs: [],
          };

          set((state) => ({ orders: [newOrder, ...state.orders] }));
        },

        batchCreateOrders: (orderList) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;

          const newOrders = orderList.map((order) => ({
            id: crypto.randomUUID(),
            orderNo: generateOrderNo(),
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            address: order.address || '',
            productType: order.productType || '',
            productModel: order.productModel || '',
            appointmentDate: order.appointmentDate || '',
            appointmentTime: order.appointmentTime || '',
            status: 'scheduled' as OrderStatus,
            assignee: null,
            assigneeName: null,
            dispatcher: currentUser.id,
            dispatcherName: currentUser.name,
            priority: order.priority || 'normal' as const,
            version: 1,
            appointmentVersion: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scheduledAt: new Date().toISOString(),
            completedAt: null,
            remarks: order.remarks || '',
            internalNotes: order.internalNotes || '',
            delayReason: '',
            rejectionReason: '',
            reviewNote: '',
            siteChecks: [],
            changeLogs: [],
          }));

          set((state) => ({ orders: [...newOrders, ...state.orders] }));
        },

        updateOrder: (id, updates) => {
          const state = get();
          const order = state.orders.find((o) => o.id === id);
          if (!order) return;

          const oldOrder = { ...order };
          const newVersion = order.version + 1;
          const hasApptChanges = hasAppointmentFieldChanges(order, updates);
          const newAppointmentVersion = hasApptChanges
            ? order.appointmentVersion + 1
            : order.appointmentVersion;

          const needsRecheck = hasApptChanges &&
            order.siteChecks.length > 0 &&
            ['site_check_passed', 'installation'].includes(order.status);

          if (needsRecheck) {
            get().addChangeLog(id, 'status', order.status, 'site_check_pending');
          }

          for (const [key, value] of Object.entries(updates)) {
            if (key in order && (order as any)[key] !== value) {
              const oldVal = String((oldOrder as any)[key] || '');
              const newVal = String(value || '');
              if (oldVal !== newVal) {
                get().addChangeLog(id, key, oldVal, newVal);
              }
            }
          }

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id
                ? {
                    ...o,
                    ...updates,
                    version: newVersion,
                    appointmentVersion: newAppointmentVersion,
                    ...(needsRecheck ? { status: 'site_check_pending' as OrderStatus } : {}),
                    updatedAt: new Date().toISOString(),
                  }
                : o
            ),
          }));
        },

        updateOrderStatus: (id, status, reason) => {
          const state = get();
          const order = state.orders.find((o) => o.id === id);
          if (!order) return;

          const updates: Partial<InstallationOrder> = {
            status,
            version: order.version + 1,
            updatedAt: new Date().toISOString(),
          };

          if (status === 'completed') {
            updates.completedAt = new Date().toISOString();
          }

          get().addChangeLog(id, 'status', order.status, status);

          if (reason && status === 'rejected') {
            updates.rejectionReason = reason;
          }
          if (reason && status === 'delayed') {
            updates.delayReason = reason;
          }

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id ? { ...o, ...updates } : o
            ),
          }));
        },

        assignOrder: (id, assigneeId, assigneeName) => {
          const state = get();
          const order = state.orders.find((o) => o.id === id);
          if (!order) return;

          get().addChangeLog(id, 'assignee', order.assigneeName || '未分配', assigneeName);
          get().addChangeLog(id, 'status', order.status, 'assigned');

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id
                ? {
                    ...o,
                    assignee: assigneeId,
                    assigneeName,
                    status: 'assigned',
                    version: o.version + 1,
                    updatedAt: new Date().toISOString(),
                  }
                : o
            ),
          }));
        },

        addSiteCheck: (orderId, siteCheck) => {
          const state = get();
          const order = state.orders.find((o) => o.id === orderId);
          if (!order) return;

          const newSiteCheck: SiteConditionRecord = {
            ...siteCheck,
            id: crypto.randomUUID(),
            orderId,
            checkedAt: new Date().toISOString(),
            orderVersion: order.version,
            appointmentVersion: order.appointmentVersion,
          };

          const newStatus = siteCheck.overallResult === 'passed'
            ? 'site_check_passed'
            : siteCheck.overallResult === 'failed'
            ? 'site_check_failed'
            : 'site_check_pending';

          get().addChangeLog(orderId, 'status', order.status, newStatus);

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    siteChecks: [...o.siteChecks, newSiteCheck],
                    status: newStatus as OrderStatus,
                    version: o.version + 1,
                    updatedAt: new Date().toISOString(),
                  }
                : o
            ),
          }));
        },

        rejectOrder: (id, reason) => {
          get().updateOrderStatus(id, 'rejected', reason);
        },

        delayOrder: (id, reason, newDate) => {
          const state = get();
          const order = state.orders.find((o) => o.id === id);
          if (!order) return;

          const updates: Partial<InstallationOrder> = {
            status: 'delayed',
            delayReason: reason,
            version: order.version + 1,
            updatedAt: new Date().toISOString(),
          };

          let newAppointmentVersion = order.appointmentVersion;
          if (newDate && newDate !== order.appointmentDate) {
            updates.appointmentDate = newDate;
            newAppointmentVersion = order.appointmentVersion + 1;
            updates.appointmentVersion = newAppointmentVersion;
            get().addChangeLog(id, 'appointmentDate', order.appointmentDate, newDate);
          }

          get().addChangeLog(id, 'status', order.status, 'delayed');

          set((state) => ({
            orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates, appointmentVersion: newAppointmentVersion } : o)),
          }));
        },

        supplementOrder: (id, updates) => {
          const state = get();
          const order = state.orders.find((o) => o.id === id);
          if (!order) return;

          get().addChangeLog(id, 'status', order.status, 'supplemented');

          const hasApptChanges = hasAppointmentFieldChanges(order, updates);

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id
                ? {
                    ...o,
                    ...updates,
                    status: 'supplemented',
                    version: o.version + 1,
                    appointmentVersion: hasApptChanges ? o.appointmentVersion + 1 : o.appointmentVersion,
                    updatedAt: new Date().toISOString(),
                  }
                : o
            ),
          }));
        },

        completeReview: (id, passed, note) => {
          const state = get();
          const order = state.orders.find((o) => o.id === id);
          if (!order) return;

          const newStatus = passed ? 'completed' : 'rejected';

          get().addChangeLog(id, 'status', order.status, newStatus);

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id
                ? {
                    ...o,
                    status: newStatus,
                    reviewNote: note,
                    version: o.version + 1,
                    updatedAt: new Date().toISOString(),
                    completedAt: passed ? new Date().toISOString() : o.completedAt,
                  }
                : o
            ),
          }));
        },

        addChangeLog: (orderId, field, oldValue, newValue) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;

          const log: ChangeLog = {
            id: crypto.randomUUID(),
            orderId,
            field,
            oldValue,
            newValue,
            operator: currentUser.id,
            operatorName: currentUser.name,
            operatorRole: currentUser.role,
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, changeLogs: [...o.changeLogs, log] }
                : o
            ),
          }));
        },

        resetToMockData: () => {
          const mockData = generateMockData();
          set({
            orders: mockData.orders,
            users: mockData.users,
            currentUser: mockData.users[0],
          });
        },
      };
    },
    {
      name: 'bathroom-installation-storage',
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          const mockData = generateMockData();
          return {
            currentUser: mockData.users[0],
            orders: mockData.orders,
            users: mockData.users,
            filters: initialFilters,
            selectedOrderId: null,
            showOrderDetail: false,
            showBatchEntry: false,
            showSiteCheckModal: false,
          };
        }
        return persistedState;
      },
    }
  )
);

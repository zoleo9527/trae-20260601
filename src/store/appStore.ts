import { create } from 'zustand';
import type {
  User,
  Customer,
  DeliveryRoute,
  BottleReturnRecord,
  DepositReconciliation,
  OperationLog,
  Alert,
  UserRole,
  BottleReturnStatus,
  DepositReconciliationStatus,
  BottleReturnFilters,
  DepositReconciliationFilters
} from '@/types';
import {
  mockUsers,
  mockCustomers,
  mockRoutes,
  mockBottleReturnRecords,
  mockDepositReconciliations,
  mockOperationLogs,
  mockAlerts
} from '@/data/mockData';
import { generateId } from '@/lib/utils';

interface AppState {
  currentUser: User | null;
  users: User[];
  customers: Customer[];
  routes: DeliveryRoute[];
  bottleReturnRecords: BottleReturnRecord[];
  depositReconciliations: DepositReconciliation[];
  operationLogs: OperationLog[];
  alerts: Alert[];
  bottleReturnFilters: BottleReturnFilters;
  depositFilters: DepositReconciliationFilters;
  setCurrentUser: (user: User) => void;
  setCurrentUserRole: (role: UserRole) => void;
  setBottleReturnFilters: (filters: Partial<BottleReturnFilters>) => void;
  setDepositFilters: (filters: Partial<DepositReconciliationFilters>) => void;
  getFilteredBottleReturns: () => BottleReturnRecord[];
  getFilteredDeposits: () => DepositReconciliation[];
  getStuckItems: () => { bottles: BottleReturnRecord[]; deposits: DepositReconciliation[] };
  getActiveAlerts: () => Alert[];
  getAlertsForRole: (role: UserRole) => Alert[];
  updateBottleReturnStatus: (id: string, status: BottleReturnStatus, remark: string, extra?: any) => void;
  updateDepositStatus: (id: string, status: DepositReconciliationStatus, remark: string, extra?: any) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string, remark: string) => void;
  addOperationLog: (log: any) => void;
  createDepositReconciliation: (bottleReturnId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[0],
  users: mockUsers,
  customers: mockCustomers,
  routes: mockRoutes,
  bottleReturnRecords: mockBottleReturnRecords,
  depositReconciliations: mockDepositReconciliations,
  operationLogs: mockOperationLogs,
  alerts: mockAlerts,
  bottleReturnFilters: {},
  depositFilters: {},
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentUserRole: (role) => {
    const userForRole = mockUsers.find((u) => u.role === role);
    if (userForRole) set({ currentUser: userForRole });
  },
  setBottleReturnFilters: (filters) =>
    set((state) => ({ bottleReturnFilters: { ...state.bottleReturnFilters, ...filters } })),
  setDepositFilters: (filters) =>
    set((state) => ({ depositFilters: { ...state.depositFilters, ...filters } })),
  getFilteredBottleReturns: () => {
    const { bottleReturnRecords, bottleReturnFilters } = get();
    return bottleReturnRecords.filter((record) => {
      if (bottleReturnFilters.status?.length && !bottleReturnFilters.status.includes(record.status)) return false;
      if (bottleReturnFilters.routeId && record.routeId !== bottleReturnFilters.routeId) return false;
      if (bottleReturnFilters.customerId && record.customerId !== bottleReturnFilters.customerId) return false;
      if (bottleReturnFilters.collectedBy && record.collectedBy !== bottleReturnFilters.collectedBy) return false;
      if (bottleReturnFilters.hasStuck && record.status !== 'stuck') return false;
      return true;
    });
  },
  getFilteredDeposits: () => {
    const { depositReconciliations, depositFilters } = get();
    return depositReconciliations.filter((record) => {
      if (depositFilters.status?.length && !depositFilters.status.includes(record.status)) return false;
      if (depositFilters.customerId && record.customerId !== depositFilters.customerId) return false;
      if (depositFilters.verifiedBy && record.verifiedBy !== depositFilters.verifiedBy) return false;
      if (depositFilters.hasDifference && record.difference === 0) return false;
      if (depositFilters.hasStuck && record.status !== 'stuck') return false;
      return true;
    });
  },
  getStuckItems: () => {
    const { bottleReturnRecords, depositReconciliations } = get();
    return {
      bottles: bottleReturnRecords.filter((r) => r.status === 'stuck'),
      deposits: depositReconciliations.filter((r) => r.status === 'stuck')
    };
  },
  getActiveAlerts: () => get().alerts.filter((a) => a.status !== 'resolved'),
  getAlertsForRole: (role) => get().alerts.filter((a) => a.status !== 'resolved' && (!a.assignedRole || a.assignedRole === role)),
  updateBottleReturnStatus: (id, status, remark, extra = {}) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const oldRecord = state.bottleReturnRecords.find((r) => r.id === id);
      if (!oldRecord) return state;
      const updatedRecords = state.bottleReturnRecords.map((r) => {
        if (r.id === id) {
          const updates: any = { status, updatedAt: new Date().toISOString(), ...extra };
          if (status === 'collected') updates.collectedAt = new Date().toISOString();
          if (status === 'returned_to_station') updates.returnedToStationAt = new Date().toISOString();
          if (status === 'verified') updates.verifiedAt = new Date().toISOString();
          if (status === 'stuck') updates.stuckAt = new Date().toISOString();
          return { ...r, ...updates };
        }
        return r;
      });
      const newLog: OperationLog = {
        id: generateId(),
        operationType: `bottle_${status.replace(/_/g, '')}` as any,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'bottle_return',
        targetId: id,
        remark,
        oldStatus: oldRecord.status,
        newStatus: status,
        createdAt: new Date().toISOString()
      };
      return { bottleReturnRecords: updatedRecords, operationLogs: [newLog, ...state.operationLogs] };
    });
  },
  updateDepositStatus: (id, status, remark, extra = {}) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const oldRecord = state.depositReconciliations.find((r) => r.id === id);
      if (!oldRecord) return state;
      const updatedRecords = state.depositReconciliations.map((r) => {
        if (r.id === id) {
          const updates: any = { status, updatedAt: new Date().toISOString(), ...extra };
          if (status === 'verified') {
            updates.verifiedAt = new Date().toISOString();
            updates.verifiedBy = currentUser.id;
          }
          if (status === 'stuck') updates.stuckAt = new Date().toISOString();
          return { ...r, ...updates };
        }
        return r;
      });
      const newLog: OperationLog = {
        id: generateId(),
        operationType: `deposit_${status.replace(/_/g, '')}` as any,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'deposit_reconciliation',
        targetId: id,
        remark,
        oldStatus: oldRecord.status,
        newStatus: status,
        createdAt: new Date().toISOString()
      };
      return { depositReconciliations: updatedRecords, operationLogs: [newLog, ...state.operationLogs] };
    });
  },
  acknowledgeAlert: (alertId) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'acknowledged' as const, acknowledgedBy: currentUser.id, acknowledgedAt: new Date().toISOString() } : a
      )
    }));
  },
  resolveAlert: (alertId, remark) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const newLog: OperationLog = {
        id: generateId(),
        operationType: 'resolve_alert',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'alert',
        targetId: alertId,
        remark,
        createdAt: new Date().toISOString()
      };
      return {
        alerts: state.alerts.map((a) =>
          a.id === alertId ? { ...a, status: 'resolved' as const, resolvedBy: currentUser.id, resolvedAt: new Date().toISOString() } : a
        ),
        operationLogs: [newLog, ...state.operationLogs]
      };
    });
  },
  addOperationLog: (log) => {
    set((state) => ({
      operationLogs: [{ ...log, id: generateId(), createdAt: new Date().toISOString() }, ...state.operationLogs]
    }));
  },
  createDepositReconciliation: (bottleReturnId) => {
    const { currentUser, bottleReturnRecords } = get();
    if (!currentUser) return;
    const bottleReturn = bottleReturnRecords.find((r) => r.id === bottleReturnId);
    if (!bottleReturn) return;
    const expectedDeposit = bottleReturn.expectedBottles * 10;
    const actualDeposit = bottleReturn.returnedBottles * 10;
    const difference = actualDeposit - expectedDeposit;
    const newReconciliation: DepositReconciliation = {
      id: generateId(),
      customerId: bottleReturn.customerId,
      customer: bottleReturn.customer,
      bottleReturnRecordId: bottleReturnId,
      bottleReturnRecord: bottleReturn,
      expectedDeposit,
      actualDeposit,
      difference,
      status: difference === 0 ? 'matched' : 'mismatched',
      verifiedBy: null,
      verifiedAt: null,
      reason: difference !== 0 ? `空瓶数量差异: ${bottleReturn.expectedBottles - bottleReturn.returnedBottles}个` : null,
      disputeReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => ({ depositReconciliations: [newReconciliation, ...state.depositReconciliations] }));
  }
}));

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
  DepositReconciliationFilters,
  OperationType,
  Store,
  Product,
  NearExpiryRecord,
  OffShelfReview,
  NearExpiryStatus,
  ReviewStatus,
  NearExpiryFilters,
  ReviewFilters
} from '@/types';
import {
  mockUsers,
  mockCustomers,
  mockRoutes,
  mockBottleReturnRecords,
  mockDepositReconciliations,
  mockOperationLogs,
  mockAlerts,
  mockStores,
  mockProducts,
  mockNearExpiryRecords,
  mockOffShelfReviews
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
  logFilters: {
    targetType?: 'bottle_return' | 'deposit_reconciliation' | 'alert' | 'near_expiry' | 'off_shelf_review';
    targetId?: string;
    operationType?: OperationType;
    operatorRole?: UserRole;
  };
  stores: Store[];
  products: Product[];
  nearExpiryRecords: NearExpiryRecord[];
  offShelfReviews: OffShelfReview[];
  nearExpiryFilters: NearExpiryFilters;
  reviewFilters: ReviewFilters;
  setCurrentUser: (user: User) => void;
  setCurrentUserRole: (role: UserRole) => void;
  setBottleReturnFilters: (filters: Partial<BottleReturnFilters>) => void;
  setDepositFilters: (filters: Partial<DepositReconciliationFilters>) => void;
  setLogFilters: (filters: Partial<AppState['logFilters']>) => void;
  setNearExpiryFilters: (filters: Partial<NearExpiryFilters>) => void;
  setReviewFilters: (filters: Partial<ReviewFilters>) => void;
  getFilteredBottleReturns: () => BottleReturnRecord[];
  getFilteredDeposits: () => DepositReconciliation[];
  getFilteredLogs: () => OperationLog[];
  getFilteredNearExpiry: () => NearExpiryRecord[];
  getFilteredReviews: () => OffShelfReview[];
  getStuckItems: () => { bottles: BottleReturnRecord[]; deposits: DepositReconciliation[] };
  getActiveAlerts: () => Alert[];
  getAlertsForRole: (role: UserRole) => Alert[];
  getLogsForTarget: (targetType: 'bottle_return' | 'deposit_reconciliation' | 'near_expiry' | 'off_shelf_review', targetId: string) => OperationLog[];
  getRelatedLogsByBottleId: (bottleReturnId: string) => OperationLog[];
  getRelatedLogsByDepositId: (depositId: string) => OperationLog[];
  getRelatedLogsByNearExpiryId: (nearExpiryId: string) => OperationLog[];
  getRelatedLogsByReviewId: (reviewId: string) => OperationLog[];
  updateBottleReturnStatus: (id: string, status: BottleReturnStatus, remark: string, extra?: any) => void;
  updateDepositStatus: (id: string, status: DepositReconciliationStatus, remark: string, extra?: any) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string, remark: string) => void;
  addOperationLog: (log: any) => void;
  createDepositReconciliation: (bottleReturnId: string) => void;
  processNearExpiry: (id: string, processMethod: 'mark_down' | 'donate' | 'return' | 'destroy', remark: string, extra?: any) => void;
  submitNearExpiryForReview: (id: string, remark: string) => void;
  reviewOffShelf: (reviewId: string, action: 'approve' | 'reject' | 'request_supplement', remark: string) => void;
  supplementReview: (reviewId: string, remark: string) => void;
  completeNearExpiry: (id: string, remark: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[4],
  users: mockUsers,
  customers: mockCustomers,
  routes: mockRoutes,
  bottleReturnRecords: mockBottleReturnRecords,
  depositReconciliations: mockDepositReconciliations,
  operationLogs: mockOperationLogs,
  alerts: mockAlerts,
  bottleReturnFilters: {},
  depositFilters: {},
  logFilters: {},
  stores: mockStores,
  products: mockProducts,
  nearExpiryRecords: mockNearExpiryRecords,
  offShelfReviews: mockOffShelfReviews,
  nearExpiryFilters: {},
  reviewFilters: {},
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
  setLogFilters: (filters) =>
    set((state) => ({ logFilters: { ...state.logFilters, ...filters } })),
  getFilteredLogs: () => {
    const { operationLogs, logFilters } = get();
    return operationLogs.filter((log) => {
      if (logFilters.targetType && log.targetType !== logFilters.targetType) return false;
      if (logFilters.targetId && log.targetId !== logFilters.targetId) return false;
      if (logFilters.operationType && log.operationType !== logFilters.operationType) return false;
      if (logFilters.operatorRole && log.operatorRole !== logFilters.operatorRole) return false;
      return true;
    });
  },
  getLogsForTarget: (targetType, targetId) => {
    return get().operationLogs.filter((log) => log.targetType === targetType && log.targetId === targetId);
  },
  getRelatedLogsByBottleId: (bottleReturnId) => {
    const { operationLogs, depositReconciliations } = get();
    const linkedDeposit = depositReconciliations.find((d) => d.bottleReturnRecordId === bottleReturnId);
    const bottleLogs = operationLogs.filter((log) => log.targetType === 'bottle_return' && log.targetId === bottleReturnId);
    const depositLogs = linkedDeposit
      ? operationLogs.filter((log) => log.targetType === 'deposit_reconciliation' && log.targetId === linkedDeposit.id)
      : [];
    const alertLogs = operationLogs.filter((log) => log.targetType === 'alert' && (
      bottleLogs.some((bl) => log.targetId === bl.targetId) ||
      depositLogs.some((dl) => log.targetId === dl.targetId)
    ));
    return [...bottleLogs, ...depositLogs, ...alertLogs].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },
  getRelatedLogsByDepositId: (depositId) => {
    const { operationLogs, depositReconciliations } = get();
    const deposit = depositReconciliations.find((d) => d.id === depositId);
    if (!deposit) return [];
    return get().getRelatedLogsByBottleId(deposit.bottleReturnRecordId);
  },
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
      let opType: OperationType;
      if (oldRecord.status === 'stuck') {
        opType = 'bottle_unstick';
      } else {
        const operationTypeMap: Record<string, OperationType> = {
          pending_collection: 'bottle_collect',
          collected: 'bottle_collect',
          returned_to_station: 'bottle_return_station',
          verified: 'bottle_verify',
          disputed: 'bottle_dispute',
          stuck: 'bottle_stick',
          rejected: 'bottle_reject',
        };
        opType = operationTypeMap[status] || 'bottle_collect';
      }
      const newLog: OperationLog = {
        id: generateId(),
        operationType: opType,
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
      const newAlerts = [...state.alerts];
      if (status === 'stuck') {
        newAlerts.unshift({
          id: generateId(),
          type: 'stuck_bottle',
          title: `空瓶回收卡住: ${oldRecord.customer.name}`,
          description: remark || '空瓶回收记录被标记为卡住，需要及时处理',
          targetType: 'bottle_return',
          targetId: id,
          status: 'active',
          priority: 'high',
          assignedRole: 'station_clerk',
          createdAt: new Date().toISOString()
        });
      }
      if (status === 'rejected') {
        newAlerts.unshift({
          id: generateId(),
          type: 'disputed',
          title: `空瓶回收被退回: ${oldRecord.customer.name}`,
          description: remark || '空瓶回收记录被退回，请检查处理',
          targetType: 'bottle_return',
          targetId: id,
          status: 'active',
          priority: 'medium',
          assignedRole: 'delivery_person',
          createdAt: new Date().toISOString()
        });
      }
      return {
        bottleReturnRecords: updatedRecords,
        operationLogs: [newLog, ...state.operationLogs],
        alerts: newAlerts
      };
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
      let depositOpType: OperationType;
      if (oldRecord.status === 'stuck') {
        depositOpType = 'deposit_unstick';
      } else {
        const depositOpTypeMap: Record<string, OperationType> = {
          pending: 'deposit_init',
          matched: 'deposit_match',
          mismatched: 'deposit_mismatch',
          pending_verification: 'deposit_verify',
          verified: 'deposit_verify',
          disputed: 'deposit_dispute',
          stuck: 'deposit_stick',
        };
        depositOpType = depositOpTypeMap[status] || 'deposit_init';
      }
      const newLog: OperationLog = {
        id: generateId(),
        operationType: depositOpType,
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
      const newAlerts = [...state.alerts];
      if (status === 'stuck') {
        newAlerts.unshift({
          id: generateId(),
          type: 'stuck_deposit',
          title: `押金核对卡住: ${oldRecord.customer.name}`,
          description: remark || '押金核对记录被标记为卡住，需要及时处理',
          targetType: 'deposit_reconciliation',
          targetId: id,
          status: 'active',
          priority: 'high',
          assignedRole: 'station_clerk',
          createdAt: new Date().toISOString()
        });
      }
      if (status === 'mismatched') {
        newAlerts.unshift({
          id: generateId(),
          type: 'mismatched_deposit',
          title: `押金核对不一致: ${oldRecord.customer.name}`,
          description: remark || `押金核对存在差额: ¥${oldRecord.difference}`,
          targetType: 'deposit_reconciliation',
          targetId: id,
          status: 'active',
          priority: 'medium',
          assignedRole: 'station_clerk',
          createdAt: new Date().toISOString()
        });
      }
      return {
        depositReconciliations: updatedRecords,
        operationLogs: [newLog, ...state.operationLogs],
        alerts: newAlerts
      };
    });
  },
  acknowledgeAlert: (alertId) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const alert = state.alerts.find((a) => a.id === alertId);
      const newLog: OperationLog = {
        id: generateId(),
        operationType: 'acknowledge_alert',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'alert',
        targetId: alertId,
        remark: '确认已收到提醒',
        oldStatus: alert?.status,
        newStatus: 'acknowledged',
        createdAt: new Date().toISOString()
      };
      return {
        alerts: state.alerts.map((a) =>
          a.id === alertId ? { ...a, status: 'acknowledged' as const, acknowledgedBy: currentUser.id, acknowledgedAt: new Date().toISOString() } : a
        ),
        operationLogs: [newLog, ...state.operationLogs]
      };
    });
  },
  resolveAlert: (alertId, remark) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const alert = state.alerts.find((a) => a.id === alertId);
      const newLog: OperationLog = {
        id: generateId(),
        operationType: 'resolve_alert',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'alert',
        targetId: alertId,
        remark,
        oldStatus: alert?.status,
        newStatus: 'resolved',
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
    const newId = generateId();
    const newReconciliation: DepositReconciliation = {
      id: newId,
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
    const newLog: OperationLog = {
      id: generateId(),
      operationType: 'deposit_init',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      targetType: 'deposit_reconciliation',
      targetId: newId,
      remark: difference === 0 ? '自动创建押金核对，核对一致' : `自动创建押金核对，存在差额: ¥${difference}`,
      oldStatus: bottleReturn.status,
      newStatus: difference === 0 ? 'matched' : 'mismatched',
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const newAlerts = [...state.alerts];
      if (difference !== 0) {
        newAlerts.unshift({
          id: generateId(),
          type: 'mismatched_deposit',
          title: `押金核对存在差额: ${bottleReturn.customer.name}`,
          description: `空瓶预期${bottleReturn.expectedBottles}个，实收${bottleReturn.returnedBottles}个，押金差额¥${difference}`,
          targetType: 'deposit_reconciliation',
          targetId: newId,
          status: 'active',
          priority: 'medium',
          assignedRole: 'station_clerk',
          createdAt: new Date().toISOString()
        });
      }
      return {
        depositReconciliations: [newReconciliation, ...state.depositReconciliations],
        operationLogs: [newLog, ...state.operationLogs],
        alerts: newAlerts
      };
    });
  },
  setNearExpiryFilters: (filters) =>
    set((state) => ({ nearExpiryFilters: { ...state.nearExpiryFilters, ...filters } })),
  setReviewFilters: (filters) =>
    set((state) => ({ reviewFilters: { ...state.reviewFilters, ...filters } })),
  getFilteredNearExpiry: () => {
    const { nearExpiryRecords, nearExpiryFilters, currentUser } = get();
    return nearExpiryRecords.filter((record) => {
      if (currentUser?.role === 'store_manager') {
        const managedStore = get().stores.find(s => s.managerId === currentUser.id);
        if (managedStore && record.storeId !== managedStore.id) return false;
      }
      if (nearExpiryFilters.status?.length && !nearExpiryFilters.status.includes(record.status)) return false;
      if (nearExpiryFilters.storeId && record.storeId !== nearExpiryFilters.storeId) return false;
      if (nearExpiryFilters.processMethod && record.processMethod !== nearExpiryFilters.processMethod) return false;
      return true;
    });
  },
  getFilteredReviews: () => {
    const { offShelfReviews, reviewFilters, currentUser } = get();
    return offShelfReviews.filter((review) => {
      if (currentUser?.role === 'store_manager') {
        const managedStore = get().stores.find(s => s.managerId === currentUser.id);
        if (managedStore && review.storeId !== managedStore.id) return false;
      }
      if (currentUser?.role === 'supervisor') {
        const isPendingForMe = review.currentHandlerRole === 'supervisor';
        const isMyHandled = review.firstReviewedBy === currentUser.id;
        if (!isPendingForMe && !isMyHandled) return false;
      }
      if (currentUser?.role === 'product_specialist') {
        const isPendingForMe = review.currentHandlerRole === 'product_specialist';
        const isMyHandled = review.finalReviewedBy === currentUser.id;
        if (!isPendingForMe && !isMyHandled) return false;
      }
      if (reviewFilters.status?.length && !reviewFilters.status.includes(review.status)) return false;
      if (reviewFilters.storeId && review.storeId !== reviewFilters.storeId) return false;
      return true;
    });
  },
  getRelatedLogsByNearExpiryId: (nearExpiryId) => {
    const { operationLogs, offShelfReviews } = get();
    const nearExpiryLogs = operationLogs.filter((log) => log.targetType === 'near_expiry' && log.targetId === nearExpiryId);
    const linkedReview = offShelfReviews.find((r) => r.nearExpiryId === nearExpiryId);
    const reviewLogs = linkedReview
      ? operationLogs.filter((log) => log.targetType === 'off_shelf_review' && log.targetId === linkedReview.id)
      : [];
    return [...nearExpiryLogs, ...reviewLogs].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },
  getRelatedLogsByReviewId: (reviewId) => {
    const { operationLogs, offShelfReviews } = get();
    const review = offShelfReviews.find((r) => r.id === reviewId);
    if (!review) return [];
    return get().getRelatedLogsByNearExpiryId(review.nearExpiryId);
  },
  processNearExpiry: (id, processMethod, remark, extra = {}) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const oldRecord = state.nearExpiryRecords.find((r) => r.id === id);
      if (!oldRecord) return state;
      const statusMap: Record<string, NearExpiryStatus> = {
        mark_down: 'marked_down',
        donate: 'donated',
        return: 'returned',
        destroy: 'destroyed',
      };
      const newStatus = statusMap[processMethod] || oldRecord.status;
      const updatedRecords = state.nearExpiryRecords.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: newStatus,
            processMethod,
            handledBy: currentUser.id,
            handledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...extra,
          };
        }
        return r;
      });
      const newLog: OperationLog = {
        id: generateId(),
        operationType: 'expiry_process',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'near_expiry',
        targetId: id,
        remark,
        oldStatus: oldRecord.status,
        newStatus,
        createdAt: new Date().toISOString()
      };
      return {
        nearExpiryRecords: updatedRecords,
        operationLogs: [newLog, ...state.operationLogs]
      };
    });
  },
  submitNearExpiryForReview: (id, remark) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const oldRecord = state.nearExpiryRecords.find((r) => r.id === id);
      if (!oldRecord) return state;
      const updatedRecords = state.nearExpiryRecords.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: 'pending_review' as const,
            submittedBy: currentUser.id,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      const newReview: OffShelfReview = {
        id: generateId(),
        nearExpiryId: id,
        nearExpiryRecord: updatedRecords.find((r) => r.id === id)!,
        storeId: oldRecord.storeId,
        store: oldRecord.store,
        status: 'pending' as const,
        currentHandlerRole: 'supervisor',
        submittedBy: currentUser.id,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const newLog: OperationLog = {
        id: generateId(),
        operationType: 'expiry_submit_review',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'near_expiry',
        targetId: id,
        remark,
        oldStatus: oldRecord.status,
        newStatus: 'pending_review',
        createdAt: new Date().toISOString()
      };
      const reviewLog: OperationLog = {
        id: generateId(),
        operationType: 'review_accept',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'off_shelf_review',
        targetId: newReview.id,
        remark: '店长提交复核申请',
        oldStatus: undefined,
        newStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      return {
        nearExpiryRecords: updatedRecords,
        offShelfReviews: [newReview, ...state.offShelfReviews],
        operationLogs: [newLog, reviewLog, ...state.operationLogs]
      };
    });
  },
  reviewOffShelf: (reviewId, action, remark) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const oldReview = state.offShelfReviews.find((r) => r.id === reviewId);
      if (!oldReview) return state;
      let newReviewStatus: ReviewStatus = oldReview.status;
      let newExpiryStatus: NearExpiryStatus | undefined;
      let newHandlerRole: UserRole = oldReview.currentHandlerRole;
      const updates: Partial<OffShelfReview> = { updatedAt: new Date().toISOString() };

      if (action === 'reject') {
        newReviewStatus = 'rejected';
        newExpiryStatus = 'review_rejected';
        newHandlerRole = 'store_manager';
        updates.rejectReason = remark;
      } else if (action === 'request_supplement') {
        newReviewStatus = 'supplement_requested';
        newExpiryStatus = 'supplement_requested';
        newHandlerRole = 'store_manager';
        updates.supplementRequest = remark;
      } else if (action === 'approve') {
        if (currentUser.role === 'supervisor') {
          newReviewStatus = 'under_review';
          newHandlerRole = 'product_specialist';
          updates.firstReviewedBy = currentUser.id;
          updates.firstReviewedAt = new Date().toISOString();
          updates.firstReviewRemark = remark;
        } else if (currentUser.role === 'product_specialist') {
          newReviewStatus = 'approved';
          newExpiryStatus = 'review_approved';
          newHandlerRole = 'product_specialist';
          updates.finalReviewedBy = currentUser.id;
          updates.finalReviewedAt = new Date().toISOString();
          updates.finalReviewRemark = remark;
          updates.completedAt = new Date().toISOString();
        }
      }

      const updatedReviews = state.offShelfReviews.map((r) => {
        if (r.id === reviewId) {
          return { ...r, ...updates, status: newReviewStatus, currentHandlerRole: newHandlerRole };
        }
        return r;
      });

      let updatedNearExpiry = state.nearExpiryRecords;
      if (newExpiryStatus) {
        updatedNearExpiry = state.nearExpiryRecords.map((r) => {
          if (r.id === oldReview.nearExpiryId) {
            return {
              ...r,
              status: newExpiryStatus,
              reviewedBy: currentUser.id,
              reviewedAt: new Date().toISOString(),
              reviewRemark: remark,
              rejectReason: action === 'reject' ? remark : r.rejectReason,
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        });
      }

      const opTypeMap: Record<string, OperationType> = {
        approve: 'review_approve',
        reject: 'review_reject',
        request_supplement: 'review_request_supplement',
      };

      const newReviewLog: OperationLog = {
        id: generateId(),
        operationType: opTypeMap[action] || 'review_approve',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'off_shelf_review',
        targetId: reviewId,
        remark,
        oldStatus: oldReview.status,
        newStatus: newReviewStatus,
        createdAt: new Date().toISOString()
      };

      let newNearExpiryLog: OperationLog | null = null;
      if (newExpiryStatus) {
        newNearExpiryLog = {
          id: generateId(),
          operationType: opTypeMap[action] || 'review_approve',
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          targetType: 'near_expiry',
          targetId: oldReview.nearExpiryId,
          remark,
          oldStatus: oldReview.nearExpiryRecord.status,
          newStatus: newExpiryStatus,
          createdAt: new Date().toISOString()
        };
      }

      return {
        offShelfReviews: updatedReviews,
        nearExpiryRecords: updatedNearExpiry,
        operationLogs: [newReviewLog, ...(newNearExpiryLog ? [newNearExpiryLog] : []), ...state.operationLogs]
      };
    });
  },
  supplementReview: (reviewId, remark) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const oldReview = state.offShelfReviews.find((r) => r.id === reviewId);
      if (!oldReview) return state;
      const updatedReviews = state.offShelfReviews.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            status: 'pending' as const,
            currentHandlerRole: 'supervisor',
            supplementSubmittedBy: currentUser.id,
            supplementSubmittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      const updatedNearExpiry = state.nearExpiryRecords.map((r) => {
        if (r.id === oldReview.nearExpiryId) {
          return {
            ...r,
            status: 'pending_review' as const,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      const newReviewLog: OperationLog = {
        id: generateId(),
        operationType: 'review_supplement',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'off_shelf_review',
        targetId: reviewId,
        remark,
        oldStatus: oldReview.status,
        newStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      return {
        offShelfReviews: updatedReviews,
        nearExpiryRecords: updatedNearExpiry,
        operationLogs: [newReviewLog, ...state.operationLogs]
      };
    });
  },
  completeNearExpiry: (id, remark) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((state) => {
      const oldRecord = state.nearExpiryRecords.find((r) => r.id === id);
      if (!oldRecord) return state;
      const updatedRecords = state.nearExpiryRecords.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: 'completed' as const,
            completedBy: currentUser.id,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      const newLog: OperationLog = {
        id: generateId(),
        operationType: 'expiry_complete',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        targetType: 'near_expiry',
        targetId: id,
        remark,
        oldStatus: oldRecord.status,
        newStatus: 'completed',
        createdAt: new Date().toISOString()
      };
      return {
        nearExpiryRecords: updatedRecords,
        operationLogs: [newLog, ...state.operationLogs]
      };
    });
  },
}));

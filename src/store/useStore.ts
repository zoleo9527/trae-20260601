import { create } from 'zustand';
import {
  DetentionRecord,
  AppealRecord,
  DashboardStats,
  TodoItem,
  DetentionStatus,
  AppealStatus,
  StatusLog,
  UserRole,
} from '@/types';
import {
  mockDetentionRecords,
  mockAppealRecords,
  mockDashboardStats,
  mockTodoItems,
} from '@/data/mockData';
import { generateId } from '@/utils/format';

interface AppState {
  detentions: DetentionRecord[];
  appeals: AppealRecord[];
  stats: DashboardStats;
  todos: TodoItem[];
  currentUser: { name: string; role: UserRole };
  selectedDetentionId: string | null;
  selectedAppealId: string | null;

  setSelectedDetentionId: (id: string | null) => void;
  setSelectedAppealId: (id: string | null) => void;
  switchRole: (role: UserRole) => void;

  updateDetentionStatus: (
    id: string,
    newStatus: DetentionStatus,
    remark: string,
    operator: string,
    operatorRole: UserRole
  ) => void;

  adjustDetentionFee: (
    id: string,
    newFee: number,
    remark: string,
    operator: string,
    operatorRole: UserRole
  ) => void;

  updateAppealStatus: (
    id: string,
    newStatus: AppealStatus,
    processResult: string,
    processRemark: string,
    operator: string,
    operatorRole: UserRole
  ) => void;

  processAppealAndAdjustFee: (
    appealId: string,
    appealStatus: AppealStatus,
    newFee: number | null,
    processResult: string,
    processRemark: string,
    operator: string,
    operatorRole: UserRole
  ) => void;

  getNextPendingDetention: (currentId?: string) => DetentionRecord | undefined;
  getNextPendingAppeal: (currentId?: string) => AppealRecord | undefined;

  getDetentionById: (id: string) => DetentionRecord | undefined;
  getAppealById: (id: string) => AppealRecord | undefined;

  getRolePermissions: (role: UserRole) => {
    canConfirmDetention: boolean;
    canAdjustFee: boolean;
    canProcessAppeal: boolean;
    canViewAll: boolean;
    canRecordLoading: boolean;
  };
}

const roleUsers: Record<UserRole, { name: string; role: UserRole }> = {
  dispatcher: { name: '张明', role: 'dispatcher' },
  forklift_foreman: { name: '李强', role: 'forklift_foreman' },
  warehouse_clerk: { name: '王芳', role: 'warehouse_clerk' },
};

export const useStore = create<AppState>((set, get) => ({
  detentions: mockDetentionRecords,
  appeals: mockAppealRecords,
  stats: mockDashboardStats,
  todos: mockTodoItems,
  currentUser: { name: '王芳', role: 'warehouse_clerk' },
  selectedDetentionId: null,
  selectedAppealId: null,

  setSelectedDetentionId: (id) => set({ selectedDetentionId: id }),
  setSelectedAppealId: (id) => set({ selectedAppealId: id }),

  switchRole: (role) => {
    set({ currentUser: roleUsers[role] });
  },

  getRolePermissions: (role) => ({
    canConfirmDetention: role === 'dispatcher' || role === 'warehouse_clerk',
    canAdjustFee: role === 'warehouse_clerk',
    canProcessAppeal: role === 'warehouse_clerk',
    canViewAll: true,
    canRecordLoading: role === 'forklift_foreman' || role === 'dispatcher',
  }),

  updateDetentionStatus: (id, newStatus, remark, operator, operatorRole) => {
    set((state) => {
      const detentions = state.detentions.map((d) => {
        if (d.id === id) {
          const newLog: StatusLog = {
            id: generateId(),
            recordId: id,
            fromStatus: d.status,
            toStatus: newStatus,
            operator,
            operatorRole,
            operateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
            remark,
          };
          return {
            ...d,
            status: newStatus,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            confirmedBy: newStatus === 'confirmed' ? operator : d.confirmedBy,
            statusLogs: [...d.statusLogs, newLog],
          };
        }
        return d;
      });

      const appeals = state.appeals.map((a) => {
        if (a.detentionId === id) {
          return {
            ...a,
            detention: detentions.find((d) => d.id === id),
          };
        }
        return a;
      });

      return { detentions, appeals };
    });
  },

  adjustDetentionFee: (id, newFee, remark, operator, operatorRole) => {
    set((state) => {
      const detentions = state.detentions.map((d) => {
        if (d.id === id) {
          const newLog: StatusLog = {
            id: generateId(),
            recordId: id,
            fromStatus: d.status,
            toStatus: 'adjusted' as DetentionStatus,
            operator,
            operatorRole,
            operateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
            remark: `${remark}，费用从¥${d.feeAmount.toFixed(2)}调整为¥${newFee.toFixed(2)}`,
          };
          return {
            ...d,
            feeAmount: newFee,
            status: 'adjusted' as DetentionStatus,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            remark,
            statusLogs: [...d.statusLogs, newLog],
          };
        }
        return d;
      });

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const appeals = state.appeals.map((a) => {
        if (a.detentionId === id) {
          const newAppealLog: StatusLog = {
            id: generateId(),
            recordId: a.id,
            fromStatus: a.status,
            toStatus: a.status,
            operator,
            operatorRole,
            operateTime: now,
            remark: `关联滞留单费用已调整：从¥${a.detention?.feeAmount.toFixed(2)}调整为¥${newFee.toFixed(2)}`,
          };
          return {
            ...a,
            detention: detentions.find((d) => d.id === id),
            hasFeeUpdate: true,
            feeUpdatedAt: now,
            statusLogs: [...a.statusLogs, newAppealLog],
          };
        }
        return a;
      });

      return { detentions, appeals };
    });
  },

  updateAppealStatus: (id, newStatus, processResult, processRemark, operator, operatorRole) => {
    set((state) => {
      const appeals = state.appeals.map((a) => {
        if (a.id === id) {
          const newLog: StatusLog = {
            id: generateId(),
            recordId: id,
            fromStatus: a.status,
            toStatus: newStatus,
            operator,
            operatorRole,
            operateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
            remark: processRemark || processResult,
          };
          return {
            ...a,
            status: newStatus,
            processedBy: operator,
            processedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            processResult,
            processRemark,
            statusLogs: [...a.statusLogs, newLog],
          };
        }
        return a;
      });
      return { appeals };
    });
  },

  processAppealAndAdjustFee: (
    appealId,
    appealStatus,
    newFee,
    processResult,
    processRemark,
    operator,
    operatorRole
  ) => {
    set((state) => {
      const appeal = state.appeals.find((a) => a.id === appealId);
      if (!appeal) return state;

      let detentions = state.detentions;
      if (newFee !== null && appeal.detentionId) {
        detentions = state.detentions.map((d) => {
          if (d.id === appeal.detentionId) {
            const newLog: StatusLog = {
              id: generateId(),
              recordId: d.id,
              fromStatus: d.status,
              toStatus: 'adjusted' as DetentionStatus,
              operator,
              operatorRole,
              operateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              remark: `申诉处理：${processResult}，费用从¥${d.feeAmount.toFixed(2)}调整为¥${newFee.toFixed(2)}`,
            };
            return {
              ...d,
              feeAmount: newFee,
              status: 'adjusted' as DetentionStatus,
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              statusLogs: [...d.statusLogs, newLog],
            };
          }
          return d;
        });
      }

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const appeals = state.appeals.map((a) => {
        if (a.id === appealId) {
          const newLog: StatusLog = {
            id: generateId(),
            recordId: a.id,
            fromStatus: a.status,
            toStatus: appealStatus,
            operator,
            operatorRole,
            operateTime: now,
            remark: processRemark || processResult,
          };
          return {
            ...a,
            status: appealStatus,
            processedBy: operator,
            processedAt: now,
            processResult,
            processRemark,
            detention: detentions.find((d) => d.id === a.detentionId),
            hasFeeUpdate: newFee !== null,
            feeUpdatedAt: newFee !== null ? now : a.feeUpdatedAt,
            statusLogs: [...a.statusLogs, newLog],
          };
        }
        if (a.detentionId === appeal?.detentionId && newFee !== null) {
          return {
            ...a,
            detention: detentions.find((d) => d.id === a.detentionId),
          };
        }
        return a;
      });

      return { detentions, appeals };
    });
  },

  getNextPendingDetention: (currentId) => {
    const pendingList = get().detentions.filter(
      (d) => d.status === 'pending' && d.id !== currentId
    );
    return pendingList[0];
  },

  getNextPendingAppeal: (currentId) => {
    const pendingList = get().appeals.filter(
      (a) => (a.status === 'pending' || a.status === 'processing') && a.id !== currentId
    );
    return pendingList[0];
  },

  getDetentionById: (id) => get().detentions.find((d) => d.id === id),
  getAppealById: (id) => get().appeals.find((a) => a.id === id),
}));

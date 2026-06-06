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
  mockTodoItems,
} from '@/data/mockData';
import { generateId } from '@/utils/format';

interface AppState {
  detentions: DetentionRecord[];
  appeals: AppealRecord[];
  todos: TodoItem[];
  currentUser: { name: string; role: UserRole };
  selectedDetentionId: string | null;
  selectedAppealId: string | null;

  setSelectedDetentionId: (id: string | null) => void;
  setSelectedAppealId: (id: string | null) => void;
  switchRole: (role: UserRole) => void;

  getStats: () => DashboardStats;
  getRoleStats: (role: UserRole) => DashboardStats;
  getRoleTodos: () => TodoItem[];

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

  recordLoadingStart: (
    detentionId: string,
    operator: string,
    operatorRole: UserRole,
    remark?: string
  ) => void;

  recordLoadingEnd: (
    detentionId: string,
    operator: string,
    operatorRole: UserRole,
    remark?: string
  ) => void;

  recordLoadingException: (
    detentionId: string,
    operator: string,
    operatorRole: UserRole,
    exceptionRemark: string
  ) => void;

  getNextPendingDetention: (currentId?: string) => DetentionRecord | undefined;
  getNextPendingAppeal: (currentId?: string) => AppealRecord | undefined;
  getNextLoadingTask: (currentId?: string) => DetentionRecord | undefined;

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

const getTodayStr = () => new Date().toISOString().split('T')[0];

const createTodoFromDetention = (detention: DetentionRecord, type: TodoItem['type']): TodoItem | null => {
  const typeConfig: Record<TodoItem['type'], { title: string; desc: (d: DetentionRecord) => string }> = {
    detention_confirm: {
      title: '待确认滞留费用',
      desc: (d) => `订单${d.orderNo}，${d.plateNumber}，超时${d.detentionHours}小时，费用¥${d.feeAmount.toFixed(2)}`,
    },
    loading_record: {
      title: '待记录装卸时间',
      desc: (d) => `订单${d.orderNo}，${d.plateNumber}，月台${d.platformNo}`,
    },
    fee_adjust: {
      title: '待调整费用',
      desc: (d) => `订单${d.orderNo}，${d.plateNumber}，当前费用¥${d.feeAmount.toFixed(2)}`,
    },
    appeal_process: {
      title: '待处理申诉',
      desc: (d) => `订单${d.orderNo}，${d.plateNumber}`,
    },
    detention_review: {
      title: '待复核（有异常）',
      desc: (d) => `订单${d.orderNo}，${d.plateNumber}，异常：${d.exceptionRemark || '待查看'}`,
    },
  };

  const config = typeConfig[type];
  if (!config) return null;

  return {
    id: `todo_${detention.id}_${type}`,
    type,
    title: config.title,
    description: config.desc(detention),
    status: 'pending',
    createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    relatedId: detention.id,
  };
};

const createTodoFromAppeal = (appeal: AppealRecord): TodoItem => {
  return {
    id: `todo_${appeal.id}_appeal_process`,
    type: 'appeal_process',
    title: '待处理司机申诉',
    description: `订单${appeal.detention?.orderNo || appeal.detentionId}，${appeal.driverName}申请减免¥${appeal.requestedAdjustment.toFixed(2)}`,
    status: 'pending',
    createTime: appeal.submittedAt,
    relatedId: appeal.id,
  };
};

export const useStore = create<AppState>((set, get) => ({
  detentions: mockDetentionRecords,
  appeals: mockAppealRecords,
  todos: mockTodoItems,
  currentUser: { name: '王芳', role: 'warehouse_clerk' },
  selectedDetentionId: null,
  selectedAppealId: null,

  setSelectedDetentionId: (id) => set({ selectedDetentionId: id }),
  setSelectedAppealId: (id) => set({ selectedAppealId: id }),

  switchRole: (role) => {
    set({ currentUser: roleUsers[role] });
  },

  getStats: () => {
    const { detentions, appeals } = get();
    const todayStr = getTodayStr();

    const todayDetentions = detentions.filter((d) => d.createdAt.startsWith(todayStr));
    const pendingAppeals = appeals.filter((a) => a.status === 'pending' || a.status === 'processing');
    const totalFee = detentions.reduce((sum, d) => sum + d.feeAmount, 0);
    const pendingConfirmations = detentions.filter((d) => d.status === 'pending');

    return {
      todayDetentionCount: todayDetentions.length,
      pendingAppealCount: pendingAppeals.length,
      totalFeeAmount: totalFee,
      pendingConfirmationCount: pendingConfirmations.length,
    };
  },

  getRoleStats: (role: UserRole) => {
    const { detentions, appeals } = get();
    const todayStr = getTodayStr();

    const roleDetentions = detentions.filter((d) => {
      if (role === 'forklift_foreman') {
        return !d.endLoadingTime;
      }
      if (role === 'dispatcher') {
        return d.status === 'pending';
      }
      return true;
    });

    const todayDetentions = roleDetentions.filter((d) => d.createdAt.startsWith(todayStr));
    const totalFee = roleDetentions.reduce((sum, d) => sum + d.feeAmount, 0);

    const pendingConfirmationCount =
      role === 'dispatcher' || role === 'warehouse_clerk'
        ? detentions.filter((d) => d.status === 'pending').length
        : 0;

    const pendingLoadingCount =
      role === 'forklift_foreman' || role === 'dispatcher'
        ? detentions.filter((d) => !d.endLoadingTime && d.status === 'pending').length
        : 0;

    const pendingAppealCount =
      role === 'warehouse_clerk'
        ? appeals.filter((a) => a.status === 'pending' || a.status === 'processing').length
        : 0;

    const pendingReviewCount =
      role === 'warehouse_clerk' || role === 'dispatcher'
        ? detentions.filter((d) => d.hasException && d.status === 'pending').length
        : 0;

    if (role === 'forklift_foreman') {
      return {
        todayDetentionCount: todayDetentions.length,
        pendingAppealCount: detentions.filter((d) => d.hasException && !d.endLoadingTime).length,
        totalFeeAmount: totalFee,
        pendingConfirmationCount: pendingLoadingCount,
      };
    }

    if (role === 'dispatcher') {
      return {
        todayDetentionCount: todayDetentions.length,
        pendingAppealCount: pendingReviewCount,
        totalFeeAmount: totalFee,
        pendingConfirmationCount: pendingConfirmationCount,
      };
    }

    return {
      todayDetentionCount: todayDetentions.length,
      pendingAppealCount: pendingAppealCount,
      totalFeeAmount: totalFee,
      pendingConfirmationCount: pendingConfirmationCount + pendingReviewCount,
    };
  },

  getRoleTodos: () => {
    const { currentUser, detentions, appeals } = get();
    const role = currentUser.role;

    const todoList: TodoItem[] = [];

    detentions.forEach((d) => {
      if (role === 'dispatcher' || role === 'warehouse_clerk') {
        if (d.status === 'pending') {
          const todo = createTodoFromDetention(d, 'detention_confirm');
          if (todo) todoList.push(todo);
        }
      }
      if (role === 'forklift_foreman' || role === 'dispatcher') {
        if (d.status === 'pending' && !d.endLoadingTime) {
          const todo = createTodoFromDetention(d, 'loading_record');
          if (todo) todoList.push(todo);
        }
      }
      if (role === 'dispatcher' || role === 'warehouse_clerk') {
        if (d.hasException && d.status === 'pending') {
          const todo = createTodoFromDetention(d, 'detention_review');
          if (todo) todoList.push(todo);
        }
      }
      if (role === 'warehouse_clerk') {
        if (d.status === 'confirmed' && !d.feeConfirmed) {
          const todo = createTodoFromDetention(d, 'fee_adjust');
          if (todo) todoList.push(todo);
        }
      }
    });

    if (role === 'warehouse_clerk') {
      appeals.forEach((a) => {
        if (a.status === 'pending' || a.status === 'processing') {
          todoList.push(createTodoFromAppeal(a));
        }
      });
    }

    const seen = new Set<string>();
    const uniqueTodos = todoList.filter((todo) => {
      const key = `${todo.relatedId}-${todo.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueTodos.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
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
            feeConfirmed: newStatus === 'confirmed' ? true : d.feeConfirmed,
            hasException: newStatus === 'confirmed' ? false : d.hasException,
            exceptionRemark: newStatus === 'confirmed' ? undefined : d.exceptionRemark,
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

      const todos = state.todos.filter((t) => {
        if (t.relatedId === id && t.type === 'detention_confirm' && newStatus === 'confirmed') {
          return false;
        }
        return true;
      });

      return { detentions, appeals, todos };
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

      const todos = state.todos.filter((t) => {
        if (t.relatedId === id && t.type === 'fee_adjust') {
          return false;
        }
        return true;
      });

      return { detentions, appeals, todos };
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

      const todos = state.todos.filter((t) => {
        if (t.relatedId === id && t.type === 'appeal_process') {
          return false;
        }
        return true;
      });

      return { appeals, todos };
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

      const todos = state.todos.filter((t) => {
        if (t.relatedId === appealId && t.type === 'appeal_process') {
          return false;
        }
        if (t.relatedId === appeal.detentionId && t.type === 'fee_adjust') {
          return false;
        }
        return true;
      });

      return { detentions, appeals, todos };
    });
  },

  recordLoadingStart: (detentionId, operator, operatorRole, remark) => {
    set((state) => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const detentions = state.detentions.map((d) => {
        if (d.id === detentionId) {
          const newLog: StatusLog = {
            id: generateId(),
            recordId: detentionId,
            fromStatus: d.status,
            toStatus: d.status,
            operator,
            operatorRole,
            operateTime: now,
            remark: remark ? `开始装卸 - ${remark}` : '开始装卸作业',
          };
          return {
            ...d,
            startLoadingTime: now,
            updatedAt: now,
            statusLogs: [...d.statusLogs, newLog],
          };
        }
        return d;
      });

      const todos = state.todos.filter((t) => {
        if (t.relatedId === detentionId && t.type === 'loading_record') {
          return false;
        }
        return true;
      });

      return { detentions, todos };
    });
  },

  recordLoadingEnd: (detentionId, operator, operatorRole, remark) => {
    set((state) => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const detentions = state.detentions.map((d) => {
        if (d.id === detentionId) {
          const start = new Date(d.startLoadingTime).getTime();
          const end = new Date(now).getTime();
          const actualDurationMin = Math.round((end - start) / 60000);
          const detentionHours = Math.max(
            0,
            Math.round(((actualDurationMin - d.expectedDurationMin) / 60) * 100) / 100
          );
          const feeAmount = Math.round(detentionHours * 100 * 100) / 100;

          const newLog: StatusLog = {
            id: generateId(),
            recordId: detentionId,
            fromStatus: d.status,
            toStatus: d.status,
            operator,
            operatorRole,
            operateTime: now,
            remark: remark
              ? `结束装卸 - ${remark}，实际用时${actualDurationMin}分钟，超时${detentionHours}小时`
              : `结束装卸作业，实际用时${actualDurationMin}分钟，超时${detentionHours}小时`,
          };

          return {
            ...d,
            endLoadingTime: now,
            actualDurationMin,
            detentionHours,
            feeAmount: d.feeAmount === 0 ? feeAmount : d.feeAmount,
            originalFee: d.originalFee === 0 ? feeAmount : d.originalFee,
            updatedAt: now,
            statusLogs: [...d.statusLogs, newLog],
          };
        }
        return d;
      });

      return { detentions };
    });
  },

  recordLoadingException: (detentionId, operator, operatorRole, exceptionRemark) => {
    set((state) => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const detentions = state.detentions.map((d) => {
        if (d.id === detentionId) {
          const newLog: StatusLog = {
            id: generateId(),
            recordId: detentionId,
            fromStatus: d.status,
            toStatus: d.status,
            operator,
            operatorRole,
            operateTime: now,
            remark: `异常记录：${exceptionRemark}`,
          };
          return {
            ...d,
            hasException: true,
            exceptionRemark,
            exceptionReportedBy: operator,
            exceptionReportedAt: now,
            updatedAt: now,
            statusLogs: [...d.statusLogs, newLog],
          };
        }
        return d;
      });

      return { detentions };
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

  getNextLoadingTask: (currentId) => {
    const pendingList = get().detentions.filter(
      (d) => d.status === 'pending' && !d.endLoadingTime && d.id !== currentId
    );
    return pendingList[0];
  },

  getDetentionById: (id) => get().detentions.find((d) => d.id === id),
  getAppealById: (id) => get().appeals.find((a) => a.id === id),
}));

import { create } from 'zustand';
import { RefundApplication, ParentVisit, User, RefundStatus, VisitStatus, TimelineEvent } from '@/types';
import { mockRefunds, mockVisits, mockUsers } from '@/data/mockData';

interface AppState {
  refunds: RefundApplication[];
  visits: ParentVisit[];
  users: User[];
  currentUser: User;
  selectedRefundId: string | null;
  selectedVisitId: string | null;
  refundFilters: {
    status: RefundStatus | '全部';
    search: string;
    handler: string;
  };
  visitFilters: {
    status: VisitStatus | '全部';
    search: string;
    operator: string;
  };
  actions: {
    setCurrentUser: (user: User) => void;
    submitRefundForReview: (id: string, remark?: string) => void;
    setRefundFilters: (filters: Partial<AppState['refundFilters']>) => void;
    setVisitFilters: (filters: Partial<AppState['visitFilters']>) => void;
    selectRefund: (id: string | null) => void;
    selectVisit: (id: string | null) => void;
    approveRefund: (id: string, remark?: string) => void;
    rejectRefund: (id: string, reason: string) => void;
    returnRefund: (id: string, reason: string) => void;
    markRefundAnomaly: (id: string, reason: string) => void;
    addRefundRemark: (id: string, remark: string) => void;
    updateVisitStatus: (id: string, status: VisitStatus, result?: string, dissatisfaction?: string, needFollowUp?: boolean, followUpNote?: string) => void;
    addVisitRemark: (id: string, remark: string) => void;
    getFilteredRefunds: () => RefundApplication[];
    getFilteredVisits: () => ParentVisit[];
    getRefundById: (id: string) => RefundApplication | undefined;
    getVisitById: (id: string) => ParentVisit | undefined;
    getVisitsByRefundId: (refundId: string) => ParentVisit[];
  };
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateVisitId = () => 'VIS' + Math.random().toString(36).substr(2, 6).toUpperCase();

const now = () => new Date().toISOString();

const createAutoVisit = (refund: RefundApplication, operator: User, visitContent: string): ParentVisit => {
  return {
    id: generateVisitId(),
    refundId: refund.id,
    studentName: refund.studentName,
    className: refund.className,
    parentName: refund.parentName,
    parentPhone: refund.parentPhone,
    status: '待回访',
    visitContent,
    createdAt: now(),
    operator,
    needFollowUp: false,
    timeline: [
      {
        id: generateId(),
        eventType: '创建',
        operator,
        timestamp: now(),
        description: '系统自动生成回访任务',
      },
    ],
  };
};

export const useStore = create<AppState>((set, get) => ({
  refunds: mockRefunds,
  visits: mockVisits,
  users: mockUsers,
  currentUser: mockUsers[0],
  selectedRefundId: null,
  selectedVisitId: null,
  refundFilters: {
    status: '全部',
    search: '',
    handler: '',
  },
  visitFilters: {
    status: '全部',
    search: '',
    operator: '',
  },

  actions: {
    setCurrentUser: (user) => set({ currentUser: user }),

    submitRefundForReview: (id, remark) =>
      set((state) => {
        const currentUser = state.currentUser;
        const gradeDirector = state.users.find((u) => u.role === '年级主任') || state.users[1];
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '提交审核',
          operator: currentUser,
          timestamp: now(),
          description: `${currentUser.name}核实后提交年级主任审核`,
          remark,
        };
        return {
          refunds: state.refunds.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: '审核中',
                  updatedAt: now(),
                  currentHandler: gradeDirector,
                  historyHandlers: [...r.historyHandlers, currentUser],
                  timeline: [...r.timeline, newEvent],
                }
              : r
          ),
        };
      }),

    setRefundFilters: (filters) =>
      set((state) => ({
        refundFilters: { ...state.refundFilters, ...filters },
      })),

    setVisitFilters: (filters) =>
      set((state) => ({
        visitFilters: { ...state.visitFilters, ...filters },
      })),

    selectRefund: (id) => set({ selectedRefundId: id }),
    selectVisit: (id) => set({ selectedVisitId: id }),

    approveRefund: (id, remark) =>
      set((state) => {
        const currentUser = state.currentUser;
        const financeUser = state.users.find((u) => u.role === '财务') || state.users[2];
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '审核通过',
          operator: currentUser,
          timestamp: now(),
          description: `${currentUser.name}审核通过，移交财务处理`,
          remark,
        };
        return {
          refunds: state.refunds.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: '已通过',
                  updatedAt: now(),
                  currentHandler: financeUser,
                  historyHandlers: [...r.historyHandlers, currentUser],
                  timeline: [...r.timeline, newEvent],
                }
              : r
          ),
        };
      }),

    rejectRefund: (id, reason) =>
      set((state) => {
        const currentUser = state.currentUser;
        const refund = state.refunds.find((r) => r.id === id);
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '审核拒绝',
          operator: currentUser,
          timestamp: now(),
          description: `${currentUser.name}拒绝申请`,
          remark: reason,
        };

        const newVisit = refund
          ? createAutoVisit(refund, currentUser, `拒绝退费申请后的家长沟通回访 - 原因：${reason}`)
          : null;

        return {
          refunds: state.refunds.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: '已拒绝',
                  updatedAt: now(),
                  currentHandler: currentUser,
                  historyHandlers: [...r.historyHandlers, currentUser],
                  relatedVisitId: newVisit?.id || r.relatedVisitId,
                  timeline: [...r.timeline, newEvent],
                }
              : r
          ),
          visits: newVisit ? [...state.visits, newVisit] : state.visits,
        };
      }),

    returnRefund: (id, reason) =>
      set((state) => {
        const currentUser = state.currentUser;
        const refund = state.refunds.find((r) => r.id === id);
        const canteenAdmin = state.users.find((u) => u.role === '食堂管理员') || state.users[0];
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '退回',
          operator: currentUser,
          timestamp: now(),
          description: `${currentUser.name}退回申请，退回食堂管理员补充材料`,
          remark: reason,
        };

        const newVisit = refund
          ? createAutoVisit(refund, currentUser, `退回申请原因说明回访 - 原因：${reason}`)
          : null;

        return {
          refunds: state.refunds.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: '已退回',
                  updatedAt: now(),
                  currentHandler: canteenAdmin,
                  historyHandlers: [...r.historyHandlers, currentUser],
                  relatedVisitId: newVisit?.id || r.relatedVisitId,
                  timeline: [...r.timeline, newEvent],
                }
              : r
          ),
          visits: newVisit ? [...state.visits, newVisit] : state.visits,
        };
      }),

    markRefundAnomaly: (id, reason) =>
      set((state) => {
        const currentUser = state.currentUser;
        const refund = state.refunds.find((r) => r.id === id);
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '异常标记',
          operator: currentUser,
          timestamp: now(),
          description: '标记为异常',
          remark: reason,
        };

        const newVisit = refund
          ? createAutoVisit(refund, currentUser, `异常退费申请核实回访 - 原因：${reason}`)
          : null;

        return {
          refunds: state.refunds.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: '异常',
                  hasAnomaly: true,
                  anomalyReason: reason,
                  updatedAt: now(),
                  relatedVisitId: newVisit?.id || r.relatedVisitId,
                  timeline: [...r.timeline, newEvent],
                }
              : r
          ),
          visits: newVisit ? [...state.visits, newVisit] : state.visits,
        };
      }),

    addRefundRemark: (id, remark) =>
      set((state) => {
        const currentUser = state.currentUser;
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '备注',
          operator: currentUser,
          timestamp: now(),
          description: remark,
        };
        return {
          refunds: state.refunds.map((r) =>
            r.id === id
              ? {
                  ...r,
                  updatedAt: now(),
                  timeline: [...r.timeline, newEvent],
                }
              : r
          ),
        };
      }),

    updateVisitStatus: (id, status, result, dissatisfaction, needFollowUp = false, followUpNote) =>
      set((state) => {
        const currentUser = state.currentUser;
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '回访',
          operator: currentUser,
          timestamp: now(),
          description: `更新状态为：${status}`,
          remark: result,
        };
        return {
          visits: state.visits.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status,
                  visitResult: result || v.visitResult,
                  dissatisfaction: dissatisfaction || v.dissatisfaction,
                  visitTime: now(),
                  needFollowUp,
                  followUpNote: followUpNote || v.followUpNote,
                  timeline: [...v.timeline, newEvent],
                }
              : v
          ),
        };
      }),

    addVisitRemark: (id, remark) =>
      set((state) => {
        const currentUser = state.currentUser;
        const newEvent: TimelineEvent = {
          id: generateId(),
          eventType: '备注',
          operator: currentUser,
          timestamp: now(),
          description: remark,
        };
        return {
          visits: state.visits.map((v) =>
            v.id === id
              ? {
                  ...v,
                  timeline: [...v.timeline, newEvent],
                }
              : v
          ),
        };
      }),

    getFilteredRefunds: () => {
      const { refunds, refundFilters } = get();
      return refunds.filter((r) => {
        const matchStatus = refundFilters.status === '全部' || r.status === refundFilters.status;
        const matchSearch =
          !refundFilters.search ||
          r.studentName.includes(refundFilters.search) ||
          r.parentName.includes(refundFilters.search) ||
          r.id.includes(refundFilters.search) ||
          r.className.includes(refundFilters.search);
        const matchHandler = !refundFilters.handler || r.currentHandler.id === refundFilters.handler;
        return matchStatus && matchSearch && matchHandler;
      });
    },

    getFilteredVisits: () => {
      const { visits, visitFilters } = get();
      return visits.filter((v) => {
        const matchStatus = visitFilters.status === '全部' || v.status === visitFilters.status;
        const matchSearch =
          !visitFilters.search ||
          v.studentName.includes(visitFilters.search) ||
          v.parentName.includes(visitFilters.search) ||
          v.id.includes(visitFilters.search) ||
          v.refundId.includes(visitFilters.search) ||
          v.className.includes(visitFilters.search);
        const matchOperator = !visitFilters.operator || v.operator.id === visitFilters.operator;
        return matchStatus && matchSearch && matchOperator;
      });
    },

    getRefundById: (id) => get().refunds.find((r) => r.id === id),
    getVisitById: (id) => get().visits.find((v) => v.id === id),
    getVisitsByRefundId: (refundId) => get().visits.filter((v) => v.refundId === refundId),
  },
}));

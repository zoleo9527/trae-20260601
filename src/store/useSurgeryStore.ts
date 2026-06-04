import { create } from 'zustand';
import type {
  Surgery,
  SurgeryStatus,
  ExceptionRecord,
  StatusHistory,
  UserRole,
} from '@/types';
import { mockSurgeries, mockExceptions, mockTodoItems, mockUsers } from '@/data/mockData';

interface SurgeryStore {
  surgeries: Surgery[];
  exceptions: ExceptionRecord[];
  selectedSurgeryId: string | null;
  currentRole: UserRole;
  notification: { message: string; type: 'success' | 'error' | 'warning' } | null;

  getSelectedSurgery: () => Surgery | undefined;
  getStats: () => {
    totalSurgeries: number;
    pendingLens: number;
    pendingVerification: number;
    activeExceptions: number;
    completedToday: number;
    statusBreakdown: Record<SurgeryStatus, number>;
  };
  getTodos: () => typeof mockTodoItems;

  selectSurgery: (id: string | null) => void;
  setCurrentRole: (role: UserRole) => void;
  setNotification: (notification: { message: string; type: 'success' | 'error' | 'warning' } | null) => void;

  confirmLens: (surgeryId: string) => void;
  rejectLens: (surgeryId: string, reason: string) => void;
  submitConsumption: (surgeryId: string) => void;
  verifyConsumption: (surgeryId: string) => void;
  rejectConsumption: (surgeryId: string, reason: string) => void;
  triggerException: (surgeryId: string, type: string, title: string, description: string) => void;
  resolveException: (exceptionId: string, resolution: string) => void;
}

const getCurrentUser = (role: UserRole) => {
  return mockUsers.find((u) => u.role === role) || mockUsers[0];
};

const addStatusHistory = (
  surgery: Surgery,
  status: SurgeryStatus,
  role: UserRole,
  remark?: string
): StatusHistory => {
  const user = getCurrentUser(role);
  return {
    id: `h${Date.now()}`,
    surgeryId: surgery.id,
    status,
    operatorId: user.id,
    operatorName: user.name,
    operatorRole: user.role,
    timestamp: new Date().toISOString(),
    remark,
  };
};

export const useSurgeryStore = create<SurgeryStore>((set, get) => ({
  surgeries: mockSurgeries,
  exceptions: mockExceptions,
  selectedSurgeryId: null,
  currentRole: 'admin',
  notification: null,

  getSelectedSurgery: () => {
    const { surgeries, selectedSurgeryId } = get();
    return surgeries.find((s) => s.id === selectedSurgeryId);
  },

  getStats: () => {
    const { surgeries, exceptions } = get();
    const today = new Date().toDateString();

    const statusBreakdown = surgeries.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      },
      {} as Record<SurgeryStatus, number>
    );

    return {
      totalSurgeries: surgeries.length,
      pendingLens: surgeries.filter((s) => s.status === 'lens_pending').length,
      pendingVerification: surgeries.filter((s) => s.status === 'verifying').length,
      activeExceptions: exceptions.filter((e) => e.status !== 'resolved').length,
      completedToday: surgeries.filter(
        (s) =>
          s.status === 'completed' &&
          new Date(s.scheduledTime).toDateString() === today
      ).length,
      statusBreakdown: statusBreakdown as Record<SurgeryStatus, number>,
    };
  },

  getTodos: () => mockTodoItems,

  selectSurgery: (id) => set({ selectedSurgeryId: id }),

  setCurrentRole: (role) => set({ currentRole: role }),

  setNotification: (notification) => set({ notification }),

  confirmLens: (surgeryId) =>
    set((state) => {
      const user = getCurrentUser(state.currentRole);
      const surgeries = state.surgeries.map((s) => {
        if (s.id === surgeryId) {
          return {
            ...s,
            status: 'lens_confirmed' as SurgeryStatus,
            lensReservation: s.lensReservation
              ? {
                  ...s.lensReservation,
                  status: 'confirmed' as const,
                  confirmedBy: user.id,
                  confirmedAt: new Date().toISOString(),
                }
              : undefined,
            statusHistory: [
              ...s.statusHistory,
              addStatusHistory(s, 'lens_confirmed', state.currentRole, '晶体预留已确认'),
            ],
          };
        }
        return s;
      });
      return {
        surgeries,
        notification: { message: '晶体预留已确认', type: 'success' },
      };
    }),

  rejectLens: (surgeryId, reason) =>
    set((state) => {
      const surgeries = state.surgeries.map((s) => {
        if (s.id === surgeryId) {
          return {
            ...s,
            status: 'exception' as SurgeryStatus,
            lensReservation: s.lensReservation
              ? {
                  ...s.lensReservation,
                  status: 'rejected' as const,
                  rejectedReason: reason,
                }
              : undefined,
            statusHistory: [
              ...s.statusHistory,
              addStatusHistory(s, 'exception', state.currentRole, `晶体预留被退回：${reason}`),
            ],
            exceptions: [
              ...s.exceptions,
              {
                id: `e${Date.now()}`,
                surgeryId: s.id,
                type: 'lens_mismatch' as const,
                level: 'high' as const,
                status: 'pending' as const,
                title: '晶体预留被退回',
                description: reason,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return s;
      });

      const newException = surgeries
        .find((s) => s.id === surgeryId)
        ?.exceptions.find((e) => e.id.startsWith(`e${Date.now().toString().slice(0, -3)}`));

      return {
        surgeries,
        exceptions: newException
          ? [...state.exceptions, newException]
          : state.exceptions,
        notification: { message: '晶体预留已退回，异常已生成', type: 'warning' },
      };
    }),

  submitConsumption: (surgeryId) =>
    set((state) => {
      const surgeries = state.surgeries.map((s) => {
        if (s.id === surgeryId) {
          return {
            ...s,
            status: 'verifying' as SurgeryStatus,
            materialConsumption: s.materialConsumption
              ? {
                  ...s.materialConsumption,
                  status: 'submitted' as const,
                  submittedAt: new Date().toISOString(),
                }
              : undefined,
            statusHistory: [
              ...s.statusHistory,
              addStatusHistory(s, 'verifying', state.currentRole, '耗材核销已提交'),
            ],
          };
        }
        return s;
      });
      return {
        surgeries,
        notification: { message: '耗材核销已提交', type: 'success' },
      };
    }),

  verifyConsumption: (surgeryId) =>
    set((state) => {
      const user = getCurrentUser(state.currentRole);
      const surgeries = state.surgeries.map((s) => {
        if (s.id === surgeryId) {
          return {
            ...s,
            status: 'completed' as SurgeryStatus,
            materialConsumption: s.materialConsumption
              ? {
                  ...s.materialConsumption,
                  status: 'verified' as const,
                  verifiedAt: new Date().toISOString(),
                  verifiedBy: user.id,
                }
              : undefined,
            statusHistory: [
              ...s.statusHistory,
              addStatusHistory(s, 'completed', state.currentRole, '核销复核通过，手术流程完成'),
            ],
          };
        }
        return s;
      });
      return {
        surgeries,
        notification: { message: '核销复核通过，流程已完成', type: 'success' },
      };
    }),

  rejectConsumption: (surgeryId, reason) =>
    set((state) => {
      const surgeries = state.surgeries.map((s) => {
        if (s.id === surgeryId) {
          return {
            ...s,
            materialConsumption: s.materialConsumption
              ? {
                  ...s.materialConsumption,
                  status: 'rejected' as const,
                  rejectedReason: reason,
                }
              : undefined,
            statusHistory: [
              ...s.statusHistory,
              addStatusHistory(s, s.status, state.currentRole, `核销被退回：${reason}`),
            ],
          };
        }
        return s;
      });
      return {
        surgeries,
        notification: { message: '核销已退回，请修正后重新提交', type: 'warning' },
      };
    }),

  triggerException: (surgeryId, type, title, description) =>
    set((state) => {
      const newException: ExceptionRecord = {
        id: `e${Date.now()}`,
        surgeryId,
        type: type as ExceptionRecord['type'],
        level: 'high',
        status: 'pending',
        title,
        description,
        createdAt: new Date().toISOString(),
      };

      const surgeries = state.surgeries.map((s) => {
        if (s.id === surgeryId) {
          return {
            ...s,
            status: 'exception' as SurgeryStatus,
            exceptions: [...s.exceptions, newException],
            statusHistory: [
              ...s.statusHistory,
              addStatusHistory(s, 'exception', state.currentRole, `异常触发：${title}`),
            ],
          };
        }
        return s;
      });

      return {
        surgeries,
        exceptions: [...state.exceptions, newException],
        notification: { message: '异常已触发，请及时处理', type: 'error' },
      };
    }),

  resolveException: (exceptionId, resolution) =>
    set((state) => {
      const user = getCurrentUser(state.currentRole);
      const exceptions = state.exceptions.map((e) => {
        if (e.id === exceptionId) {
          return {
            ...e,
            status: 'resolved' as const,
            handlerId: user.id,
            handlerName: user.name,
            resolvedAt: new Date().toISOString(),
            resolution,
          };
        }
        return e;
      });

      const exception = state.exceptions.find((e) => e.id === exceptionId);
      let surgeries = state.surgeries;

      if (exception) {
        surgeries = state.surgeries.map((s) => {
          if (s.id === exception.surgeryId) {
            const hasUnresolved = s.exceptions.some(
              (e) => e.id !== exceptionId && e.status !== 'resolved'
            );
            return {
              ...s,
              status: hasUnresolved ? 'exception' : 'applying',
              exceptions: s.exceptions.map((e) =>
                e.id === exceptionId
                  ? { ...e, status: 'resolved' as const, resolution }
                  : e
              ),
              statusHistory: [
                ...s.statusHistory,
                addStatusHistory(
                  s,
                  hasUnresolved ? 'exception' : 'applying',
                  state.currentRole,
                  `异常已解决：${resolution}`
                ),
              ],
            };
          }
          return s;
        });
      }

      return {
        surgeries,
        exceptions,
        notification: { message: '异常已解决', type: 'success' },
      };
    }),
}));

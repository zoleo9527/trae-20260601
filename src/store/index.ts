import { mockCoaches, mockRecords, mockVenues } from '@/data/mockData';
import type {
    ActionHistory,
    Coach,
    RecordStatus,
    RejectReason,
    ResponsibilityFlag,
    ScheduleRecord,
    UserRole,
    Venue
} from '@/types';
import { create } from 'zustand';

interface AppState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  
  records: ScheduleRecord[];
  coaches: Coach[];
  venues: Venue[];
  
  selectedRecordIds: string[];
  activeRecordId: string | null;
  showDetailPanel: boolean;
  
  filterStatus: RecordStatus | 'all';
  
  setSelectedRecords: (ids: string[]) => void;
  setActiveRecord: (id: string | null) => void;
  setShowDetailPanel: (show: boolean) => void;
  setFilterStatus: (status: RecordStatus | 'all') => void;
  
  addHistory: (recordId: string, operator: UserRole, operatorName: string, action: string, remark?: string) => void;
  
  confirmRecord: (recordId: string, coachRemark?: string) => void;
  rejectRecord: (recordId: string, reason: RejectReason, remark: string) => void;
  addReceptionRemark: (recordId: string, remark: string) => void;
  escalateToManager: (recordId: string, remark: string) => void;
  resolveDispute: (recordId: string, responsibility: ResponsibilityFlag, remark: string) => void;
  resubmitRecord: (recordId: string) => void;
  batchConfirm: (recordIds: string[]) => void;
  batchMarkResponsibility: (recordIds: string[], flag: ResponsibilityFlag) => void;
  
  simulateOverdue: (recordId: string) => void;
  simulateDispute: (recordId: string) => void;
  simulateDataInconsistency: (recordId: string) => void;
  
  getTodoCount: () => number;
  getFilteredRecords: () => ScheduleRecord[];
  getAlerts: () => ScheduleRecord[];
}

const getOperatorName = (role: UserRole): string => {
  switch (role) {
    case 'reception': return '前台小王';
    case 'coach': return '当前教练';
    case 'manager': return '值班店长';
  }
};

export const useStore = create<AppState>((set, get) => ({
  currentRole: 'reception',
  setCurrentRole: (role) => set({ currentRole: role }),
  
  records: mockRecords,
  coaches: mockCoaches,
  venues: mockVenues,
  
  selectedRecordIds: [],
  activeRecordId: null,
  showDetailPanel: false,
  
  filterStatus: 'all',
  
  setSelectedRecords: (ids) => set({ selectedRecordIds: ids }),
  setActiveRecord: (id) => set({ activeRecordId: id, showDetailPanel: id !== null }),
  setShowDetailPanel: (show) => set({ showDetailPanel: show }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  
  addHistory: (recordId, operator, operatorName, action, remark) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          const historyItem: ActionHistory = {
            id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            operator,
            operatorName,
            action,
            remark
          };
          return {
            ...r,
            history: [...r.history, historyItem],
            updatedAt: Date.now()
          };
        }
        return r;
      })
    }));
  },
  
  confirmRecord: (recordId, coachRemark) => {
    const { currentRole, addHistory } = get();
    addHistory(recordId, currentRole, getOperatorName(currentRole), '确认课时完成', coachRemark);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'completed' as RecordStatus,
            confirmedAt: Date.now(),
            confirmedBy: currentRole,
            coachRemark: coachRemark || r.coachRemark,
            isOverdue: false
          };
        }
        return r;
      })
    }));
  },
  
  rejectRecord: (recordId, reason, remark) => {
    const { currentRole, addHistory } = get();
    addHistory(recordId, currentRole, getOperatorName(currentRole), '退回记录', remark);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          const newRejectCount = r.rejectCount + 1;
          const hasRisk = newRejectCount >= 2 || !!(r.receptionRemark && remark);
          return {
            ...r,
            status: 'pending_reception_handle' as RecordStatus,
            rejectedAt: Date.now(),
            rejectedBy: currentRole,
            rejectReason: reason,
            rejectRemark: remark,
            coachRemark: remark,
            rejectCount: newRejectCount,
            hasResponsibilityRisk: hasRisk,
            isOverdue: false
          };
        }
        return r;
      })
    }));
  },
  
  addReceptionRemark: (recordId, remark) => {
    const { currentRole, addHistory } = get();
    addHistory(recordId, currentRole, getOperatorName(currentRole), '补充前台备注', remark);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          const hasRisk = r.rejectCount >= 2 || !!(r.coachRemark && remark);
          return {
            ...r,
            receptionRemark: remark,
            hasResponsibilityRisk: hasRisk
          };
        }
        return r;
      })
    }));
  },
  
  escalateToManager: (recordId, remark) => {
    const { currentRole, addHistory } = get();
    addHistory(recordId, currentRole, getOperatorName(currentRole), '提交店长仲裁', remark);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'pending_manager_audit' as RecordStatus,
            hasResponsibilityRisk: true,
            responsibility: 'unclear' as ResponsibilityFlag
          };
        }
        return r;
      })
    }));
  },
  
  resolveDispute: (recordId, responsibility, remark) => {
    const { currentRole, addHistory } = get();
    addHistory(recordId, currentRole, getOperatorName(currentRole), '仲裁完成', remark);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'disputed' as RecordStatus,
            responsibility,
            responsibilityRemark: remark,
            hasResponsibilityRisk: false
          };
        }
        return r;
      })
    }));
  },
  
  resubmitRecord: (recordId) => {
    const { currentRole, addHistory } = get();
    addHistory(recordId, currentRole, getOperatorName(currentRole), '重新提交确认');
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'pending_coach_confirm' as RecordStatus,
            rejectReason: undefined,
            rejectRemark: undefined
          };
        }
        return r;
      })
    }));
  },
  
  batchConfirm: (recordIds) => {
    const { currentRole, addHistory } = get();
    recordIds.forEach((id) => {
      addHistory(id, currentRole, getOperatorName(currentRole), '批量确认课时完成');
    });
    set((state) => ({
      records: state.records.map((r) => {
        if (recordIds.includes(r.id)) {
          return {
            ...r,
            status: 'completed' as RecordStatus,
            confirmedAt: Date.now(),
            confirmedBy: currentRole,
            isOverdue: false
          };
        }
        return r;
      }),
      selectedRecordIds: []
    }));
  },
  
  batchMarkResponsibility: (recordIds, flag) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (recordIds.includes(r.id)) {
          return {
            ...r,
            responsibility: flag,
            hasResponsibilityRisk: flag !== 'none' ? false : r.hasResponsibilityRisk
          };
        }
        return r;
      }),
      selectedRecordIds: []
    }));
  },
  
  simulateOverdue: (recordId) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            isOverdue: true,
            createdAt: Date.now() - 40 * 60 * 1000
          };
        }
        return r;
      })
    }));
  },
  
  simulateDispute: (recordId) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'pending_manager_audit' as RecordStatus,
            hasResponsibilityRisk: true,
            responsibility: 'unclear' as ResponsibilityFlag,
            rejectCount: 2,
            receptionRemark: '前台说：教练没有按时到场',
            coachRemark: '教练说：前台排课时间错误'
          };
        }
        return r;
      })
    }));
  },
  
  simulateDataInconsistency: (recordId) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            hasResponsibilityRisk: true,
            receptionRemark: '系统记录：学员已签到',
            coachRemark: '实际：学员未到场'
          };
        }
        return r;
      })
    }));
  },
  
  getTodoCount: () => {
    const { records, currentRole } = get();
    return records.filter((r) => {
      if (r.status === 'completed') return false;
      if (currentRole === 'coach') return r.status === 'pending_coach_confirm';
      if (currentRole === 'reception') return r.status === 'pending_reception_handle';
      if (currentRole === 'manager') return r.status === 'pending_manager_audit' || r.status === 'disputed';
      return false;
    }).length;
  },
  
  getFilteredRecords: () => {
    const { records, filterStatus, currentRole } = get();
    return records.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (currentRole === 'coach') {
        return r.status === 'pending_coach_confirm' || r.status === 'completed';
      }
      return true;
    }).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.hasResponsibilityRisk && !b.hasResponsibilityRisk) return -1;
      if (!a.hasResponsibilityRisk && b.hasResponsibilityRisk) return 1;
      return b.createdAt - a.createdAt;
    });
  },
  
  getAlerts: () => {
    const { records } = get();
    return records.filter((r) => r.isOverdue || r.hasResponsibilityRisk || r.status === 'pending_manager_audit');
  }
}));

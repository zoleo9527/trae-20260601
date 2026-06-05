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
  adjustSchedule: (recordId: string, updates: {
    coachId?: string;
    coachName?: string;
    venueId?: string;
    venueName?: string;
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
  }) => void;
  batchConfirm: (recordIds: string[]) => void;
  batchMarkResponsibility: (recordIds: string[], flag: ResponsibilityFlag) => void;
  
  simulateOverdue: (recordId: string) => void;
  simulateDispute: (recordId: string) => void;
  simulateDataInconsistency: (recordId: string) => void;
  
  getTodoCount: () => number;
  getFilteredRecords: () => ScheduleRecord[];
  getAlerts: () => ScheduleRecord[];
  getVisibleRecordIds: () => string[];
}

export { getVisibleStatuses, isRecordVisible };

const getOperatorName = (role: UserRole): string => {
  switch (role) {
    case 'reception': return '前台小王';
    case 'coach': return '当前教练';
    case 'manager': return '值班店长';
  }
};

const getVisibleStatuses = (role: UserRole, filterStatus: RecordStatus | 'all'): RecordStatus[] => {
  if (filterStatus !== 'all') {
    return [filterStatus];
  }
  switch (role) {
    case 'coach':
      return ['pending_coach_confirm'];
    case 'reception':
      return ['pending_reception_handle'];
    case 'manager':
      return ['pending_manager_audit', 'disputed'];
    default:
      return [];
  }
};

const isRecordVisible = (record: ScheduleRecord, role: UserRole, filterStatus: RecordStatus | 'all'): boolean => {
  const visibleStatuses = getVisibleStatuses(role, filterStatus);
  return visibleStatuses.includes(record.status);
};

export const useStore = create<AppState>((set, get) => ({
  currentRole: 'reception',
  setCurrentRole: (role) => set({ 
    currentRole: role, 
    filterStatus: 'all',
    selectedRecordIds: [],
    activeRecordId: null,
    showDetailPanel: false
  }),
  
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
    addHistory(recordId, currentRole, getOperatorName(currentRole), '仲裁完成并归档', remark);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'completed' as RecordStatus,
            responsibility,
            responsibilityRemark: remark,
            hasResponsibilityRisk: false,
            confirmedAt: Date.now(),
            confirmedBy: currentRole,
            isOverdue: false
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
            status: 'pending_coach_confirm' as RecordStatus
          };
        }
        return r;
      })
    }));
  },
  
  adjustSchedule: (recordId, updates) => {
    const { currentRole, addHistory, coaches, venues } = get();
    
    let changeDesc: string[] = [];
    if (updates.coachId || updates.coachName) {
      const coachName = updates.coachName || coaches.find(c => c.id === updates.coachId)?.name || '';
      changeDesc.push(`教练调整为${coachName}`);
    }
    if (updates.venueId || updates.venueName) {
      const venueName = updates.venueName || venues.find(v => v.id === updates.venueId)?.name || '';
      changeDesc.push(`场地调整为${venueName}`);
    }
    if (updates.scheduledDate || updates.startTime || updates.endTime) {
      changeDesc.push('时间已调整');
    }
    
    addHistory(recordId, currentRole, getOperatorName(currentRole), `排班调整：${changeDesc.join('，')}`);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            ...updates,
            status: 'pending_coach_confirm' as RecordStatus,
            isOverdue: false,
            updatedAt: Date.now()
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
    return records.filter((r) => isRecordVisible(r, currentRole, 'all')).length;
  },
  
  getFilteredRecords: () => {
    const { records, filterStatus, currentRole } = get();
    return records
      .filter((r) => isRecordVisible(r, currentRole, filterStatus))
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.hasResponsibilityRisk && !b.hasResponsibilityRisk) return -1;
        if (!a.hasResponsibilityRisk && b.hasResponsibilityRisk) return 1;
        return b.createdAt - a.createdAt;
      });
  },
  
  getVisibleRecordIds: () => {
    const { records, filterStatus, currentRole } = get();
    return records.filter((r) => isRecordVisible(r, currentRole, filterStatus)).map((r) => r.id);
  },
  
  getAlerts: () => {
    const { records } = get();
    return records.filter((r) => r.isOverdue || r.hasResponsibilityRisk || r.status === 'pending_manager_audit');
  }
}));

import { create } from 'zustand';
import { RenewalFollowUp, RenewalStatus, FollowUpRecord } from '@/types';
import { mockRenewals } from '@/data/renewals';
import { generateId } from '@/utils/date';

interface RenewalState {
  renewalList: RenewalFollowUp[];
  selectedRenewalId: string | null;
  selectedIds: string[];
  filterStatus: RenewalStatus | 'all';
  searchQuery: string;
  sortBy: 'expirationDate' | 'riskLevel';

  getRenewalById: (id: string) => RenewalFollowUp | undefined;
  getRenewalByStudentId: (studentId: string) => RenewalFollowUp | undefined;
  setSelectedRenewalId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectId: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilterStatus: (status: RenewalStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'expirationDate' | 'riskLevel') => void;
  
  updateRenewalStatus: (id: string, status: RenewalStatus) => void;
  batchUpdateStatus: (ids: string[], status: RenewalStatus) => void;
  
  addFollowUpRecord: (renewalId: string, record: Omit<FollowUpRecord, 'id'>) => void;
  batchAddFollowUp: (ids: string[], record: Omit<FollowUpRecord, 'id'>) => void;

  syncKeyInsightsFromFeedback: (renewalId: string) => void;

  getFilteredRenewals: () => RenewalFollowUp[];
  getPendingCount: () => number;
  getHighRiskCount: () => number;
  getSignedCount: () => number;
}

export const useRenewalStore = create<RenewalState>((set, get) => ({
  renewalList: mockRenewals,
  selectedRenewalId: null,
  selectedIds: [],
  filterStatus: 'all',
  searchQuery: '',
  sortBy: 'expirationDate',

  getRenewalById: (id) => {
    return get().renewalList.find(r => r.id === id);
  },

  getRenewalByStudentId: (studentId) => {
    return get().renewalList
      .filter(r => r.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  },

  setSelectedRenewalId: (id) => set({ selectedRenewalId: id }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelectId: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id],
    }));
  },

  selectAll: () => {
    const filtered = get().getFilteredRenewals();
    set({ selectedIds: filtered.map(r => r.id) });
  },

  clearSelection: () => set({ selectedIds: [] }),

  setFilterStatus: (status) => {
    set({ filterStatus: status, selectedIds: [] });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query, selectedIds: [] });
  },

  setSortBy: (sortBy) => set({ sortBy }),

  updateRenewalStatus: (id, status) => {
    const now = new Date().toISOString();
    set(state => ({
      renewalList: state.renewalList.map(r =>
        r.id === id
          ? { ...r, status, updatedAt: now }
          : r
      ),
    }));
  },

  batchUpdateStatus: (ids, status) => {
    const now = new Date().toISOString();
    const { getStudentById } = useStudentStore.getState();
    const { addLog } = useOperationLogStore.getState();
    
    set(state => {
      const updatedRenewals = state.renewalList.map(r => {
        if (ids.includes(r.id)) {
          const student = getStudentById(r.studentId);
          addLog({
            type: 'renewal',
            targetId: r.id,
            targetName: student?.name || '',
            action: '批量更新状态',
            operator: '课程顾问-小张',
            details: `续费状态批量更新为${status === 'contacted' ? '已联系' : status === 'negotiating' ? '洽谈中' : status === 'signed' ? '已续费' : status === 'lost' ? '已流失' : '待跟进'}`,
          });
          return { ...r, status, updatedAt: now };
        }
        return r;
      });
      
      return {
        renewalList: updatedRenewals,
        selectedIds: [],
      };
    });
  },

  addFollowUpRecord: (renewalId, record) => {
    const now = new Date().toISOString();
    const newRecord: FollowUpRecord = {
      ...record,
      id: generateId('fu'),
    };
    set(state => ({
      renewalList: state.renewalList.map(r =>
        r.id === renewalId
          ? {
              ...r,
              followUpRecords: [...r.followUpRecords, newRecord],
              updatedAt: now,
            }
          : r
      ),
    }));
  },

  batchAddFollowUp: (ids, record) => {
    const now = new Date().toISOString();
    set(state => ({
      renewalList: state.renewalList.map(r => {
        if (ids.includes(r.id)) {
          const newRecord: FollowUpRecord = {
            ...record,
            id: generateId('fu'),
          };
          return {
            ...r,
            followUpRecords: [...r.followUpRecords, newRecord],
            updatedAt: now,
          };
        }
        return r;
      }),
      selectedIds: [],
    }));
  },

  syncKeyInsightsFromFeedback: (renewalId) => {
    const now = new Date().toISOString();
    const renewal = get().getRenewalById(renewalId);
    if (!renewal) return;

    const { getFeedbackByStudentId } = useFeedbackStore.getState();
    const feedbackList = getFeedbackByStudentId(renewal.studentId);

    const recentTags: string[] = [];
    const tagCount = new Map<string, number>();

    feedbackList.slice(0, 5).forEach(fb => {
      fb.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    const sortedTags = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    const { addLog } = useOperationLogStore.getState();
    const { getStudentById } = useStudentStore.getState();
    const student = getStudentById(renewal.studentId);

    addLog({
      type: 'renewal',
      targetId: renewalId,
      targetName: student?.name || '',
      action: '同步关键判断',
      operator: '系统',
      details: `从课堂反馈同步了 ${sortedTags.length} 个关键判断标签`,
    });

    set(state => ({
      renewalList: state.renewalList.map(r =>
        r.id === renewalId
          ? { ...r, keyInsights: sortedTags, updatedAt: now }
          : r
      ),
    }));
  },

  getFilteredRenewals: () => {
    const { renewalList, filterStatus, searchQuery, sortBy } = get();
    const { getStudentById } = useStudentStore.getState();
    
    let filtered = [...renewalList];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const student = getStudentById(r.studentId);
        return (
          student?.name.toLowerCase().includes(query) ||
          student?.className.toLowerCase().includes(query) ||
          r.packageType.toLowerCase().includes(query) ||
          r.keyInsights.some(k => k.toLowerCase().includes(query))
        );
      });
    }
    
    if (sortBy === 'expirationDate') {
      filtered.sort((a, b) => a.remainingDays - b.remainingDays);
    } else {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      filtered.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    }
    
    return filtered;
  },

  getPendingCount: () => {
    return get().renewalList.filter(r => r.status === 'pending').length;
  },

  getHighRiskCount: () => {
    return get().renewalList.filter(r => r.riskLevel === 'high' && r.status !== 'signed' && r.status !== 'lost').length;
  },

  getSignedCount: () => {
    return get().renewalList.filter(r => r.status === 'signed').length;
  },
}));

import { useStudentStore } from './useStudentStore';
import { useOperationLogStore } from './useOperationLogStore';
import { useFeedbackStore } from './useFeedbackStore';

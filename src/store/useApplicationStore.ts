import { create } from 'zustand';
import type { Application, ApplicationStatus } from '../types';
import { mockApplications } from '../data/mockData';

interface ApplicationState {
  applications: Application[];
  selectedId: string | null;
  filter: ApplicationStatus | 'all';
  searchQuery: string;
  setSelectedId: (id: string | null) => void;
  setFilter: (filter: ApplicationStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  getApplicationById: (id: string) => Application | undefined;
  getFilteredApplications: () => Application[];
  getStats: () => {
    pending: number;
    correction: number;
    approved: number;
    archived: number;
  };
  saveExceptionNote: (id: string, exceptionNote: string) => void;
  approveApplication: (id: string, remark: string, exceptionNote?: string) => void;
  sendCorrection: (
    id: string,
    items: { materialName: string; reason: string; priority: 'high' | 'medium' | 'low' }[],
    remark: string,
    exceptionNote?: string
  ) => void;
  rejectApplication: (id: string, remark: string, exceptionNote?: string) => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: mockApplications,
  selectedId: null,
  filter: 'all',
  searchQuery: '',

  setSelectedId: (id) => set({ selectedId: id }),

  setFilter: (filter) => set({ filter }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  getApplicationById: (id) => {
    return get().applications.find((a) => a.id === id);
  },

  getFilteredApplications: () => {
    const { applications, filter, searchQuery } = get();
    let filtered = applications;

    if (filter !== 'all') {
      filtered = filtered.filter((a) => a.status === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(query) ||
          a.appointmentNo.toLowerCase().includes(query) ||
          a.applicationType.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      if (a.status === 'correction' && b.status !== 'correction') return -1;
      if (b.status === 'correction' && a.status !== 'correction') return 1;
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });
  },

  getStats: () => {
    const { applications } = get();
    return {
      pending: applications.filter((a) => a.status === 'pending').length,
      correction: applications.filter((a) => a.status === 'correction').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      archived: applications.filter((a) => a.status === 'archived').length,
    };
  },

  saveExceptionNote: (id, exceptionNote) => {
    set((state) => {
      const updated = state.applications.map((app) => {
        if (app.id !== id) return app;
        const finalExceptionNote = exceptionNote.trim();
        return {
          ...app,
          exceptionNote: finalExceptionNote.length > 0 ? finalExceptionNote : undefined,
        };
      });
      return { applications: updated };
    });
  },

  approveApplication: (id, remark, exceptionNote) => {
    set((state) => {
      const now = new Date().toLocaleString('zh-CN', { hour12: false });
      const updated = state.applications.map((app) => {
        if (app.id !== id) return app;
        const isCorrected = app.correctionNotices.length > 0;
        const finalExceptionNote = exceptionNote?.trim() || app.exceptionNote;
        const newRecords = [
          ...app.reviewRecords,
          {
            id: `r-${Date.now()}`,
            stage: isCorrected ? ('final_approve' as const) : ('review' as const),
            reviewer: '当前公证员',
            reviewTime: now,
            result: 'pass' as const,
            remark,
          },
          {
            id: `r-archive-${Date.now()}`,
            stage: 'archive' as const,
            reviewer: '系统',
            reviewTime: now,
            result: 'archive' as const,
            remark: '自动归档',
          },
        ];
        return {
          ...app,
          status: 'archived' as const,
          reviewRecords: newRecords,
          archiveNo: `DA-GZ-2026-${Math.floor(Math.random() * 10000)}`,
          archivedAt: now,
          exceptionNote: finalExceptionNote && finalExceptionNote.length > 0 ? finalExceptionNote : undefined,
        };
      });
      return { applications: updated };
    });
  },

  sendCorrection: (id, items, remark, exceptionNote) => {
    set((state) => {
      const now = new Date().toLocaleString('zh-CN', { hour12: false });
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      const deadlineStr = deadline.toLocaleString('zh-CN', { hour12: false });

      const updated = state.applications.map((app) => {
        if (app.id !== id) return app;
        const reviewRecordId = `r-${Date.now()}`;
        const noticeId = `cn-${Date.now()}`;
        const finalExceptionNote = exceptionNote?.trim() || app.exceptionNote;
        return {
          ...app,
          status: 'correction' as const,
          exceptionNote: finalExceptionNote && finalExceptionNote.length > 0 ? finalExceptionNote : undefined,
          reviewRecords: [
            ...app.reviewRecords,
            {
              id: reviewRecordId,
              stage: 'review' as const,
              reviewer: '当前公证员',
              reviewTime: now,
              result: 'correction' as const,
              remark,
              isResponsibilityBoundary: true,
            },
            {
              id: `r-sent-${Date.now()}`,
              stage: 'correction_sent' as const,
              reviewer: '当前公证员',
              reviewTime: now,
              result: 'correction' as const,
              remark: '已发送补正通知',
            },
          ],
          correctionNotices: [
            ...app.correctionNotices,
            {
              id: noticeId,
              reviewRecordId,
              sender: '当前公证员',
              sentAt: now,
              deadline: deadlineStr,
              status: 'pending' as const,
              items: items.map((item, i) => ({
                id: `ci-${Date.now()}-${i}`,
                materialName: item.materialName,
                reason: item.reason,
                priority: item.priority,
              })),
            },
          ],
        };
      });
      return { applications: updated };
    });
  },

  rejectApplication: (id, remark, exceptionNote) => {
    set((state) => {
      const now = new Date().toLocaleString('zh-CN', { hour12: false });
      const updated = state.applications.map((app) => {
        if (app.id !== id) return app;
        const finalExceptionNote = exceptionNote?.trim() || app.exceptionNote;
        return {
          ...app,
          status: 'rejected' as const,
          exceptionNote: finalExceptionNote && finalExceptionNote.length > 0 ? finalExceptionNote : undefined,
          reviewRecords: [
            ...app.reviewRecords,
            {
              id: `r-${Date.now()}`,
              stage: 'review' as const,
              reviewer: '当前公证员',
              reviewTime: now,
              result: 'reject' as const,
              remark,
            },
          ],
        };
      });
      return { applications: updated };
    });
  },
}));

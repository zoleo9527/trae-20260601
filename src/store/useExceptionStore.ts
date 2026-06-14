import { create } from 'zustand';
import { ExceptionRecord, ExceptionStatus, ExceptionType, ExceptionPriority } from '@/types';
import { mockExceptions } from '@/data/exceptions';
import { generateId } from '@/utils/date';

interface ExceptionState {
  exceptionList: ExceptionRecord[];
  filterStatus: ExceptionStatus | 'all';
  filterType: ExceptionType | 'all';
  searchQuery: string;

  getExceptionById: (id: string) => ExceptionRecord | undefined;
  getExceptionsByStudentId: (studentId: string) => ExceptionRecord[];
  setFilterStatus: (status: ExceptionStatus | 'all') => void;
  setFilterType: (type: ExceptionType | 'all') => void;
  setSearchQuery: (query: string) => void;

  addException: (exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateExceptionStatus: (id: string, status: ExceptionStatus, handledBy?: string, handleNote?: string) => void;

  getFilteredExceptions: () => ExceptionRecord[];
  getPendingCount: () => number;
  getHighPriorityCount: () => number;
}

export const useExceptionStore = create<ExceptionState>((set, get) => ({
  exceptionList: mockExceptions,
  filterStatus: 'all',
  filterType: 'all',
  searchQuery: '',

  getExceptionById: (id) => {
    return get().exceptionList.find(e => e.id === id);
  },

  getExceptionsByStudentId: (studentId) => {
    return get().exceptionList
      .filter(e => e.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterType: (type) => set({ filterType: type }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addException: (exception) => {
    const now = new Date().toISOString();
    const newException: ExceptionRecord = {
      ...exception,
      id: generateId('e'),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    set(state => ({
      exceptionList: [newException, ...state.exceptionList],
    }));
  },

  updateExceptionStatus: (id, status, handledBy, handleNote) => {
    const now = new Date().toISOString();
    set(state => ({
      exceptionList: state.exceptionList.map(e =>
        e.id === id
          ? {
              ...e,
              status,
              updatedAt: now,
              handledBy: handledBy || e.handledBy,
              handleNote: handleNote || e.handleNote,
              resolvedAt: status === 'resolved' ? now : e.resolvedAt,
            }
          : e
      ),
    }));
  },

  getFilteredExceptions: () => {
    const { exceptionList, filterStatus, filterType, searchQuery } = get();

    let filtered = [...exceptionList];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.className?.toLowerCase().includes(query)
      );
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return filtered.sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { pending: 0, processing: 1, resolved: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  getPendingCount: () => {
    return get().exceptionList.filter(e => e.status === 'pending').length;
  },

  getHighPriorityCount: () => {
    return get().exceptionList.filter(e => e.priority === 'high' && e.status !== 'resolved').length;
  },
}));

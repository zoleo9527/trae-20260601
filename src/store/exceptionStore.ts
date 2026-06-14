import { create } from 'zustand';
import { Exception, ExceptionType, ExceptionStatus } from '../types';
import { mockExceptions } from '../data/mockData';

interface ExceptionStore {
  exceptions: Exception[];
  selectedExceptionId: string | null;
  filterType: ExceptionType | 'all';
  loadExceptions: () => void;
  selectException: (id: string | null) => void;
  setFilterType: (type: ExceptionType | 'all') => void;
  analyzeException: (id: string, analysis: Exception['analysis']) => void;
  resolveException: (id: string, result: string) => void;
  escalateException: (id: string, escalation: Exception['escalation']) => void;
  updateExceptionStatus: (id: string, status: ExceptionStatus) => void;
  getFilteredExceptions: () => Exception[];
  getSelectedException: () => Exception | undefined;
}

export const useExceptionStore = create<ExceptionStore>((set, get) => ({
  exceptions: [],
  selectedExceptionId: null,
  filterType: 'all',

  loadExceptions: () => {
    set({ exceptions: mockExceptions });
  },

  selectException: (id) => {
    set({ selectedExceptionId: id });
  },

  setFilterType: (type) => {
    set({ filterType: type });
  },

  analyzeException: (id, analysis) => {
    set((state) => ({
      exceptions: state.exceptions.map((exc) =>
        exc.id === id
          ? { ...exc, analysis, status: 'analyzing' }
          : exc
      ),
    }));
  },

  resolveException: (id, result) => {
    set((state) => ({
      exceptions: state.exceptions.map((exc) =>
        exc.id === id
          ? {
              ...exc,
              status: 'resolved',
              analysis: exc.analysis
                ? { ...exc.analysis, result, handledAt: new Date() }
                : undefined,
            }
          : exc
      ),
    }));
  },

  escalateException: (id, escalation) => {
    set((state) => ({
      exceptions: state.exceptions.map((exc) =>
        exc.id === id
          ? { ...exc, escalation, status: 'escalated' }
          : exc
      ),
    }));
  },

  updateExceptionStatus: (id, status) => {
    set((state) => ({
      exceptions: state.exceptions.map((exc) =>
        exc.id === id ? { ...exc, status } : exc
      ),
    }));
  },

  getFilteredExceptions: () => {
    const { exceptions, filterType } = get();
    if (filterType === 'all') {
      return exceptions;
    }
    return exceptions.filter((exc) => exc.type === filterType);
  },

  getSelectedException: () => {
    const { exceptions, selectedExceptionId } = get();
    return exceptions.find((exc) => exc.id === selectedExceptionId);
  },
}));

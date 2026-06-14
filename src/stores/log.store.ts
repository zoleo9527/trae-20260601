import { create } from 'zustand';
import type { OperationLog, LogFilter, TimelineItem } from '../types/log.types';
import { LogService } from '../services/log.service';

interface LogState {
  logs: OperationLog[];
  currentLogs: OperationLog[];
  currentTimeline: TimelineItem[];
  loading: boolean;
  error: string | null;
  filters: LogFilter;

  fetchLogs: (filters?: LogFilter) => Promise<void>;
  fetchTaskLogs: (taskId: string) => Promise<void>;
  fetchAssessmentLogs: (assessmentId: string) => Promise<void>;
  setFilters: (filters: LogFilter) => void;
  clearCurrentLogs: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  currentLogs: [],
  currentTimeline: [],
  loading: false,
  error: null,
  filters: {},

  fetchLogs: async (filters?: LogFilter) => {
    set({ loading: true, error: null });
    try {
      const service = new LogService();
      const result = service.getLogs(filters);
      set({ logs: result.list, loading: false, filters: filters || {} });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTaskLogs: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const service = new LogService();
      const logs = service.getTaskLogs(taskId);
      const timeline = service.buildTimeline(logs);
      set({ currentLogs: logs, currentTimeline: timeline, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchAssessmentLogs: async (assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      const service = new LogService();
      const logs = service.getAssessmentLogs(assessmentId);
      const timeline = service.buildTimeline(logs);
      set({ currentLogs: logs, currentTimeline: timeline, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setFilters: (filters: LogFilter) => {
    set({ filters });
  },

  clearCurrentLogs: () => {
    set({ currentLogs: [], currentTimeline: [] });
  }
}));

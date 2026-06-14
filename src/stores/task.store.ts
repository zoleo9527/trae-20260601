import { create } from 'zustand';
import type { SurveyTask, CreateTaskParams, TaskFilter } from '../types/task.types';
import { TaskService } from '../services/task.service';
import type { User } from '../types/user.types';

interface TaskState {
  tasks: SurveyTask[];
  currentTask: SurveyTask | null;
  loading: boolean;
  error: string | null;
  filters: TaskFilter;
  stats: {
    today: number;
    pending: number;
    processing: number;
    completed: number;
  };

  fetchTasks: (filters?: TaskFilter) => Promise<void>;
  fetchTaskDetail: (taskId: string) => Promise<void>;
  createTask: (params: CreateTaskParams) => Promise<void>;
  assignTask: (taskId: string, surveyorId: string, remark?: string) => Promise<void>;
  acceptTask: (taskId: string, remark?: string) => Promise<void>;
  startSurvey: (taskId: string, surveyLocation: string, remark?: string) => Promise<void>;
  completeSurvey: (taskId: string, remark?: string) => Promise<void>;
  setFilters: (filters: TaskFilter) => void;
  fetchStats: () => Promise<void>;
  clearCurrentTask: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
  filters: {},
  stats: {
    today: 0,
    pending: 0,
    processing: 0,
    completed: 0
  },

  fetchTasks: async (filters?: TaskFilter) => {
    set({ loading: true, error: null });
    try {
      const service = new TaskService();
      const result = service.getTasks(filters);
      set({ tasks: result.list, loading: false, filters: filters || {} });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTaskDetail: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const service = new TaskService();
      const task = service.getTaskById(taskId);
      set({ currentTask: task || null, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createTask: async (params: CreateTaskParams) => {
    set({ loading: true, error: null });
    try {
      const service = new TaskService();
      await service.createTask(params);
      await get().fetchTasks();
      await get().fetchStats();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  assignTask: async (taskId: string, surveyorId: string, remark?: string) => {
    set({ loading: true, error: null });
    try {
      const service = new TaskService();
      const updatedTask = await service.assignTask(taskId, surveyorId, remark);
      set({ currentTask: updatedTask });
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  acceptTask: async (taskId: string, remark?: string) => {
    set({ loading: true, error: null });
    try {
      const service = new TaskService();
      const updatedTask = await service.acceptTask(taskId, remark);
      set({ currentTask: updatedTask });
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  startSurvey: async (taskId: string, surveyLocation: string, remark?: string) => {
    set({ loading: true, error: null });
    try {
      const service = new TaskService();
      const updatedTask = await service.startSurvey(taskId, surveyLocation, remark);
      set({ currentTask: updatedTask });
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  completeSurvey: async (taskId: string, remark?: string) => {
    set({ loading: true, error: null });
    try {
      const service = new TaskService();
      const updatedTask = await service.completeSurvey(taskId, remark);
      set({ currentTask: updatedTask });
      await get().fetchTasks();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  setFilters: (filters: TaskFilter) => {
    set({ filters });
  },

  fetchStats: async () => {
    try {
      const service = new TaskService();
      const stats = service.getTaskStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  clearCurrentTask: () => {
    set({ currentTask: null });
  }
}));

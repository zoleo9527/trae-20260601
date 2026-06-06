import { create } from 'zustand';
import { api } from '@/services/api';
import type {
  Talent,
  Brand,
  Project,
  ShootingSchedule,
  MaterialDelivery,
  TimelineEvent,
  TodoItem,
  RiskItem,
  RecentChange,
  ScriptVersion,
} from '@/types';

interface AppState {
  talents: Talent[];
  brands: Brand[];
  projects: Project[];
  shootingSchedules: ShootingSchedule[];
  materialDeliveries: MaterialDelivery[];
  timelineEvents: Record<string, TimelineEvent[]>;
  todos: TodoItem[];
  risks: RiskItem[];
  recentChanges: RecentChange[];
  scriptVersions: Record<string, ScriptVersion[]>;
  loading: boolean;
  error: string | null;

  fetchTalents: () => Promise<void>;
  fetchBrands: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchShootingSchedules: () => Promise<void>;
  fetchMaterialDeliveries: () => Promise<void>;
  fetchTimelineEvents: (projectId: string) => Promise<void>;
  fetchTodos: () => Promise<void>;
  fetchRisks: () => Promise<void>;
  fetchRecentChanges: () => Promise<void>;
  fetchScriptVersions: (projectId: string) => Promise<void>;

  updateShootingSchedule: (id: string, data: Partial<ShootingSchedule>) => Promise<void>;
  updateMaterialDelivery: (id: string, data: Partial<MaterialDelivery>) => Promise<void>;
  updateTodo: (id: string, data: Partial<TodoItem>) => Promise<void>;
  createShootingSchedule: (data: Omit<ShootingSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<void>;

  getProjectById: (id: string) => Project | undefined;
  getShootingScheduleById: (id: string) => ShootingSchedule | undefined;
  getMaterialDeliveryById: (id: string) => MaterialDelivery | undefined;
}

export const useStore = create<AppState>((set, get) => ({
  talents: [],
  brands: [],
  projects: [],
  shootingSchedules: [],
  materialDeliveries: [],
  timelineEvents: {},
  todos: [],
  risks: [],
  recentChanges: [],
  scriptVersions: {},
  loading: false,
  error: null,

  fetchTalents: async () => {
    set({ loading: true });
    try {
      const data = await api.getTalents();
      set({ talents: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchBrands: async () => {
    set({ loading: true });
    try {
      const data = await api.getBrands();
      set({ brands: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const data = await api.getProjects();
      set({ projects: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchShootingSchedules: async () => {
    set({ loading: true });
    try {
      const data = await api.getShootingSchedules();
      set({ shootingSchedules: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMaterialDeliveries: async () => {
    set({ loading: true });
    try {
      const data = await api.getMaterialDeliveries();
      set({ materialDeliveries: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTimelineEvents: async (projectId: string) => {
    set({ loading: true });
    try {
      const data = await api.getTimelineEvents(projectId);
      set((state) => ({
        timelineEvents: { ...state.timelineEvents, [projectId]: data },
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTodos: async () => {
    set({ loading: true });
    try {
      const data = await api.getTodos();
      set({ todos: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchRisks: async () => {
    set({ loading: true });
    try {
      const data = await api.getRisks();
      set({ risks: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecentChanges: async () => {
    set({ loading: true });
    try {
      const data = await api.getRecentChanges();
      set({ recentChanges: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchScriptVersions: async (projectId: string) => {
    set({ loading: true });
    try {
      const data = await api.getScriptVersions(projectId);
      set((state) => ({
        scriptVersions: { ...state.scriptVersions, [projectId]: data },
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateShootingSchedule: async (id: string, data: Partial<ShootingSchedule>) => {
    set({ loading: true });
    try {
      const updated = await api.updateShootingSchedule(id, data);
      set((state) => ({
        shootingSchedules: state.shootingSchedules.map((s) =>
          s.id === id ? updated : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateMaterialDelivery: async (id: string, data: Partial<MaterialDelivery>) => {
    set({ loading: true });
    try {
      const updated = await api.updateMaterialDelivery(id, data);
      set((state) => ({
        materialDeliveries: state.materialDeliveries.map((m) =>
          m.id === id ? updated : m
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateTodo: async (id: string, data: Partial<TodoItem>) => {
    set({ loading: true });
    try {
      const updated = await api.updateTodo(id, data);
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createShootingSchedule: async (data: Omit<ShootingSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true });
    try {
      const newSchedule = await api.createShootingSchedule(data);
      set((state) => ({
        shootingSchedules: [newSchedule, ...state.shootingSchedules],
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addTimelineEvent: async (event: Omit<TimelineEvent, 'id'>) => {
    set({ loading: true });
    try {
      const newEvent = await api.addTimelineEvent(event);
      set((state) => ({
        timelineEvents: {
          ...state.timelineEvents,
          [event.projectId]: [newEvent, ...(state.timelineEvents[event.projectId] || [])],
        },
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  getProjectById: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  getShootingScheduleById: (id: string) => {
    return get().shootingSchedules.find((s) => s.id === id);
  },

  getMaterialDeliveryById: (id: string) => {
    return get().materialDeliveries.find((m) => m.id === id);
  },
}));

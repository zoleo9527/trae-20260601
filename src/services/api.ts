import {
  mockTalents,
  mockBrands,
  mockProjects,
  mockShootingSchedules,
  mockMaterialDeliveries,
  mockTimelineEvents,
  mockTodos,
  mockRisks,
  mockRecentChanges,
  mockScriptVersions,
} from '@/mock/data';
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

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  getTalents: async (): Promise<Talent[]> => {
    await delay();
    return [...mockTalents];
  },

  getBrands: async (): Promise<Brand[]> => {
    await delay();
    return [...mockBrands];
  },

  getProjects: async (): Promise<Project[]> => {
    await delay();
    return [...mockProjects];
  },

  getProjectById: async (id: string): Promise<Project | undefined> => {
    await delay();
    return mockProjects.find((p) => p.id === id);
  },

  getShootingSchedules: async (): Promise<ShootingSchedule[]> => {
    await delay();
    return [...mockShootingSchedules];
  },

  getShootingScheduleById: async (id: string): Promise<ShootingSchedule | undefined> => {
    await delay();
    return mockShootingSchedules.find((s) => s.id === id);
  },

  updateShootingSchedule: async (id: string, data: Partial<ShootingSchedule>): Promise<ShootingSchedule> => {
    await delay();
    const index = mockShootingSchedules.findIndex((s) => s.id === id);
    if (index !== -1) {
      mockShootingSchedules[index] = { ...mockShootingSchedules[index], ...data, updatedAt: new Date().toISOString() };
      return mockShootingSchedules[index];
    }
    throw new Error('Schedule not found');
  },

  createShootingSchedule: async (data: Omit<ShootingSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShootingSchedule> => {
    await delay();
    const newSchedule: ShootingSchedule = {
      ...data,
      id: `sh${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockShootingSchedules.unshift(newSchedule);
    return newSchedule;
  },

  getMaterialDeliveries: async (): Promise<MaterialDelivery[]> => {
    await delay();
    return [...mockMaterialDeliveries];
  },

  getMaterialDeliveryById: async (id: string): Promise<MaterialDelivery | undefined> => {
    await delay();
    return mockMaterialDeliveries.find((m) => m.id === id);
  },

  updateMaterialDelivery: async (id: string, data: Partial<MaterialDelivery>): Promise<MaterialDelivery> => {
    await delay();
    const index = mockMaterialDeliveries.findIndex((m) => m.id === id);
    if (index !== -1) {
      mockMaterialDeliveries[index] = { ...mockMaterialDeliveries[index], ...data, updatedAt: new Date().toISOString() };
      return mockMaterialDeliveries[index];
    }
    throw new Error('Delivery not found');
  },

  getTimelineEvents: async (projectId: string): Promise<TimelineEvent[]> => {
    await delay();
    return mockTimelineEvents.filter((e) => e.projectId === projectId);
  },

  getTodos: async (): Promise<TodoItem[]> => {
    await delay();
    return [...mockTodos];
  },

  updateTodo: async (id: string, data: Partial<TodoItem>): Promise<TodoItem> => {
    await delay();
    const index = mockTodos.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTodos[index] = { ...mockTodos[index], ...data };
      return mockTodos[index];
    }
    throw new Error('Todo not found');
  },

  getRisks: async (): Promise<RiskItem[]> => {
    await delay();
    return [...mockRisks];
  },

  getRecentChanges: async (): Promise<RecentChange[]> => {
    await delay();
    return [...mockRecentChanges];
  },

  getScriptVersions: async (projectId: string): Promise<ScriptVersion[]> => {
    await delay();
    return mockScriptVersions.filter((s) => s.projectId === projectId);
  },

  getProjectDeliveries: async (projectId: string): Promise<MaterialDelivery[]> => {
    await delay();
    return mockMaterialDeliveries.filter((m) => m.projectId === projectId);
  },

  getProjectSchedules: async (projectId: string): Promise<ShootingSchedule[]> => {
    await delay();
    return mockShootingSchedules.filter((s) => s.projectId === projectId);
  },

  addTimelineEvent: async (event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> => {
    await delay();
    const newEvent: TimelineEvent = {
      ...event,
      id: `tl${Date.now()}`,
    };
    mockTimelineEvents.unshift(newEvent);
    return newEvent;
  },
};

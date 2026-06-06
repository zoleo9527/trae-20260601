import request from './request';
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

export const api = {
  getTalents: (): Promise<Talent[]> => request.get('/talents'),

  getBrands: (): Promise<Brand[]> => request.get('/brands'),

  getProjects: (): Promise<Project[]> => request.get('/projects'),

  getProjectById: (id: string): Promise<Project> => request.get(`/projects/${id}`),

  updateProject: (id: string, data: Partial<Project>): Promise<Project> =>
    request.put(`/projects/${id}`, data),

  getProjectSchedules: (projectId: string): Promise<ShootingSchedule[]> =>
    request.get(`/projects/${projectId}/schedules`),

  getProjectDeliveries: (projectId: string): Promise<MaterialDelivery[]> =>
    request.get(`/projects/${projectId}/deliveries`),

  getShootingSchedules: (): Promise<ShootingSchedule[]> => request.get('/schedules'),

  getShootingScheduleById: (id: string): Promise<ShootingSchedule> =>
    request.get(`/schedules/${id}`),

  createShootingSchedule: (
    data: Omit<ShootingSchedule, 'id' | 'createdAt' | 'updatedAt' | 'projectName' | 'brandName' | 'talentName'>
  ): Promise<ShootingSchedule> => request.post('/schedules', data),

  updateShootingSchedule: (
    id: string,
    data: Partial<ShootingSchedule>
  ): Promise<ShootingSchedule> => request.put(`/schedules/${id}`, data),

  startShooting: (id: string): Promise<ShootingSchedule> =>
    request.post(`/schedules/${id}/start`),

  completeShooting: (id: string): Promise<ShootingSchedule> =>
    request.post(`/schedules/${id}/complete`),

  getMaterialDeliveries: (): Promise<MaterialDelivery[]> => request.get('/deliveries'),

  getMaterialDeliveryById: (id: string): Promise<MaterialDelivery> =>
    request.get(`/deliveries/${id}`),

  createMaterialDelivery: (
    data: Omit<MaterialDelivery, 'id' | 'createdAt' | 'updatedAt' | 'projectName' | 'brandName' | 'talentName'>
  ): Promise<MaterialDelivery> => request.post('/deliveries', data),

  updateMaterialDelivery: (
    id: string,
    data: Partial<MaterialDelivery>
  ): Promise<MaterialDelivery> => request.put(`/deliveries/${id}`, data),

  submitDelivery: (id: string): Promise<MaterialDelivery> =>
    request.post(`/deliveries/${id}/submit`),

  reviewDelivery: (
    id: string,
    data: { status: string; feedback: string; reviewer?: string }
  ): Promise<MaterialDelivery> => request.post(`/deliveries/${id}/review`, data),

  getTimelineEvents: (projectId: string): Promise<TimelineEvent[]> =>
    request.get(`/projects/${projectId}/timeline`),

  addTimelineEvent: (
    event: Omit<TimelineEvent, 'id'>
  ): Promise<TimelineEvent> => request.post('/timeline', event),

  getScriptVersions: (projectId: string): Promise<ScriptVersion[]> =>
    request.get(`/projects/${projectId}/scripts`),

  getTodos: (): Promise<TodoItem[]> => request.get('/todos'),

  updateTodo: (id: string, data: Partial<TodoItem>): Promise<TodoItem> =>
    request.put(`/todos/${id}`, data),

  getRisks: (): Promise<RiskItem[]> => request.get('/risks'),

  getRecentChanges: (): Promise<RecentChange[]> => request.get('/recent-changes'),
};

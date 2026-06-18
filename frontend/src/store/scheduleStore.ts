import { create } from 'zustand';
import { ActivitySchedule, ScheduleStatus } from '@/types';
import { mockSchedules } from '@/data/mockSchedules';
import { scheduleApi, TransitionData } from '@/api/schedule';

interface ScheduleState {
  schedules: ActivitySchedule[];
  currentSchedule: ActivitySchedule | null;
  isLoading: boolean;
  error: string | null;

  fetchSchedules: (params?: any) => Promise<void>;
  fetchScheduleById: (id: string) => Promise<void>;
  createSchedule: (data: any) => Promise<ActivitySchedule>;
  updateSchedule: (id: string, data: any) => Promise<void>;
  transitionSchedule: (id: string, data: TransitionData) => Promise<void>;
  clearCurrentSchedule: () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  currentSchedule: null,
  isLoading: false,
  error: null,

  fetchSchedules: async (params?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.getList(params);
      set({ schedules: response.data?.items || mockSchedules, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      set({ schedules: mockSchedules, isLoading: false });
    }
  },

  fetchScheduleById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.getById(id);
      set({ currentSchedule: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      const schedule = mockSchedules.find(s => s.id === id);
      set({ currentSchedule: schedule || null, isLoading: false });
    }
  },

  createSchedule: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.create(data);
      const newSchedule = response.data;
      set(state => ({
        schedules: [newSchedule, ...state.schedules],
        isLoading: false,
      }));
      return newSchedule;
    } catch (error) {
      console.error('Failed to create schedule:', error);
      const newSchedule: ActivitySchedule = {
        ...data,
        id: `sch_${Date.now()}`,
        status: 'DRAFT',
        statusHistory: [],
        changeHistory: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ActivitySchedule;
      set(state => ({
        schedules: [newSchedule, ...state.schedules],
        isLoading: false,
      }));
      return newSchedule;
    }
  },

  updateSchedule: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.update(id, data);
      const updatedSchedule = response.data;
      set(state => ({
        schedules: state.schedules.map(s => s.id === id ? updatedSchedule : s),
        currentSchedule: state.currentSchedule?.id === id ? updatedSchedule : state.currentSchedule,
        isLoading: false,
      }));
      return { success: true, data: updatedSchedule, isChanged: response.data?.isChanged || false, changedFields: response.data?.changedFields || [] };
    } catch (error) {
      console.error('Failed to update schedule:', error);
      set(state => ({
        schedules: state.schedules.map(s =>
          s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
        ),
        isLoading: false,
      }));
      return { success: false, error: '更新失败' };
    }
  },

  transitionSchedule: async (id: string, data: TransitionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.transition(id, data);
      const updatedSchedule = response.data;
      set(state => ({
        schedules: state.schedules.map(s => s.id === id ? updatedSchedule : s),
        currentSchedule: state.currentSchedule?.id === id ? updatedSchedule : state.currentSchedule,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to transition schedule:', error);
      set({ isLoading: false });
    }
  },

  clearCurrentSchedule: () => {
    set({ currentSchedule: null });
  },
}));

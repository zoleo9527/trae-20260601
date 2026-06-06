import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Schedule, ScheduleLog, CreateScheduleDTO, UpdateScheduleDTO } from '@/types/schedule';
import type { ScheduleStatus } from '@/types/common';
import { generateId } from '@/utils/id';
import { now, calculateDuration } from '@/utils/date';
import { useRoleStore } from './roleStore';
import { useHallStore } from './hallStore';

interface ScheduleState {
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
  getSchedule: (id: string) => Schedule | undefined;
  getSchedulesByHall: (hallId: string) => Schedule[];
  getScheduleLogs: (scheduleId: string) => ScheduleLog[];
  createSchedule: (data: CreateScheduleDTO) => Schedule | null;
  updateSchedule: (id: string, data: UpdateScheduleDTO, remark?: string) => void;
  changeScheduleStatus: (id: string, status: ScheduleStatus, remark?: string) => void;
  changeHall: (scheduleId: string, newHallId: string, reason: string) => boolean;
  closeSchedule: (id: string) => void;
  checkTimeConflict: (hallId: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  getActiveSchedules: () => Schedule[];
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],
      scheduleLogs: [],

      getSchedule: (id) => get().schedules.find((s) => s.id === id),

      getSchedulesByHall: (hallId) =>
        get()
          .schedules.filter((s) => s.hallId === hallId)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),

      getScheduleLogs: (scheduleId) =>
        get()
          .scheduleLogs.filter((l) => l.scheduleId === scheduleId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      checkTimeConflict: (hallId, startTime, endTime, excludeId) => {
        const schedules = get().schedules.filter(
          (s) => s.hallId === hallId && s.status !== 'cancelled' && s.status !== 'closed' && s.id !== excludeId
        );
        const newStart = new Date(startTime).getTime();
        const newEnd = new Date(endTime).getTime();

        return schedules.some((s) => {
          const sStart = new Date(s.startTime).getTime();
          const sEnd = new Date(s.endTime).getTime();
          return (newStart >= sStart && newStart < sEnd) || (newEnd > sStart && newEnd <= sEnd) || (newStart <= sStart && newEnd >= sEnd);
        });
      },

      createSchedule: (data) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const halls = useHallStore.getState().halls;
        const hall = halls.find((h) => h.id === data.hallId);

        if (!hall) return null;

        if (get().checkTimeConflict(data.hallId, data.startTime, data.endTime)) {
          return null;
        }

        const schedule: Schedule = {
          id: generateId(),
          movieName: data.movieName,
          hallId: data.hallId,
          hallName: hall.name,
          startTime: data.startTime,
          endTime: data.endTime,
          duration: calculateDuration(data.startTime, data.endTime),
          price: data.price,
          status: 'active',
          createdBy: getRoleName(),
          createdAt: now(),
          updatedAt: now(),
          remark: data.remark,
        };

        const log: ScheduleLog = {
          id: generateId(),
          scheduleId: schedule.id,
          action: '创建排片',
          operator: getRoleName(),
          operatorRole: currentRole,
          createdAt: now(),
          afterData: schedule,
        };

        set((state) => ({
          schedules: [...state.schedules, schedule],
          scheduleLogs: [...state.scheduleLogs, log],
        }));

        return schedule;
      },

      updateSchedule: (id, data, remark) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const schedule = get().schedules.find((s) => s.id === id);
        if (!schedule) return;

        const beforeData = { ...schedule };
        const updated = { ...schedule, ...data, updatedAt: now() };

        const log: ScheduleLog = {
          id: generateId(),
          scheduleId: id,
          action: '更新排片',
          operator: getRoleName(),
          operatorRole: currentRole,
          remark,
          createdAt: now(),
          beforeData,
          afterData: updated,
        };

        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
          scheduleLogs: [...state.scheduleLogs, log],
        }));
      },

      changeScheduleStatus: (id, status, remark) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const schedule = get().schedules.find((s) => s.id === id);
        if (!schedule) return;

        const beforeData = { ...schedule };
        const updated = { ...schedule, status, updatedAt: now() };

        const log: ScheduleLog = {
          id: generateId(),
          scheduleId: id,
          action: `状态变更：${status}`,
          operator: getRoleName(),
          operatorRole: currentRole,
          remark,
          createdAt: now(),
          beforeData,
          afterData: updated,
        };

        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
          scheduleLogs: [...state.scheduleLogs, log],
        }));
      },

      changeHall: (scheduleId, newHallId, reason) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const schedule = get().schedules.find((s) => s.id === scheduleId);
        const halls = useHallStore.getState().halls;
        const newHall = halls.find((h) => h.id === newHallId);

        if (!schedule || !newHall) return false;

        if (get().checkTimeConflict(newHallId, schedule.startTime, schedule.endTime, scheduleId)) {
          return false;
        }

        const beforeData = { ...schedule };
        const updated = {
          ...schedule,
          hallId: newHallId,
          hallName: newHall.name,
          status: 'active' as ScheduleStatus,
          updatedAt: now(),
        };

        const log: ScheduleLog = {
          id: generateId(),
          scheduleId,
          action: '临时换厅',
          operator: getRoleName(),
          operatorRole: currentRole,
          remark: reason,
          createdAt: now(),
          beforeData,
          afterData: updated,
        };

        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === scheduleId ? updated : s)),
          scheduleLogs: [...state.scheduleLogs, log],
        }));

        return true;
      },

      closeSchedule: (id) => {
        get().changeScheduleStatus(id, 'closed', '排片已关闭归档');
      },

      getActiveSchedules: () => {
        return get()
          .schedules.filter((s) => s.status === 'active' || s.status === 'adjusting')
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      },
    }),
    {
      name: 'cinema-ops-schedule',
    }
  )
);

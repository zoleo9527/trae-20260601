import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Schedule, ScheduleStatus, Vehicle, RoleName } from '@/types'
import { mockSchedules, mockVehicles } from '@/mock/data'
import { useLogStore } from '@/stores/logStore'

interface ScheduleState {
  schedules: Schedule[]
  vehicles: Vehicle[]
  createSchedule: (data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void
  createSupplementSchedule: (data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void
  updateSchedule: (id: string, data: Partial<Schedule>) => void
  departSchedule: (id: string, operator: string, operatorRole: RoleName) => void
  returnSchedule: (id: string, operator: string, operatorRole: RoleName, actualReturn?: string) => void
  markSettled: (id: string) => void
  getScheduleById: (id: string) => Schedule | undefined
  getSchedulesByStatus: (status: ScheduleStatus) => Schedule[]
  getVehicleById: (id: string) => Vehicle | undefined
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: mockSchedules,
      vehicles: mockVehicles,

      createSchedule: (data) => {
        const now = new Date().toISOString()
        const newSchedule: Schedule = {
          ...data,
          id: 'sch' + Date.now(),
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ schedules: [...state.schedules, newSchedule] }))
        useLogStore.getState().addLog({
          entityType: 'schedule',
          entityId: newSchedule.id,
          action: 'create',
          operator: data.createdBy,
          operatorRole: 'dispatcher',
          beforeValue: null,
          afterValue: { tripNo: data.tripNo, status: 'PENDING' },
        })
      },

      createSupplementSchedule: (data) => {
        const now = new Date().toISOString()
        const newSchedule: Schedule = {
          ...data,
          id: 'sch' + Date.now(),
          isSupplement: true,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ schedules: [...state.schedules, newSchedule] }))
        useLogStore.getState().addLog({
          entityType: 'schedule',
          entityId: newSchedule.id,
          action: 'supplement',
          operator: data.createdBy,
          operatorRole: 'dispatcher',
          beforeValue: null,
          afterValue: { tripNo: data.tripNo, isSupplement: true },
        })
      },

      updateSchedule: (id, data) => {
        const schedule = get().schedules.find((s) => s.id === id)
        if (!schedule) return
        const before = { ...schedule }
        const after = { ...schedule, ...data, updatedAt: new Date().toISOString() }
        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === id ? after : s)),
        }))
        useLogStore.getState().addLog({
          entityType: 'schedule',
          entityId: id,
          action: 'edit',
          operator: schedule.createdBy,
          operatorRole: 'dispatcher',
          beforeValue: before,
          afterValue: after,
        })
      },

      departSchedule: (id, operator, operatorRole) => {
        const schedule = get().schedules.find((s) => s.id === id)
        if (!schedule) return
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, status: 'DEPARTED', updatedAt: new Date().toISOString() } : s
          ),
        }))
        useLogStore.getState().addLog({
          entityType: 'schedule',
          entityId: id,
          action: 'depart',
          operator,
          operatorRole,
          beforeValue: { status: schedule.status },
          afterValue: { status: 'DEPARTED' },
        })
      },

      returnSchedule: (id, operator, operatorRole, actualReturn) => {
        const schedule = get().schedules.find((s) => s.id === id)
        if (!schedule) return
        const returnTime = actualReturn ?? new Date().toISOString()
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id
              ? { ...s, status: 'RETURNED', actualReturn: returnTime, updatedAt: new Date().toISOString() }
              : s
          ),
        }))
        useLogStore.getState().addLog({
          entityType: 'schedule',
          entityId: id,
          action: 'return',
          operator,
          operatorRole,
          beforeValue: { status: schedule.status },
          afterValue: { status: 'RETURNED', actualReturn: returnTime },
        })
      },

      markSettled: (id) => {
        const schedule = get().schedules.find((s) => s.id === id)
        if (!schedule) return
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, status: 'SETTLED', updatedAt: new Date().toISOString() } : s
          ),
        }))
        useLogStore.getState().addLog({
          entityType: 'schedule',
          entityId: id,
          action: 'settle',
          operator: '',
          operatorRole: 'finance',
          beforeValue: { status: schedule.status },
          afterValue: { status: 'SETTLED' },
        })
      },

      getScheduleById: (id) => {
        return get().schedules.find((s) => s.id === id)
      },

      getSchedulesByStatus: (status) => {
        return get().schedules.filter((s) => s.status === status)
      },

      getVehicleById: (id) => {
        return get().vehicles.find((v) => v.id === id)
      },
    }),
    { name: 'vehicle-schedule-store' }
  )
)

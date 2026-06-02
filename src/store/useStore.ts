import {
    DEMO_DOWNTIMES,
    DEMO_INSTRUMENTS,
    DEMO_NOTIFICATIONS,
    DEMO_RESERVATIONS,
    DEMO_SAMPLES,
} from '@/data/seed'
import type {
    Downtime,
    DowntimeStatus,
    Instrument,
    Notification,
    Reservation,
    ReservationStatus,
    Sample,
    SampleStatus,
    UserRole,
} from '@/types'
import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  instruments: Instrument[]
  reservations: Reservation[]
  samples: Sample[]
  downtimes: Downtime[]
  notifications: Notification[]
  currentRole: UserRole
  currentUserId: string

  setRole: (role: UserRole) => void
  setCurrentUser: (userId: string) => void

  addReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'sampleIds'>) => string
  approveReservation: (id: string) => void
  rejectReservation: (id: string) => void
  cancelReservation: (id: string) => void
  updateReservationTime: (id: string, startTime: string, endTime: string) => void

  addSample: (data: Omit<Sample, 'id' | 'createdAt'>) => string
  updateSampleStatus: (id: string, status: SampleStatus) => void
  updateSampleDisposition: (id: string, status: SampleStatus, dispositionNote: string) => void

  addDowntime: (data: Omit<Downtime, 'id' | 'createdAt' | 'status' | 'affectedReservations'>) => string
  resolveDowntime: (id: string) => void

  postponeReservation: (id: string) => void
  confirmPostpone: (id: string, newStartTime: string, newEndTime: string) => void
  cancelPostponed: (id: string) => void

  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  updateInstrumentStatus: (id: string, status: Instrument['status']) => void

  exportJSON: () => string
  importJSON: (json: string) => boolean
  exportCSV: () => string
  resetData: () => void
}

const initialState = {
  instruments: DEMO_INSTRUMENTS,
  reservations: DEMO_RESERVATIONS,
  samples: DEMO_SAMPLES,
  downtimes: DEMO_DOWNTIMES,
  notifications: DEMO_NOTIFICATIONS,
  currentRole: 'admin' as UserRole,
  currentUserId: 'u1',
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRole: (role) => set({ currentRole: role }),
      setCurrentUser: (userId) => set({ currentUserId: userId }),

      addReservation: (data) => {
        const id = `res-${nanoid(8)}`
        const reservation: Reservation = {
          ...data,
          id,
          status: 'pending',
          sampleIds: [],
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ reservations: [...s.reservations, reservation] }))
        return id
      },

      approveReservation: (id) => {
        set((s) => ({
          reservations: s.reservations.map((r) =>
            r.id === id ? { ...r, status: 'approved' as ReservationStatus } : r
          ),
          notifications: [
            ...s.notifications,
            {
              id: `noti-${nanoid(8)}`,
              type: 'approval' as const,
              recipientId: s.reservations.find((r) => r.id === id)?.userId || '',
              recipientName: s.reservations.find((r) => r.id === id)?.userName || '',
              instrumentId: s.reservations.find((r) => r.id === id)?.instrumentId || '',
              reservationId: id,
              message: `您的预约已通过审批`,
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        }))
      },

      rejectReservation: (id) => {
        set((s) => ({
          reservations: s.reservations.map((r) =>
            r.id === id ? { ...r, status: 'rejected' as ReservationStatus } : r
          ),
          notifications: [
            ...s.notifications,
            {
              id: `noti-${nanoid(8)}`,
              type: 'rejection' as const,
              recipientId: s.reservations.find((r) => r.id === id)?.userId || '',
              recipientName: s.reservations.find((r) => r.id === id)?.userName || '',
              instrumentId: s.reservations.find((r) => r.id === id)?.instrumentId || '',
              reservationId: id,
              message: `您的预约已被驳回`,
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        }))
      },

      cancelReservation: (id) => {
        set((s) => ({
          reservations: s.reservations.map((r) =>
            r.id === id ? { ...r, status: 'cancelled' as ReservationStatus } : r
          ),
          notifications: [
            ...s.notifications,
            {
              id: `noti-${nanoid(8)}`,
              type: 'cancel' as const,
              recipientId: s.reservations.find((r) => r.id === id)?.userId || '',
              recipientName: s.reservations.find((r) => r.id === id)?.userName || '',
              instrumentId: s.reservations.find((r) => r.id === id)?.instrumentId || '',
              reservationId: id,
              message: `您的预约已被取消`,
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        }))
      },

      updateReservationTime: (id, startTime, endTime) => {
        set((s) => ({
          reservations: s.reservations.map((r) =>
            r.id === id ? { ...r, startTime, endTime } : r
          ),
        }))
      },

      addSample: (data) => {
        const id = `sam-${nanoid(8)}`
        const sample: Sample = { ...data, id, createdAt: new Date().toISOString() }
        set((s) => {
          const updatedReservations = s.reservations.map((r) =>
            r.id === data.reservationId
              ? { ...r, sampleIds: [...r.sampleIds, id] }
              : r
          )
          return { samples: [...s.samples, sample], reservations: updatedReservations }
        })
        return id
      },

      updateSampleStatus: (id, status) => {
        set((s) => ({
          samples: s.samples.map((sam) =>
            sam.id === id ? { ...sam, status } : sam
          ),
        }))
      },

      updateSampleDisposition: (id, status, dispositionNote) => {
        set((s) => ({
          samples: s.samples.map((sam) =>
            sam.id === id ? { ...sam, status, dispositionNote } : sam
          ),
        }))
      },

      addDowntime: (data) => {
        const id = `dt-${nanoid(8)}`
        const affectedReservations = get().reservations.filter((r) => {
          if (r.instrumentId !== data.instrumentId) return false
          if (r.status !== 'approved' && r.status !== 'pending') return false
          const rStart = new Date(r.startTime).getTime()
          const rEnd = new Date(r.endTime).getTime()
          const dStart = new Date(data.startTime).getTime()
          const dEnd = new Date(data.endTime).getTime()
          return rStart < dEnd && rEnd > dStart
        })

        const affectedIds = affectedReservations.map((r) => r.id)

        const downtime: Downtime = {
          ...data,
          id,
          status: 'active',
          affectedReservations: affectedIds,
          createdAt: new Date().toISOString(),
        }

        const updatedReservations = get().reservations.map((r) =>
          affectedIds.includes(r.id)
            ? { ...r, status: 'postponed' as ReservationStatus }
            : r
        )

        const affectedSampleIds = get().samples
          .filter((sam) => affectedIds.includes(sam.reservationId))
          .map((sam) => sam.id)

        const updatedSamples = get().samples.map((sam) =>
          affectedSampleIds.includes(sam.id)
            ? { ...sam, status: 'pending_postpone' as SampleStatus, dispositionNote: '关联预约因故障停机被标记顺延，等待管理员处理' }
            : sam
        )

        const newNotifications: Notification[] = affectedReservations.map((r) => ({
          id: `noti-${nanoid(8)}`,
          type: 'downtime' as const,
          recipientId: r.userId,
          recipientName: r.userName,
          instrumentId: r.instrumentId,
          reservationId: r.id,
          message: `${get().instruments.find((i) => i.id === r.instrumentId)?.name || '仪器'}故障停机，您的预约已被标记为顺延，请等待管理员处理`,
          createdAt: new Date().toISOString(),
          read: false,
        }))

        set((s) => ({
          downtimes: [...s.downtimes, downtime],
          reservations: updatedReservations,
          samples: updatedSamples,
          notifications: [...s.notifications, ...newNotifications],
          instruments: s.instruments.map((i) =>
            i.id === data.instrumentId ? { ...i, status: 'fault' as const } : i
          ),
        }))

        return id
      },

      resolveDowntime: (id) => {
        const downtime = get().downtimes.find((d) => d.id === id)
        if (!downtime) return

        set((s) => ({
          downtimes: s.downtimes.map((d) =>
            d.id === id ? { ...d, status: 'resolved' as DowntimeStatus } : d
          ),
          instruments: s.instruments.map((i) =>
            i.id === downtime.instrumentId ? { ...i, status: 'normal' as const } : i
          ),
          notifications: [
            ...s.notifications,
            {
              id: `noti-${nanoid(8)}`,
              type: 'restore' as const,
              recipientId: '',
              recipientName: '全部',
              instrumentId: downtime.instrumentId,
              message: `${s.instruments.find((i) => i.id === downtime.instrumentId)?.name || '仪器'}已恢复正常运行`,
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        }))
      },

      postponeReservation: (id) => {
        set((s) => ({
          reservations: s.reservations.map((r) =>
            r.id === id ? { ...r, status: 'postponed' as ReservationStatus } : r
          ),
        }))
      },

      confirmPostpone: (id, newStartTime, newEndTime) => {
        const instName = get().instruments.find((i) => i.id === get().reservations.find((r) => r.id === id)?.instrumentId)?.name || '仪器'

        set((s) => {
          const updatedSamples = s.samples.map((sam) =>
            sam.reservationId === id
              ? { ...sam, status: 'postponed' as SampleStatus, dispositionNote: `已顺延至 ${new Date(newStartTime).toLocaleString('zh-CN')} ~ ${new Date(newEndTime).toLocaleString('zh-CN')}，请按时送样` }
              : sam
          )

          return {
            reservations: s.reservations.map((r) =>
              r.id === id
                ? { ...r, status: 'approved' as ReservationStatus, startTime: newStartTime, endTime: newEndTime }
                : r
            ),
            samples: updatedSamples,
            notifications: [
              ...s.notifications,
              {
                id: `noti-${nanoid(8)}`,
                type: 'postpone' as const,
                recipientId: s.reservations.find((r) => r.id === id)?.userId || '',
                recipientName: s.reservations.find((r) => r.id === id)?.userName || '',
                instrumentId: s.reservations.find((r) => r.id === id)?.instrumentId || '',
                reservationId: id,
                message: `您在${instName}的预约已顺延至 ${new Date(newStartTime).toLocaleString('zh-CN')}，关联样本已同步更新`,
                createdAt: new Date().toISOString(),
                read: false,
              },
            ],
          }
        })
      },

      cancelPostponed: (id) => {
        const instName = get().instruments.find((i) => i.id === get().reservations.find((r) => r.id === id)?.instrumentId)?.name || '仪器'

        set((s) => {
          const updatedSamples = s.samples.map((sam) =>
            sam.reservationId === id
              ? { ...sam, status: 'cancelled' as SampleStatus, dispositionNote: `关联预约已取消，样本不再安排测试。请及时取回样本` }
              : sam
          )

          return {
            reservations: s.reservations.map((r) =>
              r.id === id ? { ...r, status: 'cancelled' as ReservationStatus } : r
            ),
            samples: updatedSamples,
            notifications: [
              ...s.notifications,
              {
                id: `noti-${nanoid(8)}`,
                type: 'cancel' as const,
                recipientId: s.reservations.find((r) => r.id === id)?.userId || '',
                recipientName: s.reservations.find((r) => r.id === id)?.userName || '',
                instrumentId: s.reservations.find((r) => r.id === id)?.instrumentId || '',
                reservationId: id,
                message: `您在${instName}的预约已取消，关联样本已同步标记，请及时取回`,
                createdAt: new Date().toISOString(),
                read: false,
              },
            ],
          }
        })
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      markAllNotificationsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }))
      },

      updateInstrumentStatus: (id, status) => {
        set((s) => ({
          instruments: s.instruments.map((i) =>
            i.id === id ? { ...i, status } : i
          ),
        }))
      },

      exportJSON: () => {
        const s = get()
        const data = {
          instruments: s.instruments,
          reservations: s.reservations,
          samples: s.samples,
          downtimes: s.downtimes,
          notifications: s.notifications,
          exportedAt: new Date().toISOString(),
        }
        return JSON.stringify(data, null, 2)
      },

      importJSON: (json) => {
        try {
          const data = JSON.parse(json)
          if (!data.instruments || !data.reservations) return false
          set({
            instruments: data.instruments,
            reservations: data.reservations,
            samples: data.samples || [],
            downtimes: data.downtimes || [],
            notifications: data.notifications || [],
          })
          return true
        } catch {
          return false
        }
      },

      exportCSV: () => {
        const s = get()
        const headers = ['预约ID', '仪器', '申请人', '课题组', '开始时间', '结束时间', '状态', '申请理由', '创建时间']
        const rows = s.reservations.map((r) => {
          const inst = s.instruments.find((i) => i.id === r.instrumentId)
          return [
            r.id,
            inst?.name || '',
            r.userName,
            r.userGroup,
            new Date(r.startTime).toLocaleString('zh-CN'),
            new Date(r.endTime).toLocaleString('zh-CN'),
            r.status,
            `"${r.reason.replace(/"/g, '""')}"`,
            new Date(r.createdAt).toLocaleString('zh-CN'),
          ].join(',')
        })
        return [headers.join(','), ...rows].join('\n')
      },

      resetData: () => {
        set(initialState)
      },
    }),
    {
      name: 'instrument-reservation-store',
    }
  )
)

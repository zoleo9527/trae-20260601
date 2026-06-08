import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState,
  Room,
  InspectionTask,
  InspectionResult,
  LinenRecord,
  MaintenanceOrder,
  MinibarCheck,
  MinibarItem,
  UserRole,
  MaintenanceStatus,
  UiFilters,
} from '@/types'
import { mockData } from './mockData'

function getMaxIdNumber(): number {
  const allIds: string[] = [
    ...mockData.rooms.map((r) => r.id),
    ...mockData.users.map((u) => u.id),
    ...mockData.inspectionTasks.map((t) => t.id),
    ...mockData.inspectionResults.map((r) => r.id),
    ...mockData.linenRecords.map((l) => l.id),
    ...mockData.maintenanceOrders.map((o) => o.id),
    ...mockData.minibarChecks.map((c) => c.id),
    ...mockData.minibarChecks.flatMap((c) => c.items.map((i) => i.id)),
    ...mockData.minibarProducts.map((p) => p.id),
  ]

  let maxNum = 0
  for (const id of allIds) {
    const match = id.match(/-(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  }
  return maxNum
}

let idCounter = getMaxIdNumber()

function generateId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export interface InspectionDraft {
  taskId: string
  roomId: string
  facilityOk: boolean
  cleanlinessOk: boolean
  issues: string
  minibarInitialStatus: 'ok' | 'partial' | 'empty'
  linenItems: {
    itemType: string
    expectedCount: number
    actualCount: number
    action: 'none' | 'replace' | 'replenish'
  }[]
  savedAt: string
}

interface AppActions {
  setCurrentUser: (userId: string, role: UserRole) => void
  assignTask: (taskId: string, attendantId: string) => void
  startInspection: (taskId: string) => void
  completeInspection: (taskId: string, result: Omit<InspectionResult, 'id' | 'createdAt'>) => void
  updateLinenRecords: (taskId: string, records: Omit<LinenRecord, 'id'>[]) => void
  saveInspectionDraft: (draft: InspectionDraft) => void
  getInspectionDraft: (taskId: string) => InspectionDraft | undefined
  clearInspectionDraft: (taskId: string) => void
  submitMinibarCheck: (checkId: string, items: { id: string; actualCount: number }[]) => void
  updateMaintenanceOrder: (orderId: string, status: MaintenanceStatus) => void
  assignMaintenanceOrder: (orderId: string, engineerId: string) => void
  reviewMinibarAnomaly: (checkId: string, approved: boolean, remarks?: string) => void
  updateUiFilter: (key: keyof UiFilters, value: string | boolean) => void
  getRoomsByFloor: (floor: string) => Room[]
  getTasksByAttendant: (attendantId: string) => InspectionTask[]
  getMaintenanceByEngineer: (engineerId: string) => MaintenanceOrder[]
}

export type AppStore = AppState & AppActions & { inspectionDrafts: Record<string, InspectionDraft> }

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...mockData,
      inspectionDrafts: {} as Record<string, InspectionDraft>,
      uiFilters: {
        historySearchRoom: '',
        historyStatus: 'all' as const,
        historyDateFrom: '',
        historyDateTo: '',
        reviewSearchRoom: '',
        reviewShowAll: false,
      },

      setCurrentUser(userId: string, role: UserRole) {
        set({ currentUserId: userId, currentRole: role })
      },

      assignTask(taskId: string, attendantId: string) {
        set((state) => {
          const task = state.inspectionTasks.find((t) => t.id === taskId)
          if (!task) return state

          const updatedTasks = state.inspectionTasks.map((t) =>
            t.id === taskId
              ? { ...t, assignedTo: attendantId, status: 'assigned' as const }
              : t
          )

          const updatedRooms = state.rooms.map((r) =>
            r.id === task.roomId
              ? { ...r, status: 'inspecting' as const }
              : r
          )

          return { inspectionTasks: updatedTasks, rooms: updatedRooms }
        })
      },

      startInspection(taskId: string) {
        set((state) => ({
          inspectionTasks: state.inspectionTasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'in_progress' as const }
              : t
          ),
        }))
      },

      completeInspection(
        taskId: string,
        result: Omit<InspectionResult, 'id' | 'createdAt'>
      ) {
        set((state) => {
          const task = state.inspectionTasks.find((t) => t.id === taskId)
          if (!task) return state

          const now = new Date().toISOString()

          const newResult: InspectionResult = {
            ...result,
            id: generateId('result'),
            createdAt: now,
          }

          const updatedTasks = state.inspectionTasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed' as const, completedAt: now }
              : t
          )

          const minibarItems: MinibarItem[] = state.minibarProducts.map((p) => ({
            id: generateId('item'),
            minibarCheckId: '',
            name: p.name,
            expectedCount: p.defaultCount,
            actualCount: p.defaultCount,
            unitPrice: p.unitPrice,
            isAnomaly: false,
          }))

          const minibarCheckId = generateId('check')
          const newMinibarCheck: MinibarCheck = {
            id: minibarCheckId,
            taskId,
            roomId: task.roomId,
            status: 'pending',
            items: minibarItems.map((item) => ({
              ...item,
              minibarCheckId,
            })),
          }

          const newOrders: MaintenanceOrder[] = []
          if (!result.facilityOk) {
            newOrders.push({
              id: generateId('order'),
              roomId: task.roomId,
              taskId,
              description: result.issues || '设施问题待维修',
              priority: 'medium',
              status: 'pending',
              createdAt: now,
            })
          }

          const updatedRooms = state.rooms.map((r) => {
            if (r.id !== task.roomId) return r
            if (!result.facilityOk || newOrders.length > 0) {
              return { ...r, status: 'maintenance' as const }
            }
            return { ...r, status: 'inspecting' as const }
          })

          const updatedDrafts = { ...state.inspectionDrafts }
          delete updatedDrafts[taskId]

          return {
            inspectionTasks: updatedTasks,
            inspectionResults: [...state.inspectionResults, newResult],
            minibarChecks: [...state.minibarChecks, newMinibarCheck],
            maintenanceOrders: [...state.maintenanceOrders, ...newOrders],
            rooms: updatedRooms,
            inspectionDrafts: updatedDrafts,
          }
        })
      },

      updateLinenRecords(
        taskId: string,
        records: Omit<LinenRecord, 'id'>[]
      ) {
        set((state) => {
          const filtered = state.linenRecords.filter((r) => r.taskId !== taskId)
          const newRecords = records.map((r) => ({
            ...r,
            id: generateId('linen'),
          }))
          return { linenRecords: [...filtered, ...newRecords] }
        })
      },

      saveInspectionDraft(draft: InspectionDraft) {
        set((state) => ({
          inspectionDrafts: {
            ...state.inspectionDrafts,
            [draft.taskId]: { ...draft, savedAt: new Date().toISOString() },
          },
        }))
      },

      getInspectionDraft(taskId: string) {
        return get().inspectionDrafts[taskId]
      },

      clearInspectionDraft(taskId: string) {
        set((state) => {
          const updatedDrafts = { ...state.inspectionDrafts }
          delete updatedDrafts[taskId]
          return { inspectionDrafts: updatedDrafts }
        })
      },

      submitMinibarCheck(
        checkId: string,
        items: { id: string; actualCount: number }[]
      ) {
        set((state) => {
          const check = state.minibarChecks.find((c) => c.id === checkId)
          if (!check) return state

          const updatedItems = check.items.map((item) => {
            const update = items.find((i) => i.id === item.id)
            if (!update) return item
            const isAnomaly = update.actualCount !== item.expectedCount
            return { ...item, actualCount: update.actualCount, isAnomaly }
          })

          const hasAnomaly = updatedItems.some((item) => item.isAnomaly)
          const now = new Date().toISOString()

          const updatedChecks = state.minibarChecks.map((c) =>
            c.id === checkId
              ? {
                  ...c,
                  items: updatedItems,
                  status: hasAnomaly ? ('anomaly' as const) : ('checked' as const),
                  checkedBy: state.currentUserId,
                  checkedAt: now,
                }
              : c
          )

          const updatedRooms = (() => {
            if (!hasAnomaly) {
              const roomOrders = state.maintenanceOrders.filter(
                (o) => o.roomId === check.roomId && o.status !== 'completed'
              )
              if (roomOrders.length === 0) {
                return state.rooms.map((r) =>
                  r.id === check.roomId ? { ...r, status: 'clean' as const } : r
                )
              }
            }
            return state.rooms
          })()

          return { minibarChecks: updatedChecks, rooms: updatedRooms }
        })
      },

      updateMaintenanceOrder(orderId: string, status: MaintenanceStatus) {
        set((state) => {
          const now = new Date().toISOString()
          const order = state.maintenanceOrders.find((o) => o.id === orderId)

          const updatedOrders = state.maintenanceOrders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  completedAt: status === 'completed' ? now : o.completedAt,
                }
              : o
          )

          if (status === 'completed' && order) {
            const roomOrders = updatedOrders.filter(
              (o) => o.roomId === order.roomId && o.status !== 'completed'
            )
            if (roomOrders.length === 0) {
              const roomMinibarChecks = state.minibarChecks.filter(
                (c) => c.roomId === order.roomId
              )
              const hasPendingOrAnomaly = roomMinibarChecks.some(
                (c) => c.status === 'pending' || c.status === 'anomaly'
              )
              if (!hasPendingOrAnomaly) {
                const updatedRooms = state.rooms.map((r) =>
                  r.id === order.roomId
                    ? { ...r, status: 'clean' as const }
                    : r
                )
                return {
                  maintenanceOrders: updatedOrders,
                  rooms: updatedRooms,
                }
              }
            }
          }

          return { maintenanceOrders: updatedOrders }
        })
      },

      assignMaintenanceOrder(orderId: string, engineerId: string) {
        set((state) => {
          const updatedOrders = state.maintenanceOrders.map((o) =>
            o.id === orderId
              ? { ...o, assignedTo: engineerId, status: 'in_progress' as const }
              : o
          )
          return { maintenanceOrders: updatedOrders }
        })
      },

      reviewMinibarAnomaly(checkId: string, approved: boolean, remarks?: string) {
        set((state) => {
          const check = state.minibarChecks.find((c) => c.id === checkId)
          if (!check) return state

          const now = new Date().toISOString()

          const updatedChecks = state.minibarChecks.map((c) =>
            c.id === checkId
              ? {
                  ...c,
                  status: 'checked' as const,
                  reviewedBy: state.currentUserId,
                  reviewedAt: now,
                  reviewRemarks: remarks,
                }
              : c
          )

          const roomOrders = state.maintenanceOrders.filter(
            (o) => o.roomId === check.roomId && o.status !== 'completed'
          )

          const newRoomStatus: Room['status'] =
            roomOrders.length > 0 ? 'maintenance' : 'clean'

          const updatedRooms = state.rooms.map((r) =>
            r.id === check.roomId ? { ...r, status: newRoomStatus } : r
          )

          return { minibarChecks: updatedChecks, rooms: updatedRooms }
        })
      },

      updateUiFilter(key: keyof UiFilters, value: string | boolean) {
        set((state) => ({
          uiFilters: { ...state.uiFilters, [key]: value },
        }))
      },

      getRoomsByFloor(floor: string) {
        return get().rooms.filter((r) => r.floor === floor)
      },

      getTasksByAttendant(attendantId: string) {
        return get().inspectionTasks.filter((t) => t.assignedTo === attendantId)
      },

      getMaintenanceByEngineer(engineerId: string) {
        return get().maintenanceOrders.filter(
          (o) => o.assignedTo === engineerId
        )
      },
    }),
    {
      name: 'hotel-housekeeping',
      partialize: (state) => ({
        rooms: state.rooms,
        users: state.users,
        inspectionTasks: state.inspectionTasks,
        inspectionResults: state.inspectionResults,
        linenRecords: state.linenRecords,
        maintenanceOrders: state.maintenanceOrders,
        minibarChecks: state.minibarChecks,
        minibarProducts: state.minibarProducts,
        currentUserId: state.currentUserId,
        currentRole: state.currentRole,
        inspectionDrafts: state.inspectionDrafts,
        uiFilters: state.uiFilters,
      }),
    }
  )
)

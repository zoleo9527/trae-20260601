import { create } from 'zustand'
import type {
  AppState,
  User,
  Rectification,
  RectificationStatus,
  Reinspection,
  ReinspectionStatus,
  OperationLog,
  RectificationMaterial,
  RejectRecord,
  SupplementRecord,
  ScheduleRecord,
} from '@/types'
import { initialState } from '@/data/mock'
import { uid } from '@/utils/format'

const STORAGE_KEY = 'inspection-station-state-v2'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && parsed.vehicles) return parsed
    }
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(initialState))
}

function persist(state: AppState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

interface AppStore extends AppState {
  switchUser: (user: User) => void
  updateRectification: (id: string, patch: Partial<Rectification>) => void
  submitRectification: (id: string, materials: RectificationMaterial[], description?: string) => void
  auditRectification: (id: string, pass: boolean, reason?: string, rejectedItems?: string[]) => void
  addRectification: (rect: Omit<Rectification, 'id' | 'rejectHistory' | 'supplementHistory' | 'rejectCount' | 'materials'> & { materials?: RectificationMaterial[] }) => void
  supplementRectification: (id: string, materials: RectificationMaterial[], description: string) => void
  updateReinspection: (id: string, patch: Partial<Reinspection>) => void
  scheduleReinspection: (ids: string[], patch: Pick<Reinspection, 'scheduledTime' | 'lane'>, reschedule?: boolean) => void
  cancelReinspectionSchedule: (id: string, reason: string) => void
  completeReinspection: (id: string, pass: boolean, failedItems?: any[]) => void
  addReinspection: (re: Omit<Reinspection, 'id' | 'scheduleHistory'>) => void
  resolveAbnormal: (id: string, remark: string) => void
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void
  reset: () => void
}

export const useStore = create<AppStore>((set, get) => ({
  ...loadState(),

  switchUser: (user) => {
    set({ currentUser: user })
    persist(get())
  },

  updateRectification: (id, patch) => {
    const rects = get().rectifications.map(r => r.id === id ? { ...r, ...patch } : r)
    set({ rectifications: rects })
    persist(get())
  },

  submitRectification: (id, materials, description) => {
    const user = get().currentUser
    const now = new Date().toISOString()
    const target = get().rectifications.find(r => r.id === id)
    if (!target) return

    const supRecord: SupplementRecord = {
      id: uid('sup_'),
      handlerId: user.id,
      handlerName: user.name,
      materials,
      description: description || '提交整改材料',
      timestamp: now,
    }

    const rects = get().rectifications.map(r => r.id === id ? {
      ...r,
      status: 'submitted' as RectificationStatus,
      materials: [...r.materials, ...materials],
      submittedAt: now,
      supplementHistory: [...r.supplementHistory, supRecord],
    } : r)
    set({ rectifications: rects })

    get().addLog({
      vehicleId: target.vehicleId,
      rectificationId: target.id,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operatorRoleLabel: user.roleLabel,
      action: target.rejectCount > 0 ? '补录整改材料' : '提交整改材料',
      content: target.rejectCount > 0
        ? `补录 ${materials.length} 份凭证（第 ${target.rejectCount + 1} 次提交）：${description || ''}`
        : `首次提交 ${materials.length} 份凭证：${description || ''}`,
    })
    persist(get())
  },

  supplementRectification: (id, materials, description) => {
    const user = get().currentUser
    const now = new Date().toISOString()
    const target = get().rectifications.find(r => r.id === id)
    if (!target) return

    const supRecord: SupplementRecord = {
      id: uid('sup_'),
      handlerId: user.id,
      handlerName: user.name,
      materials,
      description,
      timestamp: now,
    }

    const rects = get().rectifications.map(r => r.id === id ? {
      ...r,
      materials: [...r.materials, ...materials],
      supplementHistory: [...r.supplementHistory, supRecord],
    } : r)
    set({ rectifications: rects })

    get().addLog({
      vehicleId: target.vehicleId,
      rectificationId: target.id,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operatorRoleLabel: user.roleLabel,
      action: '补录整改材料',
      content: `补录 ${materials.length} 份：${description}`,
    })
    persist(get())
  },

  auditRectification: (id, pass, reason, rejectedItems = []) => {
    const user = get().currentUser
    const now = new Date().toISOString()
    const target = get().rectifications.find(r => r.id === id)
    if (!target) return

    let newRejectHistory = target.rejectHistory
    if (!pass) {
      const rec: RejectRecord = {
        id: uid('rej_'),
        auditorId: user.id,
        auditorName: user.name,
        reason: reason || '整改不符合要求',
        timestamp: now,
        rejectedItems,
      }
      newRejectHistory = [...target.rejectHistory, rec]
    }

    const rects = get().rectifications.map(r => r.id === id ? {
      ...r,
      status: (pass ? 'passed' : 'rejected') as RectificationStatus,
      latestRejectReason: pass ? r.latestRejectReason : (reason || r.latestRejectReason),
      rejectCount: pass ? r.rejectCount : r.rejectCount + 1,
      rejectHistory: newRejectHistory,
      auditorId: user.id,
      auditorName: user.name,
      auditedAt: now,
    } : r)
    set({ rectifications: rects })

    get().addLog({
      vehicleId: target.vehicleId,
      rectificationId: target.id,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operatorRoleLabel: user.roleLabel,
      action: pass ? '审核通过' : '驳回整改',
      content: pass
        ? `整改合格，第 ${target.rejectCount + 1} 次提交通过`
        : `第 ${target.rejectCount + 1} 次驳回：${reason || '整改不符合要求'}`,
    })

    if (pass) {
      const exist = get().reinspections.find(re => re.inspectionId === target.inspectionId)
      if (!exist) {
        get().addReinspection({
          inspectionId: target.inspectionId,
          vehicleId: target.vehicleId,
          status: 'pending' as ReinspectionStatus,
          remark: '整改通过，待安排复检',
        })
        get().addLog({
          vehicleId: target.vehicleId,
          inspectionId: target.inspectionId,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role,
          operatorRoleLabel: user.roleLabel,
          action: '生成复检待办',
          content: `整改审核通过（${target.rejectCount > 0 ? `历经 ${target.rejectCount} 次驳回` : '一次通过'}），待安排复检`,
        })
      } else if (exist.status === 'abnormal' || exist.status === 'cancelled') {
        get().updateReinspection(exist.id, { status: 'pending', remark: '整改更新通过，待重新安排' })
      }
    }
    persist(get())
  },

  addRectification: (rect) => {
    const id = uid('r_')
    const user = get().currentUser
    const now = new Date().toISOString()
    const newRect: Rectification = {
      id,
      rejectCount: 0,
      materials: rect.materials || [],
      rejectHistory: [],
      supplementHistory: [],
      ...rect,
      status: rect.status || 'pending',
    } as Rectification
    set({ rectifications: [newRect, ...get().rectifications] })
    get().addLog({
      vehicleId: rect.vehicleId,
      rectificationId: id,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operatorRoleLabel: user.roleLabel,
      action: '创建整改任务',
      content: rect.description || '新整改任务',
      timestamp: now,
    } as any)
    persist(get())
  },

  updateReinspection: (id, patch) => {
    const list = get().reinspections.map(re => re.id === id ? { ...re, ...patch } : re)
    set({ reinspections: list })
    persist(get())
  },

  scheduleReinspection: (ids, patch, reschedule = false) => {
    const user = get().currentUser
    const now = new Date().toISOString()
    const list = get().reinspections.map(re => {
      if (!ids.includes(re.id)) return re
      const schedRec: ScheduleRecord = {
        id: uid('sch_'),
        arrangedById: user.id,
        arrangedByName: user.name,
        scheduledTime: patch.scheduledTime!,
        lane: patch.lane!,
        timestamp: now,
      }
      const prevHistory = re.scheduleHistory ? [...re.scheduleHistory] : []
      return {
        ...re,
        status: 'scheduled' as ReinspectionStatus,
        scheduledTime: patch.scheduledTime,
        lane: patch.lane,
        arrangedBy: user.id,
        arrangedByName: user.name,
        arrangedAt: now,
        scheduleHistory: [...prevHistory, schedRec],
      }
    })
    set({ reinspections: list })
    ids.forEach(id => {
      const re = list.find(x => x.id === id)
      if (re) {
        get().addLog({
          vehicleId: re.vehicleId,
          reinspectionId: id,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role,
          operatorRoleLabel: user.roleLabel,
          action: reschedule ? '改排复检' : '安排复检',
          content: `${patch.scheduledTime?.slice(0, 16).replace('T', ' ')} · ${patch.lane}${reschedule ? '（改排）' : ''}`,
        })
      }
    })
    persist(get())
  },

  cancelReinspectionSchedule: (id, reason) => {
    const user = get().currentUser
    const now = new Date().toISOString()
    const target = get().reinspections.find(re => re.id === id)
    if (!target || !target.scheduleHistory || target.scheduleHistory.length === 0) return

    const updatedHistory = [...target.scheduleHistory]
    const last = updatedHistory[updatedHistory.length - 1]
    updatedHistory[updatedHistory.length - 1] = {
      ...last,
      cancelReason: reason,
      cancelledAt: now,
    }

    set({
      reinspections: get().reinspections.map(re =>
        re.id === id
          ? { ...re, status: 'pending' as ReinspectionStatus, scheduleHistory: updatedHistory }
          : re
      ),
    })
    get().addLog({
      vehicleId: target.vehicleId,
      reinspectionId: id,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operatorRoleLabel: user.roleLabel,
      action: '取消复检安排',
      content: reason,
    })
    persist(get())
  },

  completeReinspection: (id, pass, failedItems = []) => {
    const user = get().currentUser
    const now = new Date().toISOString()
    const target = get().reinspections.find(re => re.id === id)
    if (!target) return

    const inspection = get().inspections.find(i => i.id === target.inspectionId)
    const passedItems = inspection?.defectItems.map(d => d.name) || []

    set({
      reinspections: get().reinspections.map(re =>
        re.id === id
          ? {
              ...re,
              status: 'completed' as ReinspectionStatus,
              result: pass ? 'passed' : 'failed',
              inspectorId: user.id,
              inspectorName: user.name,
              completedAt: now,
              resultDetail: {
                passedItems: pass ? passedItems : passedItems.filter(n => !failedItems.some((f: any) => f.name === n)),
                failedItems,
                completedBy: user.name,
                completedAt: now,
              },
            }
          : re
      ),
    })
    get().addLog({
      vehicleId: target.vehicleId,
      reinspectionId: id,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operatorRoleLabel: user.roleLabel,
      action: '复检完成',
      content: pass
        ? '复检合格，全部不合格项已整改到位'
        : `复检仍不合格：${failedItems.map((f: any) => f.name).join('、')}`,
    })
    persist(get())
  },

  addReinspection: (re) => {
    const id = uid('re_')
    set({
      reinspections: [
        { id, scheduleHistory: [], ...re },
        ...get().reinspections,
      ],
    })
    persist(get())
  },

  resolveAbnormal: (id, remark) => {
    const user = get().currentUser
    const now = new Date().toISOString()
    const target = get().reinspections.find(re => re.id === id)
    if (!target) return
    set({
      reinspections: get().reinspections.map(re =>
        re.id === id
          ? { ...re, status: 'pending' as ReinspectionStatus, remark, abnormalReason: `${re.abnormalReason}（已处理）` }
          : re
      ),
    })
    get().addLog({
      vehicleId: target.vehicleId,
      reinspectionId: id,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operatorRoleLabel: user.roleLabel,
      action: '处理复检异常',
      content: remark,
    })
    persist(get())
  },

  addLog: (log) => {
    const full: OperationLog = {
      id: uid('log_'),
      timestamp: new Date().toISOString(),
      ...log,
    }
    set({ logs: [full, ...get().logs] })
  },

  reset: () => {
    const fresh = JSON.parse(JSON.stringify(initialState)) as AppState
    set(fresh)
    persist(fresh)
  },
}))

export function useVehicle(vehicleId: string) {
  return useStore(s => s.vehicles.find(v => v.id === vehicleId))
}

export function useInspection(inspectionId: string) {
  return useStore(s => s.inspections.find(i => i.id === inspectionId))
}

export function useRectificationByInspection(inspectionId: string) {
  return useStore(s => s.rectifications.find(r => r.inspectionId === inspectionId))
}

export function useReinspectionByInspection(inspectionId: string) {
  return useStore(s => s.reinspections.find(re => re.inspectionId === inspectionId))
}

export function useVehicleLogs(vehicleId: string) {
  return useStore(s => s.logs.filter(l => l.vehicleId === vehicleId))
}

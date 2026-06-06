import type { ApiResponse } from '@/types'
import { db } from './database'

export async function apiRequest<T>(
  handler: () => T,
  options?: { delay?: number }
): Promise<ApiResponse<T>> {
  const delay = options?.delay ?? 100

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const data = handler()
        resolve({ success: true, data })
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }, delay)
  })
}

export const apiClient = {
  inventory: {
    list: () => apiRequest(() => db.getState().inventoryItems),
    get: (id: string) =>
      apiRequest(() => {
        const item = db.getState().inventoryItems.find((i) => i.id === id)
        if (!item) throw new Error('Inventory item not found')
        return item
      }),
    update: (id: string, updates: Partial<import('@/types').InventoryItem>) =>
      apiRequest(() => {
        let result: import('@/types').InventoryItem | undefined
        db.setState((state) => ({
          ...state,
          inventoryItems: state.inventoryItems.map((item) => {
            if (item.id === id) {
              result = { ...item, ...updates, updatedAt: new Date().toISOString() }
              return result
            }
            return item
          }),
        }))
        if (!result) throw new Error('Inventory item not found')
        return result
      }),
    addRemark: (id: string, remark: import('@/types').Remark) =>
      apiRequest(() => {
        let result: import('@/types').InventoryItem | undefined
        db.setState((state) => ({
          ...state,
          inventoryItems: state.inventoryItems.map((item) => {
            if (item.id === id) {
              result = {
                ...item,
                remarks: [...item.remarks, remark],
                updatedAt: new Date().toISOString(),
              }
              return result
            }
            return item
          }),
        }))
        if (!result) throw new Error('Inventory item not found')
        return result
      }),
    addAttachment: (id: string, attachment: import('@/types').Attachment) =>
      apiRequest(() => {
        let result: import('@/types').InventoryItem | undefined
        db.setState((state) => ({
          ...state,
          inventoryItems: state.inventoryItems.map((item) => {
            if (item.id === id) {
              result = {
                ...item,
                attachments: [...item.attachments, attachment],
                updatedAt: new Date().toISOString(),
              }
              return result
            }
            return item
          }),
        }))
        if (!result) throw new Error('Inventory item not found')
        return result
      }),
    linkToScreening: (inventoryId: string, screeningId: string) =>
      apiRequest(() => {
        db.setState((state) => ({
          ...state,
          inventoryItems: state.inventoryItems.map((item) =>
            item.id === inventoryId
              ? {
                  ...item,
                  relatedScreeningIds: item.relatedScreeningIds.includes(screeningId)
                    ? item.relatedScreeningIds
                    : [...item.relatedScreeningIds, screeningId],
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
          screenings: state.screenings.map((s) =>
            s.id === screeningId
              ? {
                  ...s,
                  inventoryIds: s.inventoryIds.includes(inventoryId)
                    ? s.inventoryIds
                    : [...s.inventoryIds, inventoryId],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }))
        return { success: true }
      }),
    syncToScreenings: (inventoryId: string) =>
      apiRequest(() => {
        const state = db.getState()
        const inventory = state.inventoryItems.find((i) => i.id === inventoryId)
        if (!inventory) throw new Error('Inventory item not found')

        db.setState((state) => ({
          ...state,
          screenings: state.screenings.map((s) => {
            if (!inventory.relatedScreeningIds.includes(s.id)) return s

            const newRemarks = inventory.remarks.filter(
              (r) => !s.syncedRemarks.includes(r.id)
            )
            const newAttachments = inventory.attachments.filter(
              (a) => !s.syncedAttachments.includes(a.id)
            )

            if (newRemarks.length === 0 && newAttachments.length === 0) return s

            return {
              ...s,
              remarks: [
                ...s.remarks,
                ...newRemarks.map((r) => ({
                  ...r,
                  id: `${r.id}_synced_${Date.now()}`,
                  sourceId: s.id,
                  type: 'screening' as const,
                })),
              ],
              attachments: [
                ...s.attachments,
                ...newAttachments.map((a) => ({
                  ...a,
                  id: `${a.id}_synced_${Date.now()}`,
                  sourceId: s.id,
                  sourceType: 'screening' as const,
                })),
              ],
              syncedRemarks: [...s.syncedRemarks, ...newRemarks.map((r) => r.id)],
              syncedAttachments: [...s.syncedAttachments, ...newAttachments.map((a) => a.id)],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
        return { success: true }
      }),
  },

  screenings: {
    list: () => apiRequest(() => db.getState().screenings),
    get: (id: string) =>
      apiRequest(() => {
        const s = db.getState().screenings.find((x) => x.id === id)
        if (!s) throw new Error('Screening not found')
        return s
      }),
    update: (id: string, updates: Partial<import('@/types').Screening>) =>
      apiRequest(() => {
        let result: import('@/types').Screening | undefined
        db.setState((state) => ({
          ...state,
          screenings: state.screenings.map((s) => {
            if (s.id === id) {
              result = { ...s, ...updates, updatedAt: new Date().toISOString() }
              return result
            }
            return s
          }),
        }))
        if (!result) throw new Error('Screening not found')
        return result
      }),
    addRemark: (id: string, remark: import('@/types').Remark) =>
      apiRequest(() => {
        let result: import('@/types').Screening | undefined
        db.setState((state) => ({
          ...state,
          screenings: state.screenings.map((s) => {
            if (s.id === id) {
              result = {
                ...s,
                remarks: [...s.remarks, remark],
                updatedAt: new Date().toISOString(),
              }
              return result
            }
            return s
          }),
        }))
        if (!result) throw new Error('Screening not found')
        return result
      }),
    addAttachment: (id: string, attachment: import('@/types').Attachment) =>
      apiRequest(() => {
        let result: import('@/types').Screening | undefined
        db.setState((state) => ({
          ...state,
          screenings: state.screenings.map((s) => {
            if (s.id === id) {
              result = {
                ...s,
                attachments: [...s.attachments, attachment],
                updatedAt: new Date().toISOString(),
              }
              return result
            }
            return s
          }),
        }))
        if (!result) throw new Error('Screening not found')
        return result
      }),
    completeReconciliation: (id: string, operatorId: string, operatorName: string) =>
      apiRequest(() => {
        const state = db.getState()
        const screening = state.screenings.find((s) => s.id === id)
        if (!screening) throw new Error('Screening not found')

        db.setState((state) => ({
          ...state,
          screenings: state.screenings.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: 'completed',
                  operatorId,
                  operatorName,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          exceptions: state.exceptions.map((e) =>
            e.screeningId === id && e.status !== 'resolved'
              ? {
                  ...e,
                  status: 'resolved',
                  handlerId: operatorId,
                  handlerName: operatorName,
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
          todos: state.todos.map((t) =>
            t.relatedType === 'screening' && t.relatedId === id && !t.completed
              ? { ...t, completed: true }
              : t
          ),
        }))
        return { success: true }
      }),
  },

  exceptions: {
    list: () => apiRequest(() => db.getState().exceptions),
    get: (id: string) =>
      apiRequest(() => {
        const e = db.getState().exceptions.find((x) => x.id === id)
        if (!e) throw new Error('Exception not found')
        return e
      }),
    create: (exception: Omit<import('@/types').ExceptionRecord, 'id' | 'createdAt' | 'updatedAt' | 'remarks' | 'attachments'>) =>
      apiRequest(() => {
        const newException: import('@/types').ExceptionRecord = {
          ...exception,
          id: db.generateId(),
          remarks: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        db.setState((state) => ({
          ...state,
          exceptions: [newException, ...state.exceptions],
        }))
        return newException
      }),
    update: (id: string, updates: Partial<import('@/types').ExceptionRecord>) =>
      apiRequest(() => {
        let result: import('@/types').ExceptionRecord | undefined
        db.setState((state) => ({
          ...state,
          exceptions: state.exceptions.map((e) => {
            if (e.id === id) {
              result = { ...e, ...updates, updatedAt: new Date().toISOString() }
              return result
            }
            return e
          }),
        }))
        if (!result) throw new Error('Exception not found')
        return result
      }),
    addRemark: (id: string, remark: import('@/types').Remark) =>
      apiRequest(() => {
        let result: import('@/types').ExceptionRecord | undefined
        db.setState((state) => ({
          ...state,
          exceptions: state.exceptions.map((e) => {
            if (e.id === id) {
              result = {
                ...e,
                remarks: [...e.remarks, remark],
                updatedAt: new Date().toISOString(),
              }
              return result
            }
            return e
          }),
        }))
        if (!result) throw new Error('Exception not found')
        return result
      }),
    addAttachment: (id: string, attachment: import('@/types').Attachment) =>
      apiRequest(() => {
        let result: import('@/types').ExceptionRecord | undefined
        db.setState((state) => ({
          ...state,
          exceptions: state.exceptions.map((e) => {
            if (e.id === id) {
              result = {
                ...e,
                attachments: [...e.attachments, attachment],
                updatedAt: new Date().toISOString(),
              }
              return result
            }
            return e
          }),
        }))
        if (!result) throw new Error('Exception not found')
        return result
      }),
  },

  audit: {
    list: () => apiRequest(() => db.getState().operationLogs),
    add: (log: Omit<import('@/types').OperationLog, 'id' | 'timestamp'>) =>
      apiRequest(() => {
        const newLog: import('@/types').OperationLog = {
          ...log,
          id: db.generateId(),
          timestamp: new Date().toISOString(),
        }
        db.setState((state) => ({
          ...state,
          operationLogs: [newLog, ...state.operationLogs],
        }))
        return newLog
      }),
  },

  todos: {
    list: () => apiRequest(() => db.getState().todos),
    update: (id: string, updates: Partial<import('@/types').TodoItem>) =>
      apiRequest(() => {
        let result: import('@/types').TodoItem | undefined
        db.setState((state) => ({
          ...state,
          todos: state.todos.map((t) => {
            if (t.id === id) {
              result = { ...t, ...updates }
              return result
            }
            return t
          }),
        }))
        if (!result) throw new Error('Todo not found')
        return result
      }),
  },

  risks: {
    list: () => apiRequest(() => db.getState().risks),
    update: (id: string, updates: Partial<import('@/types').RiskItem>) =>
      apiRequest(() => {
        let result: import('@/types').RiskItem | undefined
        db.setState((state) => ({
          ...state,
          risks: state.risks.map((r) => {
            if (r.id === id) {
              result = { ...r, ...updates }
              return result
            }
            return r
          }),
        }))
        if (!result) throw new Error('Risk not found')
        return result
      }),
  },

  auth: {
    getCurrentUser: () => apiRequest(() => db.getState().users[0]),
    listUsers: () => apiRequest(() => db.getState().users),
    switchRole: (userId: string, role: import('@/types').Role) =>
      apiRequest(() => {
        let result: import('@/types').User | undefined
        db.setState((state) => ({
          ...state,
          users: state.users.map((u) => {
            if (u.id === userId) {
              result = { ...u, role }
              return result
            }
            return u
          }),
        }))
        if (!result) throw new Error('User not found')
        return result
      }),
  },
}

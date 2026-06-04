import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Recipe,
  Batch,
  Feeding,
  BatchStateLog,
  Packaging,
  Alert,
  FeedingChangeLog,
  BackupInfo,
  UserRole,
  BatchStatus,
  FeedingIngredient,
  AlertType,
  AlertLevel,
  BATCH_STATUS_LABELS,
} from '../types'
import {
  mockRecipes,
  mockBatches,
  mockFeedings,
  mockAlerts,
  mockPackaging,
  mockBatchStateLogs,
  mockFeedingChangeLogs,
} from '../data/mockData'

interface BreweryState {
  recipes: Recipe[]
  feedings: Feeding[]
  batches: Batch[]
  batchStateLogs: BatchStateLog[]
  packagingRecords: Packaging[]
  alerts: Alert[]
  feedingChangeLogs: FeedingChangeLog[]
  backups: BackupInfo[]
  currentRole: UserRole
  currentUser: string

  setCurrentRole: (role: UserRole) => void
  setCurrentUser: (user: string) => void

  addFeeding: (feeding: Omit<Feeding, 'id'>) => void
  updateFeeding: (id: string, updates: Partial<Feeding>, reason?: string) => void

  addBatch: (batch: Omit<Batch, 'id' | 'lastStatusUpdate'>) => void
  updateBatch: (id: string, updates: Partial<Batch>) => void
  updateBatchStatus: (batchId: string, status: BatchStatus, reason: string) => void

  addPackaging: (packaging: Omit<Packaging, 'id'>) => void
  rejectPackaging: (batchId: string, reason: string) => void

  createAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'status'>) => void
  resolveAlert: (alertId: string, handler: string, resolution: string) => void
  rejectAlert: (alertId: string, handler: string, resolution: string) => void

  exportData: () => string
  importData: (jsonString: string) => boolean
  createBackup: () => BackupInfo
  restoreBackup: (backupId: string) => boolean
  deleteBackup: (backupId: string) => void

  resetToMockData: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const getFeedingDeviations = (
  ingredients: FeedingIngredient[],
  recipeId: string,
  recipes: Recipe[]
): { deviations: string[]; hasWarning: boolean; hasCritical: boolean } => {
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return { deviations: [], hasWarning: false, hasCritical: false }

  const deviations: string[] = []
  let hasWarning = false
  let hasCritical = false

  ingredients.forEach((ing) => {
    const recipeIng = recipe.ingredients.find((ri) => ri.name === ing.name)
    if (recipeIng) {
      const deviation = ((ing.amount - recipeIng.amount) / recipeIng.amount) * 100
      if (Math.abs(deviation) >= 5) {
        deviations.push(`${ing.name}: ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`)
        if (Math.abs(deviation) >= 10) {
          hasCritical = true
        } else {
          hasWarning = true
        }
      }
    }
  })

  return { deviations, hasWarning, hasCritical }
}

export const useBreweryStore = create<BreweryState>()(
  persist(
    (set, get) => ({
      recipes: mockRecipes,
      feedings: mockFeedings,
      batches: mockBatches,
      batchStateLogs: mockBatchStateLogs,
      packagingRecords: mockPackaging,
      alerts: mockAlerts,
      feedingChangeLogs: mockFeedingChangeLogs,
      backups: [],
      currentRole: 'admin',
      currentUser: '系统管理员',

      setCurrentRole: (role) => set({ currentRole: role }),
      setCurrentUser: (user) => set({ currentUser: user }),

      addFeeding: (feeding) => {
        const feedingId = generateId()
        const newFeeding: Feeding = { ...feeding, id: feedingId }

        const { deviations, hasWarning, hasCritical } = getFeedingDeviations(
          feeding.ingredients,
          feeding.recipeId,
          get().recipes
        )

        const batch = get().batches.find((b) => b.id === feeding.batchId)
        if (batch) {
          const now = new Date().toISOString()
          const stateLogs: BatchStateLog[] = []

          if (batch.status !== 'FEEDING') {
            stateLogs.push({
              id: generateId(),
              batchId: feeding.batchId,
              fromStatus: batch.status,
              toStatus: 'FEEDING',
              operator: get().currentUser,
              operatorRole: get().currentRole,
              reason: '开始投料',
              changeTime: now,
            })
          }

          stateLogs.push({
            id: generateId(),
            batchId: feeding.batchId,
            fromStatus: 'FEEDING',
            toStatus: 'FERMENTING',
            operator: get().currentUser,
            operatorRole: get().currentRole,
            reason: '投料完成，转入主发酵',
            changeTime: now,
          })

          const totalGravity = feeding.ingredients.reduce((sum, ing) => {
            if (ing.name.includes('麦芽')) {
              return sum + ing.amount * (ing.unit === 'g' || ing.unit === 'ml' ? 0.001 : 1) * 0.03
            }
            return sum
          }, 0)
          const originalGravity = 1 + (totalGravity / feeding.totalWeight) * 0.8

          set((state) => ({
            batches: state.batches.map((b) =>
              b.id === feeding.batchId
                ? {
                    ...b,
                    status: 'FERMENTING',
                    feedingId: feedingId,
                    originalGravity: Math.max(b.originalGravity, parseFloat(originalGravity.toFixed(3))),
                    gravity: Math.max(b.gravity, parseFloat(originalGravity.toFixed(3))),
                    lastStatusUpdate: now,
                  }
                : b
            ),
            batchStateLogs: [...state.batchStateLogs, ...stateLogs],
          }))
        }

        if (deviations.length > 0) {
          const alertType: AlertType = 'feeding_deviation'
          const alertLevel: AlertLevel = hasCritical ? 'critical' : hasWarning ? 'warning' : 'info'

          const newAlert: Omit<Alert, 'id' | 'createdAt' | 'status'> = {
            batchId: feeding.batchId,
            feedingId: feedingId,
            type: alertType,
            level: alertLevel,
            message: `投料偏差：${deviations.join('；')}`,
          }
          get().createAlert(newAlert)
        }

        set((state) => ({
          feedings: [...state.feedings, newFeeding],
        }))
      },

      updateFeeding: (id, updates, reason) => {
        const feeding = get().feedings.find((f) => f.id === id)
        if (!feeding) return

        const changeLogs: FeedingChangeLog[] = []
        const now = new Date().toISOString()

        Object.entries(updates).forEach(([key, value]) => {
          if (key === 'ingredients') {
            const oldIngs = feeding.ingredients
              .map((i) => `${i.name}: ${i.amount}${i.unit}`)
              .join(', ')
            const newIngs = (value as FeedingIngredient[])
              .map((i) => `${i.name}: ${i.amount}${i.unit}`)
              .join(', ')

            if (oldIngs !== newIngs) {
              changeLogs.push({
                id: generateId(),
                feedingId: id,
                fieldName: key,
                oldValue: oldIngs,
                newValue: newIngs,
                operator: get().currentUser,
                operatorRole: get().currentRole,
                changeTime: now,
                reason,
              })
            }
          } else {
            const oldValue = String(feeding[key as keyof Feeding])
            const newValue = String(value)
            if (oldValue !== newValue) {
              changeLogs.push({
                id: generateId(),
                feedingId: id,
                fieldName: key,
                oldValue,
                newValue,
                operator: get().currentUser,
                operatorRole: get().currentRole,
                changeTime: now,
                reason,
              })
            }
          }
        })

        if (changeLogs.length > 0) {
          const batch = get().batches.find((b) => b.id === feeding.batchId)
          if (batch && batch.status !== 'ABNORMAL') {
            const alert: Omit<Alert, 'id' | 'createdAt' | 'status'> = {
              batchId: feeding.batchId,
              feedingId: id,
              type: 'feeding_changed',
              level: 'warning',
              message: `投料记录已修改：${changeLogs.map((c) => c.fieldName).join(', ')}`,
            }
            get().createAlert(alert)
          }

          set((state) => ({
            feedings: state.feedings.map((f) =>
              f.id === id ? { ...f, ...updates, status: 'modified' } : f
            ),
            feedingChangeLogs: [...state.feedingChangeLogs, ...changeLogs],
          }))
        } else {
          set((state) => ({
            feedings: state.feedings.map((f) => (f.id === id ? { ...f, ...updates } : f)),
          }))
        }
      },

      addBatch: (batch) => {
        const newBatch: Batch = {
          ...batch,
          id: generateId(),
          lastStatusUpdate: new Date().toISOString(),
        }
        set((state) => ({
          batches: [...state.batches, newBatch],
        }))
      },

      updateBatch: (id, updates) => {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }))
      },

      updateBatchStatus: (batchId, status, reason) => {
        const batch = get().batches.find((b) => b.id === batchId)
        if (!batch) return

        const newStateLog: BatchStateLog = {
          id: generateId(),
          batchId,
          fromStatus: batch.status,
          toStatus: status,
          operator: get().currentUser,
          operatorRole: get().currentRole,
          reason,
          changeTime: new Date().toISOString(),
        }

        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === batchId ? { ...b, status, lastStatusUpdate: new Date().toISOString() } : b
          ),
          batchStateLogs: [...state.batchStateLogs, newStateLog],
        }))
      },

      addPackaging: (packaging) => {
        const newPackaging: Packaging = { ...packaging, id: generateId() }
        const batch = get().batches.find((b) => b.id === packaging.batchId)

        if (batch) {
          if (packaging.qualityStatus === 'pass') {
            get().updateBatchStatus(packaging.batchId, 'PACKAGED', '包装质检通过，完成包装')
          } else if (packaging.qualityStatus === 'fail') {
            get().updateBatchStatus(packaging.batchId, 'ABNORMAL', `包装质检不合格：${packaging.notes || '未说明原因'}`)

            const alert: Omit<Alert, 'id' | 'createdAt' | 'status'> = {
              batchId: packaging.batchId,
              type: 'quality_issue',
              level: 'critical',
              message: `包装质检不合格，请退回处理。原因：${packaging.notes || '未说明'}`,
            }
            get().createAlert(alert)
          }
        }

        set((state) => ({
          packagingRecords: [...state.packagingRecords, newPackaging],
        }))
      },

      rejectPackaging: (batchId: string, reason: string) => {
        const batch = get().batches.find((b) => b.id === batchId)
        if (!batch) return

        const previousStatus: BatchStatus = batch.status === 'PACKAGED' ? 'READY' : 'CONDITIONING'
        get().updateBatchStatus(batchId, previousStatus, `包装质检退回：${reason}`)

        const alert: Omit<Alert, 'id' | 'createdAt' | 'status'> = {
          batchId,
          type: 'quality_issue',
          level: 'warning',
          message: `批次已退回至${BATCH_STATUS_LABELS[previousStatus]}，原因：${reason}`,
        }
        get().createAlert(alert)
      },

      createAlert: (alert) => {
        const newAlert: Alert = {
          ...alert,
          id: generateId(),
          createdAt: new Date().toISOString(),
          status: 'pending',
        }
        set((state) => ({
          alerts: [...state.alerts, newAlert],
        }))
      },

      resolveAlert: (alertId, handler, resolution) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? { ...a, status: 'resolved', handler, resolvedAt: new Date().toISOString(), resolution }
              : a
          ),
        }))
      },

      rejectAlert: (alertId, handler, resolution) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? { ...a, status: 'rejected', handler, resolvedAt: new Date().toISOString(), resolution }
              : a
          ),
        }))
      },

      exportData: () => {
        const state = get()
        const exportData = {
          recipes: state.recipes,
          feedings: state.feedings,
          batches: state.batches,
          batchStateLogs: state.batchStateLogs,
          packagingRecords: state.packagingRecords,
          alerts: state.alerts,
          feedingChangeLogs: state.feedingChangeLogs,
          exportedAt: new Date().toISOString(),
        }
        return JSON.stringify(exportData, null, 2)
      },

      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString)
          set({
            recipes: data.recipes || [],
            feedings: data.feedings || [],
            batches: data.batches || [],
            batchStateLogs: data.batchStateLogs || [],
            packagingRecords: data.packagingRecords || [],
            alerts: data.alerts || [],
            feedingChangeLogs: data.feedingChangeLogs || [],
          })
          return true
        } catch {
          return false
        }
      },

      createBackup: () => {
        const state = get()
        const backup: BackupInfo = {
          id: generateId(),
          name: `备份-${new Date().toLocaleString('zh-CN')}`,
          createdAt: new Date().toISOString(),
          size: new Blob([JSON.stringify(state)]).size,
          recordCount: {
            batches: state.batches.length,
            feedings: state.feedings.length,
            recipes: state.recipes.length,
            packaging: state.packagingRecords.length,
            alerts: state.alerts.length,
          },
        }

        const backupData = {
          ...backup,
          data: {
            recipes: state.recipes,
            feedings: state.feedings,
            batches: state.batches,
            batchStateLogs: state.batchStateLogs,
            packagingRecords: state.packagingRecords,
            alerts: state.alerts,
            feedingChangeLogs: state.feedingChangeLogs,
          },
        }

        const existingBackups = JSON.parse(localStorage.getItem('brewery-backups') || '[]')
        localStorage.setItem('brewery-backups', JSON.stringify([...existingBackups, backupData]))

        set((s) => ({
          backups: [...s.backups, backup],
        }))

        return backup
      },

      restoreBackup: (backupId) => {
        const backups = JSON.parse(localStorage.getItem('brewery-backups') || '[]')
        const backup = backups.find((b: { id: string }) => b.id === backupId)

        if (!backup || !backup.data) return false

        set({
          recipes: backup.data.recipes || [],
          feedings: backup.data.feedings || [],
          batches: backup.data.batches || [],
          batchStateLogs: backup.data.batchStateLogs || [],
          packagingRecords: backup.data.packagingRecords || [],
          alerts: backup.data.alerts || [],
          feedingChangeLogs: backup.data.feedingChangeLogs || [],
        })

        return true
      },

      deleteBackup: (backupId) => {
        const backups = JSON.parse(localStorage.getItem('brewery-backups') || '[]')
        const filtered = backups.filter((b: { id: string }) => b.id !== backupId)
        localStorage.setItem('brewery-backups', JSON.stringify(filtered))

        set((s) => ({
          backups: s.backups.filter((b) => b.id !== backupId),
        }))
      },

      resetToMockData: () => {
        set({
          recipes: mockRecipes,
          feedings: mockFeedings,
          batches: mockBatches,
          batchStateLogs: mockBatchStateLogs,
          packagingRecords: mockPackaging,
          alerts: mockAlerts,
          feedingChangeLogs: mockFeedingChangeLogs,
        })
      },
    }),
    {
      name: 'brewery-storage',
      partialize: (state) => ({
        recipes: state.recipes,
        feedings: state.feedings,
        batches: state.batches,
        batchStateLogs: state.batchStateLogs,
        packagingRecords: state.packagingRecords,
        alerts: state.alerts,
        feedingChangeLogs: state.feedingChangeLogs,
        currentRole: state.currentRole,
        currentUser: state.currentUser,
      }),
    }
  )
)

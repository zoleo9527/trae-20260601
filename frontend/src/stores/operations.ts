import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OperationLog, OperationAction, UserRole } from '../types'
import { mockOperationLogs } from '../mock'
import { useUserStore } from './user'

const STORAGE_KEY = 'pinia_operations_store'

function generateLogId(): string {
  return 'l' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

export const useOperationsStore = defineStore('operations', () => {
  const logs = ref<OperationLog[]>([])

  function saveToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        logs: logs.value,
      })
    )
  }

  function loadFromStorage(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        logs.value = parsed.logs
        return true
      } catch {
        return false
      }
    }
    return false
  }

  function initLogs() {
    if (!loadFromStorage()) {
      logs.value = [...mockOperationLogs]
      saveToStorage()
    }
  }

  function addLog(
    log: Omit<OperationLog, 'id' | 'operatorId' | 'operatorName' | 'operatorRole' | 'timestamp'> &
      Partial<Pick<OperationLog, 'operatorId' | 'operatorName' | 'operatorRole'>>
  ) {
    const userStore = useUserStore()
    const user = userStore.currentUser

    const newLog: OperationLog = {
      id: generateLogId(),
      replacementId: log.replacementId,
      action: log.action,
      operatorId: log.operatorId || user?.id || '',
      operatorName: log.operatorName || user?.name || '',
      operatorRole: log.operatorRole || user?.role || 'technician',
      timestamp: new Date().toISOString(),
      details: log.details,
    }

    logs.value.unshift(newLog)
    saveToStorage()
  }

  function getByReplacementId(id: string): OperationLog[] {
    return logs.value.filter((log) => log.replacementId === id)
  }

  const allLogs = computed(() => logs.value)

  function filteredByAction(action: OperationAction): OperationLog[] {
    return logs.value.filter((log) => log.action === action)
  }

  function filteredByRole(role: UserRole): OperationLog[] {
    return logs.value.filter((log) => log.operatorRole === role)
  }

  return {
    logs,
    initLogs,
    addLog,
    getByReplacementId,
    allLogs,
    filteredByAction,
    filteredByRole,
  }
})

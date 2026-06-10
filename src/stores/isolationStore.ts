import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IsolationRecord } from '@/types'
import { mockApi } from '@/api/mock'

export const useIsolationStore = defineStore('isolation', () => {
  const isolations = ref<IsolationRecord[]>([])

  const activeIsolations = computed(() => isolations.value.filter(i => i.status === 'active'))
  const releasedIsolations = computed(() => isolations.value.filter(i => i.status === 'released'))

  function loadIsolations() {
    isolations.value = mockApi.getIsolations()
  }

  function getIsolationById(id: string): IsolationRecord | undefined {
    return isolations.value.find(i => i.id === id)
  }

  function getIsolationByReportId(reportId: string): IsolationRecord | undefined {
    return isolations.value.find(i => i.reportId === reportId)
  }

  function createIsolation(data: Omit<IsolationRecord, 'id' | 'isolationCode' | 'createdAt' | 'status'>) {
    const newIsolation = mockApi.createIsolation(data)
    isolations.value.push(newIsolation)
    return newIsolation
  }

  function releaseIsolation(id: string) {
    const updated = mockApi.releaseIsolation(id)
    if (updated) {
      const index = isolations.value.findIndex(i => i.id === id)
      if (index !== -1) {
        isolations.value[index] = updated
      }
    }
    return updated
  }

  return {
    isolations,
    activeIsolations,
    releasedIsolations,
    loadIsolations,
    getIsolationById,
    getIsolationByReportId,
    createIsolation,
    releaseIsolation
  }
})

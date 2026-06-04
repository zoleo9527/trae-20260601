import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'
import type { MedicationTask, FollowupTask, DashboardStats, OperationLog } from '@/types'

export const useAppStore = defineStore('app', () => {
  const medicationTasks = ref<MedicationTask[]>([])
  const followupTasks = ref<FollowupTask[]>([])
  const dashboardStats = ref<DashboardStats | null>(null)
  const loading = ref(false)

  async function fetchDashboardStats() {
    loading.value = true
    try {
      const res = await api.getDashboardStats()
      dashboardStats.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchMedicationTasks(params?: any) {
    loading.value = true
    try {
      const res = await api.getMedicationTasks(params)
      medicationTasks.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchFollowupTasks(params?: any) {
    loading.value = true
    try {
      const res = await api.getFollowupTasks(params)
      followupTasks.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function getMedicationDetail(id: string) {
    const res = await api.getMedicationDetail(id)
    return res.data
  }

  async function getFollowupDetail(id: string) {
    const res = await api.getFollowupDetail(id)
    return res.data
  }

  async function processMedication(id: string, data: any) {
    const res = await api.processMedication(id, data)
    return res.data
  }

  async function processFollowup(id: string, data: any) {
    const res = await api.processFollowup(id, data)
    return res.data
  }

  async function getOperationLogs(taskId: string) {
    const res = await api.getOperationLogs(taskId)
    return res.data as OperationLog[]
  }

  return {
    medicationTasks,
    followupTasks,
    dashboardStats,
    loading,
    fetchDashboardStats,
    fetchMedicationTasks,
    fetchFollowupTasks,
    getMedicationDetail,
    getFollowupDetail,
    processMedication,
    processFollowup,
    getOperationLogs
  }
})

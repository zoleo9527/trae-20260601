import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Role, DiseaseReport, ReportStats } from '@/types'
import { mockApi } from '@/api/mock'

export const useReportStore = defineStore('report', () => {
  const storedRole = localStorage.getItem('current_role') as Role | null
  const currentRole = ref<Role | null>(storedRole)
  const reports = ref<DiseaseReport[]>(storedRole ? mockApi.getReports() : [])

  const pendingReports = computed(() => reports.value.filter(r => r.status === 'pending'))
  const confirmedReports = computed(() => reports.value.filter(r => r.status === 'confirmed'))
  const myReports = computed(() => {
    if (!currentRole.value || currentRole.value === 'manager') return []
    return reports.value.filter(r => r.reporterRole === currentRole.value)
  })

  const stats = computed<ReportStats>(() => ({
    total: reports.value.length,
    pending: pendingReports.value.length,
    confirmed: confirmedReports.value.length,
    isolating: reports.value.filter(r => r.status === 'isolating').length,
    resolved: reports.value.filter(r => r.status === 'resolved').length
  }))

  function setRole(role: Role) {
    currentRole.value = role
    localStorage.setItem('current_role', role)
    loadReports()
  }

  function loadReports() {
    reports.value = mockApi.getReports()
  }

  function getReportById(id: string): DiseaseReport | undefined {
    return reports.value.find(r => r.id === id)
  }

  function createReport(data: Omit<DiseaseReport, 'id' | 'reportCode' | 'createdAt' | 'status'>) {
    const newReport = mockApi.createReport(data)
    reports.value.push(newReport)
    return newReport
  }

  function updateReportStatus(id: string, status: DiseaseReport['status'], processedBy?: string, rejectReason?: string) {
    const updated = mockApi.updateReportStatus(id, status, processedBy, rejectReason)
    if (updated) {
      const index = reports.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reports.value[index] = updated
      }
    }
    return updated
  }

  function approveReport(id: string, processedBy: string) {
    return updateReportStatus(id, 'confirmed', processedBy)
  }

  function rejectReport(id: string, processedBy: string, reason: string) {
    return updateReportStatus(id, 'rejected', processedBy, reason)
  }

  return {
    currentRole,
    reports,
    pendingReports,
    confirmedReports,
    myReports,
    stats,
    setRole,
    loadReports,
    getReportById,
    createReport,
    updateReportStatus,
    approveReport,
    rejectReport
  }
})

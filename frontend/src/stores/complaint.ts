import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as complaintApi from '@/api/complaint'

export const useComplaintStore = defineStore('complaint', () => {
  const complaints = ref<any[]>([])
  const currentComplaint = ref<any>(null)
  const loading = ref(false)

  async function fetchComplaints(params?: Record<string, any>) {
    loading.value = true
    try {
      complaints.value = await complaintApi.getComplaints(params)
    } finally {
      loading.value = false
    }
  }

  async function fetchComplaint(id: number) {
    loading.value = true
    try {
      currentComplaint.value = await complaintApi.getComplaint(id)
    } finally {
      loading.value = false
    }
  }

  async function createComplaint(data: any) {
    return await complaintApi.createComplaint(data)
  }

  async function handleComplaint(id: number, data: any) {
    return await complaintApi.handleComplaint(id, data)
  }

  async function fetchComplaintHistory(id: number) {
    return await complaintApi.getComplaintHistory(id)
  }

  return {
    complaints, currentComplaint, loading,
    fetchComplaints, fetchComplaint, createComplaint, handleComplaint, fetchComplaintHistory
  }
})

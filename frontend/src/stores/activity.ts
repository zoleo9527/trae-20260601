import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as activityApi from '@/api/activity'

export const useActivityStore = defineStore('activity', () => {
  const activities = ref<any[]>([])
  const currentActivity = ref<any>(null)
  const loading = ref(false)

  async function fetchActivities(params?: Record<string, any>) {
    loading.value = true
    try {
      activities.value = await activityApi.getActivities(params)
    } finally {
      loading.value = false
    }
  }

  async function fetchActivity(id: number) {
    loading.value = true
    try {
      currentActivity.value = await activityApi.getActivity(id)
    } finally {
      loading.value = false
    }
  }

  async function createActivity(data: any) {
    return await activityApi.createActivity(data)
  }

  async function reviewActivity(id: number, data: any) {
    return await activityApi.reviewActivity(id, data)
  }

  async function fetchActivityHistory(id: number) {
    return await activityApi.getActivityHistory(id)
  }

  return {
    activities, currentActivity, loading,
    fetchActivities, fetchActivity, createActivity, reviewActivity, fetchActivityHistory
  }
})

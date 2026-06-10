import { create } from 'zustand'
import type { ActivityItem } from '@/types'
import { mockActivities } from '@/data/mock'

interface ActivityState {
  activities: ActivityItem[]
  addActivity: (activity: ActivityItem) => void
  getUrgentActivities: () => ActivityItem[]
  getNormalActivities: () => ActivityItem[]
  getRecentActivities: (count: number) => ActivityItem[]
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: mockActivities,
  addActivity: (activity) => {
    set((state) => ({ activities: [activity, ...state.activities] }))
  },
  getUrgentActivities: () => {
    return get().activities.filter((a) => a.priority === 'urgent')
  },
  getNormalActivities: () => {
    return get().activities.filter((a) => a.priority === 'normal')
  },
  getRecentActivities: (count) => {
    return get().activities.slice(0, count)
  },
}))

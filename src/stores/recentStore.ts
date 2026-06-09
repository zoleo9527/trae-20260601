import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RecentItem, RecentItemType } from '@/types'

interface RecentState {
  recentItems: RecentItem[]
  addRecent: (item: Omit<RecentItem, 'id'>) => void
  getByUser: (userId: string) => RecentItem[]
}

const MAX_ITEMS_PER_USER = 20

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      recentItems: [],
      addRecent: (item) =>
        set((state) => {
          const userItems = state.recentItems
            .filter((ri) => ri.userId === item.userId)
            .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt))
          const otherItems = state.recentItems.filter((ri) => ri.userId !== item.userId)
          const newEntry: RecentItem = {
            ...item,
            id: Date.now().toString(),
          }
          const updatedUserItems = [newEntry, ...userItems].slice(0, MAX_ITEMS_PER_USER)
          return { recentItems: [...otherItems, ...updatedUserItems] }
        }),
      getByUser: (userId) =>
        get()
          .recentItems.filter((ri) => ri.userId === userId)
          .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt)),
    }),
    { name: 'dental_recent' }
  )
)

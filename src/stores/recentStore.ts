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
          const { userId, itemType, itemId } = item
          const now = new Date().toISOString()
          
          const existingIndex = state.recentItems.findIndex(
            (ri) => ri.userId === userId && ri.itemType === itemType && ri.itemId === itemId
          )
          
          let updatedItems: RecentItem[]
          
          if (existingIndex >= 0) {
            updatedItems = [...state.recentItems]
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              accessedAt: now,
              itemTitle: item.itemTitle,
            }
          } else {
            const newEntry: RecentItem = {
              ...item,
              id: Date.now().toString(),
              accessedAt: now,
            }
            updatedItems = [newEntry, ...state.recentItems]
          }
          
          const userItems = updatedItems
            .filter((ri) => ri.userId === userId)
            .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt))
            .slice(0, MAX_ITEMS_PER_USER)
          
          const otherItems = updatedItems.filter((ri) => ri.userId !== userId)
          
          return { recentItems: [...otherItems, ...userItems] }
        }),
      getByUser: (userId) =>
        get()
          .recentItems.filter((ri) => ri.userId === userId)
          .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt)),
    }),
    { name: 'dental_recent' }
  )
)

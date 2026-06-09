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
          
          const otherUsersItems = state.recentItems.filter((ri) => ri.userId !== userId)
          
          const currentUserItems = state.recentItems.filter((ri) => ri.userId === userId)
          
          const seen = new Set<string>()
          const deduplicatedUserItems = currentUserItems.filter((ri) => {
            const key = `${ri.itemType}-${ri.itemId}`
            if (seen.has(key)) {
              return false
            }
            seen.add(key)
            return true
          })
          
          const existingIndex = deduplicatedUserItems.findIndex(
            (ri) => ri.itemType === itemType && ri.itemId === itemId
          )
          
          let finalUserItems: RecentItem[]
          
          if (existingIndex >= 0) {
            const updated = [...deduplicatedUserItems]
            updated[existingIndex] = {
              ...updated[existingIndex],
              accessedAt: now,
              itemTitle: item.itemTitle,
            }
            finalUserItems = updated
          } else {
            const newEntry: RecentItem = {
              ...item,
              id: Date.now().toString(),
              accessedAt: now,
            }
            finalUserItems = [newEntry, ...deduplicatedUserItems]
          }
          
          finalUserItems.sort((a, b) => b.accessedAt.localeCompare(a.accessedAt))
          finalUserItems = finalUserItems.slice(0, MAX_ITEMS_PER_USER)
          
          return { recentItems: [...otherUsersItems, ...finalUserItems] }
        }),
      getByUser: (userId) =>
        get()
          .recentItems.filter((ri) => ri.userId === userId)
          .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt)),
    }),
    { name: 'dental_recent' }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Exchange, User, ExchangeStatus, ExchangeResult } from '@/types'

interface ExchangeState {
  exchanges: Exchange[]
  setExchanges: (exchanges: Exchange[]) => void
  addExchange: (data: Omit<Exchange, 'id' | 'status' | 'appliedAt' | 'updatedAt' | 'reviewedById' | 'reviewedByName' | 'reviewedAt' | 'reviewNote' | 'rejectReason' | 'result' | 'resultNote' | 'completedAt' | 'supplementNote' | 'supplementedAt' | 'supplementById' | 'supplementByName' | 'attachmentName' | 'attachmentNote'>, id?: string) => string
  approveExchange: (id: string, reviewNote: string, user: User) => void
  rejectExchange: (id: string, reason: string, user: User) => void
  completeExchange: (id: string, result: ExchangeResult, resultNote: string, user: User) => void
  supplementExchange: (id: string, supplementNote: string, user: User) => void
  resubmitExchange: (id: string, data: Partial<Pick<Exchange, 'reason' | 'expectedHandling'>>) => void
}

export const useExchangeStore = create<ExchangeState>()(
  persist(
    (set) => ({
      exchanges: [],
      setExchanges: (exchanges) => set({ exchanges }),
      addExchange: (data, id) => {
        const newId = id || (Date.now().toString() + Math.random().toString(36).slice(2, 8))
        set((state) => ({
          exchanges: [
            ...state.exchanges,
            {
              ...data,
              id: newId,
              status: 'pending' as ExchangeStatus,
              appliedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              reviewedById: '',
              reviewedByName: '',
              reviewedAt: '',
              reviewNote: '',
              rejectReason: '',
              result: '' as ExchangeResult,
              resultNote: '',
              completedAt: '',
              supplementNote: '',
              supplementedAt: '',
              supplementById: '',
              supplementByName: '',
              attachmentName: '',
              attachmentNote: '',
            },
          ],
        }))
        return newId
      },
      approveExchange: (id, reviewNote, user) =>
        set((state) => ({
          exchanges: state.exchanges.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'approved' as ExchangeStatus,
                  reviewedById: user.id,
                  reviewedByName: user.name,
                  reviewedAt: new Date().toISOString(),
                  reviewNote,
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),
      rejectExchange: (id, reason, user) =>
        set((state) => ({
          exchanges: state.exchanges.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'rejected' as ExchangeStatus,
                  reviewedById: user.id,
                  reviewedByName: user.name,
                  reviewedAt: new Date().toISOString(),
                  rejectReason: reason,
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),
      completeExchange: (id, result, resultNote, user) =>
        set((state) => ({
          exchanges: state.exchanges.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'completed' as ExchangeStatus,
                  result,
                  resultNote,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),
      supplementExchange: (id, supplementNote, user) =>
        set((state) => ({
          exchanges: state.exchanges.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'supplemented' as ExchangeStatus,
                  supplementNote,
                  supplementedAt: new Date().toISOString(),
                  supplementById: user.id,
                  supplementByName: user.name,
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),
      resubmitExchange: (id, data) =>
        set((state) => ({
          exchanges: state.exchanges.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...data,
                  status: 'pending' as ExchangeStatus,
                  reviewedById: '',
                  reviewedByName: '',
                  reviewedAt: '',
                  reviewNote: '',
                  rejectReason: '',
                  result: '' as ExchangeResult,
                  resultNote: '',
                  completedAt: '',
                  supplementNote: '',
                  supplementedAt: '',
                  supplementById: '',
                  supplementByName: '',
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),
    }),
    { name: 'dental_exchanges' }
  )
)

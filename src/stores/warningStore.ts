import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Warning, User, WarningStatus } from '@/types'

interface WarningState {
  warnings: Warning[]
  setWarnings: (warnings: Warning[]) => void
  addWarning: (data: Omit<Warning, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'confirmedById' | 'confirmedByName' | 'confirmedAt' | 'confirmNote' | 'rejectReason'>, id?: string) => string
  confirmWarning: (id: string, confirmNote: string, user: User) => void
  rejectWarning: (id: string, reason: string, user: User) => void
  resubmitWarning: (id: string, data: Partial<Pick<Warning, 'productName' | 'batchNo' | 'expiryDate' | 'quantity' | 'unit' | 'storageLocation' | 'urgency' | 'note'>>) => void
  linkExchange: (warningId: string, exchangeId: string) => void
}

export const useWarningStore = create<WarningState>()(
  persist(
    (set) => ({
      warnings: [],
      setWarnings: (warnings) => set({ warnings }),
      addWarning: (data, id) => {
        const newId = id || (Date.now().toString() + Math.random().toString(36).slice(2, 8))
        set((state) => ({
          warnings: [
            ...state.warnings,
            {
              ...data,
              id: newId,
              status: 'pending' as WarningStatus,
              confirmedById: '',
              confirmedByName: '',
              confirmedAt: '',
              confirmNote: '',
              rejectReason: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }))
        return newId
      },
      confirmWarning: (id, confirmNote, user) =>
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'confirmed' as WarningStatus,
                  confirmedById: user.id,
                  confirmedByName: user.name,
                  confirmedAt: new Date().toISOString(),
                  confirmNote,
                  updatedAt: new Date().toISOString(),
                }
              : w
          ),
        })),
      rejectWarning: (id, reason, user) =>
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'rejected' as WarningStatus,
                  rejectReason: reason,
                  updatedAt: new Date().toISOString(),
                }
              : w
          ),
        })),
      resubmitWarning: (id, data) =>
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === id
              ? {
                  ...w,
                  ...data,
                  status: 'pending' as WarningStatus,
                  confirmedById: '',
                  confirmedByName: '',
                  confirmedAt: '',
                  confirmNote: '',
                  rejectReason: '',
                  updatedAt: new Date().toISOString(),
                }
              : w
          ),
        })),
      linkExchange: (warningId, _exchangeId) =>
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === warningId
              ? {
                  ...w,
                  status: 'exchanged' as WarningStatus,
                  updatedAt: new Date().toISOString(),
                }
              : w
          ),
        })),
    }),
    { name: 'dental_warnings' }
  )
)

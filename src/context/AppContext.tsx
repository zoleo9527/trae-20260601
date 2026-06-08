import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { DamageRecord, LiabilityDetermination, DamageStatus, LiabilityParty } from '@/types'
import { initialDamageRecords, initialLiabilityRecords } from '@/data/mock'

interface AppState {
  damageRecords: DamageRecord[]
  liabilityRecords: LiabilityDetermination[]
}

type Action =
  | { type: 'UPDATE_DAMAGE_STATUS'; payload: { id: string; status: DamageStatus } }
  | { type: 'SUBMIT_LIABILITY'; payload: { id: string; responsibleParty: LiabilityParty; responsibleDetail: string; basis: string } }
  | { type: 'RETURN_LIABILITY'; payload: { id: string; returnReason: string } }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_DAMAGE_STATUS': {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const damageRecords = state.damageRecords.map(r =>
        r.id === action.payload.id
          ? { ...r, status: action.payload.status, updatedAt: now }
          : r
      )
      return { ...state, damageRecords }
    }

    case 'SUBMIT_LIABILITY': {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const liabilityRecords = state.liabilityRecords.map(r =>
        r.id === action.payload.id
          ? {
              ...r,
              responsibleParty: action.payload.responsibleParty,
              responsibleDetail: action.payload.responsibleDetail,
              basis: action.payload.basis,
              status: '已认定' as const,
              determinedAt: now,
              updatedAt: now,
            }
          : r
      )
      const targetLiability = state.liabilityRecords.find(r => r.id === action.payload.id)
      let damageRecords = state.damageRecords
      if (targetLiability) {
        damageRecords = damageRecords.map(d =>
          d.liabilityId === action.payload.id
            ? { ...d, status: '已认定' as const, updatedAt: now }
            : d
        )
      }
      return { ...state, liabilityRecords, damageRecords }
    }

    case 'RETURN_LIABILITY': {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const liabilityRecords = state.liabilityRecords.map(r =>
        r.id === action.payload.id
          ? {
              ...r,
              status: '已退回' as const,
              returnReason: action.payload.returnReason,
              updatedAt: now,
            }
          : r
      )
      const targetLiability = state.liabilityRecords.find(r => r.id === action.payload.id)
      let damageRecords = state.damageRecords
      if (targetLiability) {
        damageRecords = damageRecords.map(d =>
          d.liabilityId === action.payload.id
            ? { ...d, flag: 'returned' as const, updatedAt: now }
            : d
        )
      }
      return { ...state, liabilityRecords, damageRecords }
    }

    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    damageRecords: initialDamageRecords,
    liabilityRecords: initialLiabilityRecords,
  })

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

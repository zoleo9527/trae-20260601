import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { DamageRecord, LiabilityDetermination, DamageStatus, DamageCategory, DamageSeverity, LiabilityParty, EvidenceSource } from '@/types'
import { initialDamageRecords, initialLiabilityRecords } from '@/data/mock'

interface AppState {
  damageRecords: DamageRecord[]
  liabilityRecords: LiabilityDetermination[]
  nextDamageSeq: number
  nextLiabilitySeq: number
  nextEvidenceSeq: number
}

type Action =
  | { type: 'UPDATE_DAMAGE_STATUS'; payload: { id: string; status: DamageStatus } }
  | { type: 'SUBMIT_LIABILITY'; payload: { id: string; responsibleParty: LiabilityParty; responsibleDetail: string; basis: string } }
  | { type: 'RETURN_LIABILITY'; payload: { id: string; returnReason: string } }
  | { type: 'ADD_DAMAGE'; payload: Omit<DamageRecord, 'id' | 'evidenceChain' | 'createdAt' | 'updatedAt' | 'status'> }
  | { type: 'ADD_LIABILITY'; payload: { damageId: string; awb: string; flightNo: string; category: DamageCategory; severity: DamageSeverity } }
  | { type: 'ADD_EVIDENCE'; payload: { liabilityId: string; evidence: Omit<EvidenceSource, 'id'> } }

function now(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_DAMAGE_STATUS': {
      const t = now()
      const damageRecords = state.damageRecords.map(r =>
        r.id === action.payload.id
          ? { ...r, status: action.payload.status, updatedAt: t }
          : r
      )
      return { ...state, damageRecords }
    }

    case 'SUBMIT_LIABILITY': {
      const t = now()
      const liabilityRecords = state.liabilityRecords.map(r =>
        r.id === action.payload.id
          ? {
              ...r,
              responsibleParty: action.payload.responsibleParty,
              responsibleDetail: action.payload.responsibleDetail,
              basis: action.payload.basis,
              status: '已认定' as const,
              determinedAt: t,
              updatedAt: t,
            }
          : r
      )
      const targetLiability = state.liabilityRecords.find(r => r.id === action.payload.id)
      let damageRecords = state.damageRecords
      if (targetLiability) {
        damageRecords = damageRecords.map(d =>
          d.liabilityId === action.payload.id
            ? { ...d, status: '已认定' as const, updatedAt: t }
            : d
        )
      }
      return { ...state, liabilityRecords, damageRecords }
    }

    case 'RETURN_LIABILITY': {
      const t = now()
      const liabilityRecords = state.liabilityRecords.map(r =>
        r.id === action.payload.id
          ? {
              ...r,
              status: '已退回' as const,
              returnReason: action.payload.returnReason,
              updatedAt: t,
            }
          : r
      )
      const targetLiability = state.liabilityRecords.find(r => r.id === action.payload.id)
      let damageRecords = state.damageRecords
      if (targetLiability) {
        damageRecords = damageRecords.map(d =>
          d.liabilityId === action.payload.id
            ? { ...d, flag: 'returned' as const, updatedAt: t }
            : d
        )
      }
      return { ...state, liabilityRecords, damageRecords }
    }

    case 'ADD_DAMAGE': {
      const t = now()
      const p = action.payload
      const seq = state.nextDamageSeq
      const newRecord: DamageRecord = {
        ...p,
        id: `DMG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(seq).padStart(3, '0')}`,
        status: '待处理',
        evidenceChain: [],
        createdAt: t,
        updatedAt: t,
      }
      return {
        ...state,
        damageRecords: [newRecord, ...state.damageRecords],
        nextDamageSeq: seq + 1,
      }
    }

    case 'ADD_LIABILITY': {
      const t = now()
      const p = action.payload
      const seq = state.nextLiabilitySeq
      const liabilityId = `LB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(seq).padStart(3, '0')}`
      const newLiability: LiabilityDetermination = {
        id: liabilityId,
        damageId: p.damageId,
        awb: p.awb,
        flightNo: p.flightNo,
        category: p.category,
        severity: p.severity,
        responsibleParty: '待定',
        responsibleDetail: '',
        basis: '',
        evidenceIds: [],
        determiner: '张伟',
        status: '待认定',
        createdAt: t,
        updatedAt: t,
      }
      const damageRecords = state.damageRecords.map(d =>
        d.id === p.damageId
          ? { ...d, status: '待认定' as const, liabilityId, updatedAt: t }
          : d
      )
      return {
        ...state,
        liabilityRecords: [newLiability, ...state.liabilityRecords],
        damageRecords,
        nextLiabilitySeq: seq + 1,
      }
    }

    case 'ADD_EVIDENCE': {
      const t = now()
      const p = action.payload
      const seq = state.nextEvidenceSeq
      const evId = `ev-usr-${String(seq).padStart(3, '0')}`
      const newEvidence: EvidenceSource = {
        ...p.evidence,
        id: evId,
      }
      const liabilityRecords = state.liabilityRecords.map(r =>
        r.id === p.liabilityId
          ? {
              ...r,
              evidenceIds: [...r.evidenceIds, evId],
              updatedAt: t,
            }
          : r
      )
      const damageRecords = state.damageRecords.map(d => {
        const liab = state.liabilityRecords.find(l => l.id === p.liabilityId)
        if (liab && d.id === liab.damageId) {
          return {
            ...d,
            evidenceChain: [...d.evidenceChain, newEvidence],
            updatedAt: t,
          }
        }
        return d
      })
      return {
        ...state,
        liabilityRecords,
        damageRecords,
        nextEvidenceSeq: seq + 1,
      }
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
    nextDamageSeq: 9,
    nextLiabilitySeq: 6,
    nextEvidenceSeq: 16,
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

import { anomalies as initAnomalies, bibRecords as initBibRecords, checkInRecords as initCheckInRecords, participants as initParticipants, withdrawals as initWithdrawals } from '@/data/mockData'
import type { AnomalyRecord, BibRecord, CheckInRecord, GroupName, Participant, WithdrawalRecord } from '@/types'
import { create } from 'zustand'

interface EventStore {
  participants: Participant[]
  bibRecords: BibRecord[]
  checkInRecords: CheckInRecord[]
  withdrawals: WithdrawalRecord[]
  anomalies: AnomalyRecord[]

  getParticipantById: (id: string) => Participant | undefined
  getBibRecord: (participantId: string) => BibRecord | undefined
  getCheckInRecord: (participantId: string) => CheckInRecord | undefined
  getParticipantsByGroup: (group: GroupName) => Participant[]
  getWaitlisted: () => Participant[]
  getNotCheckedIn: () => Participant[]
  getNotIssuedBib: () => Participant[]
  searchParticipants: (query: string) => Participant[]

  issueBib: (participantId: string, issuedBy: string) => void
  batchIssueBib: (participantIds: string[], issuedBy: string) => void
  checkIn: (participantId: string, checkedInBy: string) => void
  uncheckIn: (participantId: string) => void

  addWithdrawal: (participantId: string, reason: string, recordedBy: string) => void
  addAnomaly: (participantId: string, type: AnomalyRecord['type'], description: string, reportedBy: string) => void
  resolveAnomaly: (anomalyId: string) => void
  dismissAnomaly: (anomalyId: string) => void

  changeGroup: (participantId: string, newGroup: GroupName) => void
  activateWaitlisted: (participantId: string, bibNumber: string) => void

  getGroupConflicts: () => { participantId: string; name: string; groups: string[] }[]
}

export const useEventStore = create<EventStore>((set, get) => ({
  participants: initParticipants,
  bibRecords: initBibRecords,
  checkInRecords: initCheckInRecords,
  withdrawals: initWithdrawals,
  anomalies: initAnomalies,

  getParticipantById: (id) => get().participants.find(p => p.id === id),

  getBibRecord: (participantId) => get().bibRecords.find(b => b.participantId === participantId),

  getCheckInRecord: (participantId) => get().checkInRecords.find(c => c.participantId === participantId),

  getParticipantsByGroup: (group) => get().participants.filter(p => p.group === group && !p.isWaitlisted),

  getWaitlisted: () => get().participants.filter(p => p.isWaitlisted),

  getNotCheckedIn: () => get().participants.filter(p => p.status === 'registered' && !p.isWaitlisted),

  getNotIssuedBib: () => {
    const { participants, bibRecords } = get()
    return participants.filter(p => {
      const bib = bibRecords.find(b => b.participantId === p.id)
      return !p.isWaitlisted && bib && !bib.issued
    })
  },

  searchParticipants: (query) => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return get().participants.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.bibNumber.toLowerCase().includes(q) ||
      p.idNumber.includes(q) ||
      p.phone.includes(q)
    )
  },

  issueBib: (participantId, issuedBy) => {
    set(state => ({
      bibRecords: state.bibRecords.map(b =>
        b.participantId === participantId
          ? { ...b, issued: true, issuedAt: new Date().toLocaleString('zh-CN'), issuedBy }
          : b
      )
    }))
  },

  batchIssueBib: (participantIds, issuedBy) => {
    const now = new Date().toLocaleString('zh-CN')
    set(state => ({
      bibRecords: state.bibRecords.map(b =>
        participantIds.includes(b.participantId)
          ? { ...b, issued: true, issuedAt: now, issuedBy }
          : b
      )
    }))
  },

  checkIn: (participantId, checkedInBy) => {
    set(state => {
      const existing = state.checkInRecords.find(c => c.participantId === participantId)
      const now = new Date().toLocaleString('zh-CN')
      const newCheckInRecords = existing
        ? state.checkInRecords.map(c =>
            c.participantId === participantId
              ? { ...c, checkedIn: true, checkedInAt: now, checkedInBy }
              : c
          )
        : [...state.checkInRecords, { participantId, checkedIn: true, checkedInAt: now, checkedInBy }]
      return {
        checkInRecords: newCheckInRecords,
        participants: state.participants.map(p =>
          p.id === participantId ? { ...p, status: 'checked_in' as const } : p
        )
      }
    })
  },

  uncheckIn: (participantId) => {
    set(state => ({
      checkInRecords: state.checkInRecords.map(c =>
        c.participantId === participantId
          ? { ...c, checkedIn: false, checkedInAt: undefined, checkedInBy: undefined }
          : c
      ),
      participants: state.participants.map(p =>
        p.id === participantId ? { ...p, status: 'registered' as const } : p
      )
    }))
  },

  addWithdrawal: (participantId, reason, recordedBy) => {
    const id = `W${String(get().withdrawals.length + 1).padStart(3, '0')}`
    set(state => ({
      withdrawals: [...state.withdrawals, {
        id,
        participantId,
        reason,
        withdrewAt: new Date().toLocaleString('zh-CN'),
        recordedBy
      }],
      participants: state.participants.map(p =>
        p.id === participantId ? { ...p, status: 'withdrawn' as const } : p
      )
    }))
  },

  addAnomaly: (participantId, type, description, reportedBy) => {
    const id = `EX${String(get().anomalies.length + 1).padStart(3, '0')}`
    set(state => ({
      anomalies: [...state.anomalies, {
        id,
        participantId,
        type,
        description,
        status: 'pending' as const,
        reportedAt: new Date().toLocaleString('zh-CN'),
        reportedBy
      }]
    }))
  },

  resolveAnomaly: (anomalyId) => {
    set(state => ({
      anomalies: state.anomalies.map(a =>
        a.id === anomalyId ? { ...a, status: 'resolved' as const } : a
      )
    }))
  },

  dismissAnomaly: (anomalyId) => {
    set(state => ({
      anomalies: state.anomalies.map(a =>
        a.id === anomalyId ? { ...a, status: 'dismissed' as const } : a
      )
    }))
  },

  changeGroup: (participantId, newGroup) => {
    set(state => ({
      participants: state.participants.map(p =>
        p.id === participantId ? { ...p, group: newGroup } : p
      )
    }))
  },

  activateWaitlisted: (participantId, bibNumber) => {
    set(state => ({
      participants: state.participants.map(p =>
        p.id === participantId ? { ...p, isWaitlisted: false, bibNumber, status: 'registered' as const } : p
      ),
      bibRecords: [...state.bibRecords, { participantId, issued: false }]
    }))
  },

  getGroupConflicts: () => {
    const { participants } = get()
    const nameCount: Record<string, { id: string; group: string }[]> = {}
    participants.filter(p => !p.isWaitlisted).forEach(p => {
      const key = p.idNumber
      if (!nameCount[key]) nameCount[key] = []
      nameCount[key].push({ id: p.id, group: p.group })
    })
    return Object.entries(nameCount)
      .filter(([, entries]) => {
        const groups = new Set(entries.map(e => e.group))
        return groups.size > 1
      })
      .map(([idNumber, entries]) => ({
        participantId: entries[0].id,
        name: participants.find(p => p.idNumber === idNumber)?.name || '',
        groups: entries.map(e => e.group)
      }))
  }
}))

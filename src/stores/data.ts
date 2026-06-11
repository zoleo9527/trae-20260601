import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Project, CableType, Team, Requisition, CheckIn, CablePoint,
  Shortage, ReturnRecord, TimelineEvent, TraceRow
} from '@shared/types'
import { api } from '../lib/api'

export const useDataStore = defineStore('data', () => {
  const projects = ref<Project[]>([])
  const cables = ref<CableType[]>([])
  const teams = ref<Team[]>([])
  const requisitions = ref<Requisition[]>([])
  const checkins = ref<CheckIn[]>([])
  const points = ref<CablePoint[]>([])
  const shortages = ref<Shortage[]>([])
  const returns = ref<ReturnRecord[]>([])
  const timeline = ref<TimelineEvent[]>([])
  const trace = ref<TraceRow[]>([])
  const loading = ref<string>('')

  const pendingRequisitions = computed(() => requisitions.value.filter(r => r.status === 'pending'))
  const pendingReturns = computed(() => returns.value.filter(r => r.status === 'pending'))
  const openShortages = computed(() => shortages.value.filter(s => s.status !== 'closed'))

  async function loadAll(projectId?: string) {
    loading.value = '加载中...'
    try {
      const [ps, cs, ts, rs, cks, pts, ss, rts, tl, tr] = await Promise.all([
        api<Project[]>('/projects'),
        api<CableType[]>('/cables'),
        api<Team[]>('/teams'),
        api<Requisition[]>(projectId ? `/requisitions?projectId=${projectId}` : '/requisitions'),
        api<CheckIn[]>('/checkins'),
        api<CablePoint[]>(projectId ? `/points?projectId=${projectId}` : '/points'),
        api<Shortage[]>('/shortages'),
        api<ReturnRecord[]>('/returns'),
        api<TimelineEvent[]>(`/timeline/${projectId || ''}`),
        api<TraceRow[]>('/trace')
      ])
      projects.value = ps
      cables.value = cs
      teams.value = ts
      requisitions.value = rs
      checkins.value = cks
      points.value = pts
      shortages.value = ss
      returns.value = rts
      timeline.value = tl
      trace.value = tr
    } finally {
      loading.value = ''
    }
  }

  async function createRequisition(payload: Partial<Requisition>) {
    const r = await api<Requisition>('/requisitions', { method: 'POST', body: payload })
    requisitions.value.unshift(r)
    return r
  }

  async function approveRequisition(id: string, pass: boolean, remark?: string) {
    const r = await api<Requisition>(`/requisitions/${id}/approve`, {
      method: 'PUT', body: { pass, remark, approver: '王建国' }
    })
    const i = requisitions.value.findIndex(x => x.id === id)
    if (i >= 0) requisitions.value[i] = r
    return r
  }

  async function issueRequisition(id: string) {
    const r = await api<Requisition>(`/requisitions/${id}/issue`, { method: 'PUT', body: {} })
    const i = requisitions.value.findIndex(x => x.id === id)
    if (i >= 0) requisitions.value[i] = r
    return r
  }

  async function createCheckin(payload: Partial<CheckIn>) {
    const c = await api<CheckIn>('/checkins', { method: 'POST', body: payload })
    checkins.value.unshift(c)
    return c
  }

  async function createPoint(payload: Partial<CablePoint>) {
    const p = await api<CablePoint>('/points', { method: 'POST', body: payload })
    points.value.unshift(p)
    return p
  }

  async function createShortage(payload: Partial<Shortage>) {
    const s = await api<Shortage>('/shortages', { method: 'POST', body: payload })
    shortages.value.unshift(s)
    return s
  }

  async function createReturn(payload: Partial<ReturnRecord>) {
    const r = await api<ReturnRecord>('/returns', { method: 'POST', body: payload })
    returns.value.unshift(r)
    return r
  }

  async function receiveReturn(id: string) {
    const r = await api<ReturnRecord>(`/returns/${id}/receive`, { method: 'PUT', body: {} })
    const i = returns.value.findIndex(x => x.id === id)
    if (i >= 0) returns.value[i] = r
    return r
  }

  function projectName(pid: string) {
    return projects.value.find(p => p.id === pid)?.name || pid
  }
  function teamName(tid: string) {
    return teams.value.find(t => t.id === tid)?.name || tid
  }
  function cableName(cid: string) {
    return cables.value.find(c => c.id === cid)?.model || cid
  }

  return {
    projects, cables, teams, requisitions, checkins, points, shortages, returns,
    timeline, trace, loading,
    pendingRequisitions, pendingReturns, openShortages,
    loadAll, createRequisition, approveRequisition, issueRequisition,
    createCheckin, createPoint, createShortage, createReturn, receiveReturn,
    projectName, teamName, cableName
  }
})

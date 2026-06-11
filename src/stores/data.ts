import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Project, CableType, Team, Requisition, CheckIn, CablePoint,
  Shortage, ReturnRecord, TimelineEvent, TraceRow
} from '@shared/types'
import { api } from '../lib/api'

const STORAGE_KEY = 'cable-mgr.current-project'

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
  const currentProjectId = ref<string>(
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || ''
  )

  const currentProject = computed(() =>
    projects.value.find(p => p.id === currentProjectId.value) || null
  )
  const pendingRequisitions = computed(() => requisitions.value.filter(r => r.status === 'pending'))
  const pendingReturns = computed(() => returns.value.filter(r => r.status === 'pending'))
  const openShortages = computed(() => shortages.value.filter(s => s.status !== 'closed'))

  watch(currentProjectId, (val) => {
    if (typeof localStorage !== 'undefined') {
      if (val) localStorage.setItem(STORAGE_KEY, val)
      else localStorage.removeItem(STORAGE_KEY)
    }
  })

  function ensureDefaultProject() {
    if (!currentProjectId.value && projects.value.length > 0) {
      const active = projects.value.find(p => p.status === 'active')
      currentProjectId.value = (active || projects.value[0]).id
    }
  }

  function withProjectQuery(path: string, extraParams?: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (currentProjectId.value) params.set('projectId', currentProjectId.value)
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        if (v) params.set(k, v)
      }
    }
    const qs = params.toString()
    return qs ? `${path}?${qs}` : path
  }

  async function loadAll(projectId?: string) {
    if (projectId) currentProjectId.value = projectId
    loading.value = '加载中...'
    try {
      const [ps, cs, ts] = await Promise.all([
        api<Project[]>('/projects'),
        api<CableType[]>('/cables'),
        api<Team[]>('/teams')
      ])
      projects.value = ps
      cables.value = cs
      teams.value = ts
      ensureDefaultProject()
      const targetPid = currentProjectId.value
      const [rs, cks, pts, ss, rts, tl, tr] = await Promise.all([
        api<Requisition[]>(withProjectQuery('/requisitions')),
        api<CheckIn[]>(withProjectQuery('/checkins')),
        api<CablePoint[]>(withProjectQuery('/points')),
        api<Shortage[]>(withProjectQuery('/shortages')),
        api<ReturnRecord[]>(withProjectQuery('/returns')),
        api<TimelineEvent[]>(`/timeline/${targetPid || ''}`),
        api<TraceRow[]>(withProjectQuery('/trace'))
      ])
      requisitions.value = rs
      checkins.value = cks
      points.value = pts
      shortages.value = ss
      returns.value = rts
      timeline.value = tl
      trace.value = tr
      // 防止异步期间被切换
      if (targetPid !== currentProjectId.value && currentProjectId.value) {
        await loadAll(currentProjectId.value)
      }
    } finally {
      loading.value = ''
    }
  }

  async function refreshTimelineAndTrace() {
    const targetPid = currentProjectId.value
    try {
      const [tl, tr] = await Promise.all([
        api<TimelineEvent[]>(`/timeline/${targetPid || ''}`),
        api<TraceRow[]>(withProjectQuery('/trace'))
      ])
      timeline.value = tl
      trace.value = tr
    } catch (e) {
      console.warn('刷新时间轴/追溯数据失败', e)
    }
  }

  async function setCurrentProject(projectId: string) {
    if (currentProjectId.value === projectId) return
    currentProjectId.value = projectId
    await loadAll(projectId)
  }

  async function createRequisition(payload: Partial<Requisition>) {
    const r = await api<Requisition>('/requisitions', { method: 'POST', body: payload })
    requisitions.value.unshift(r)
    await refreshTimelineAndTrace()
    return r
  }

  async function approveRequisition(id: string, pass: boolean, remark?: string) {
    const r = await api<Requisition>(`/requisitions/${id}/approve`, {
      method: 'PUT', body: { pass, remark, approver: '王建国' }
    })
    const i = requisitions.value.findIndex(x => x.id === id)
    if (i >= 0) requisitions.value[i] = r
    await refreshTimelineAndTrace()
    return r
  }

  async function issueRequisition(id: string) {
    const r = await api<Requisition>(`/requisitions/${id}/issue`, { method: 'PUT', body: {} })
    const i = requisitions.value.findIndex(x => x.id === id)
    if (i >= 0) requisitions.value[i] = r
    await refreshTimelineAndTrace()
    return r
  }

  async function createCheckin(payload: Partial<CheckIn>) {
    const c = await api<CheckIn>('/checkins', { method: 'POST', body: payload })
    checkins.value.unshift(c)
    await refreshTimelineAndTrace()
    return c
  }

  async function createPoint(payload: Partial<CablePoint>) {
    const p = await api<CablePoint>('/points', { method: 'POST', body: payload })
    points.value.unshift(p)
    await refreshTimelineAndTrace()
    return p
  }

  async function createShortage(payload: Partial<Shortage>) {
    const s = await api<Shortage>('/shortages', { method: 'POST', body: payload })
    shortages.value.unshift(s)
    await refreshTimelineAndTrace()
    return s
  }

  async function createReturn(payload: Partial<ReturnRecord>) {
    const r = await api<ReturnRecord>('/returns', { method: 'POST', body: payload })
    returns.value.unshift(r)
    await refreshTimelineAndTrace()
    return r
  }

  async function receiveReturn(id: string) {
    const r = await api<ReturnRecord>(`/returns/${id}/receive`, { method: 'PUT', body: {} })
    const i = returns.value.findIndex(x => x.id === id)
    if (i >= 0) returns.value[i] = r
    await refreshTimelineAndTrace()
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
    currentProjectId, currentProject,
    pendingRequisitions, pendingReturns, openShortages,
    loadAll, refreshTimelineAndTrace, setCurrentProject,
    createRequisition, approveRequisition, issueRequisition,
    createCheckin, createPoint, createShortage, createReturn, receiveReturn,
    projectName, teamName, cableName
  }
})

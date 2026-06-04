import { mockExceptions, mockPlans, mockTimelines } from '@/mock/data'
import type { ExceptionRecord, RehabPlan, StaffRole, TimelineEvent } from '@/types'
import { reactive } from 'vue'

interface State {
  plans: RehabPlan[]
  timelines: TimelineEvent[]
  exceptions: ExceptionRecord[]
}

const state = reactive<State>({
  plans: JSON.parse(JSON.stringify(mockPlans)),
  timelines: JSON.parse(JSON.stringify(mockTimelines)),
  exceptions: JSON.parse(JSON.stringify(mockExceptions))
})

let idCounter = 1000
function nextId(prefix: string): string {
  return `${prefix}${++idCounter}`
}

function now(): string {
  return new Date().toISOString().slice(0, 16).replace('T', 'T')
}

export function getPlans(): RehabPlan[] {
  return state.plans
}

export function getPlanById(id: string): RehabPlan | undefined {
  return state.plans.find(p => p.id === id)
}

export function getTimelinesByPlanId(planId: string): TimelineEvent[] {
  return state.timelines
    .filter(t => t.planId === planId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getExceptionsByPlanId(planId: string): ExceptionRecord[] {
  return state.exceptions.filter(e => e.planId === planId)
}

export function getAllExceptions(): ExceptionRecord[] {
  return state.exceptions
}

interface ApprovePayload {
  evaluationResult: string
  evaluationScore: number
  evaluatorId: string
  evaluatorName: string
  evaluatorRole: StaffRole
}

interface RejectPayload {
  rejectReason: string
  evaluatorId: string
  evaluatorName: string
  evaluatorRole: StaffRole
}

interface PendingPayload {
  evaluationResult: string
  evaluationScore: number
  evaluatorId: string
  evaluatorName: string
  evaluatorRole: StaffRole
}

export function approvePhase(planId: string, phaseId: string, payload: ApprovePayload): void {
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return

  const phase = plan.phases.find(ph => ph.id === phaseId)
  if (!phase) return

  const previousStatus = phase.status

  phase.status = 'approved'
  phase.evaluationResult = payload.evaluationResult
  phase.evaluationScore = payload.evaluationScore
  phase.evaluatorId = payload.evaluatorId
  phase.evaluationDate = new Date().toISOString().slice(0, 10)
  phase.isDelayed = false

  plan.updatedAt = now()

  const nextPhaseIdx = plan.phases.findIndex(ph => ph.id === phaseId) + 1
  if (nextPhaseIdx < plan.phases.length) {
    const nextPhase = plan.phases[nextPhaseIdx]
    if (nextPhase.status === 'not_started') {
      nextPhase.status = 'in_progress'
      state.timelines.push({
        id: nextId('t'),
        planId,
        type: 'status_change',
        title: `进入第${nextPhase.phaseNumber}阶段`,
        description: `${nextPhase.title}开始执行`,
        operatorId: payload.evaluatorId,
        operatorName: payload.evaluatorName,
        operatorRole: payload.evaluatorRole,
        timestamp: now(),
        phaseId: nextPhase.id,
        phaseNumber: nextPhase.phaseNumber
      })
    }
  } else {
    const allDone = plan.phases.every(ph => ph.status === 'approved' || ph.status === 'supplemented')
    if (allDone) {
      plan.status = 'completed'
      plan.actualEndDate = new Date().toISOString().slice(0, 10)
      state.timelines.push({
        id: nextId('t'),
        planId,
        type: 'status_change',
        title: '康复计划完成',
        description: '所有阶段评估已通过，康复计划完成',
        operatorId: payload.evaluatorId,
        operatorName: payload.evaluatorName,
        operatorRole: payload.evaluatorRole,
        timestamp: now()
      })
    }
  }

  state.timelines.push({
    id: nextId('t'),
    planId,
    type: 'evaluation',
    title: `第${phase.phaseNumber}阶段评估通过`,
    description: `${payload.evaluationResult}，评分${payload.evaluationScore}分`,
    operatorId: payload.evaluatorId,
    operatorName: payload.evaluatorName,
    operatorRole: payload.evaluatorRole,
    timestamp: now(),
    phaseId,
    phaseNumber: phase.phaseNumber
  })

  resolveExceptionsForPhase(planId, phaseId, `第${phase.phaseNumber}阶段评估已通过，评分${payload.evaluationScore}分`)
}

export function rejectPhase(planId: string, phaseId: string, payload: RejectPayload): void {
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return

  const phase = plan.phases.find(ph => ph.id === phaseId)
  if (!phase) return

  phase.status = 'rejected'
  phase.rejectReason = payload.rejectReason
  phase.evaluationResult = payload.rejectReason
  phase.evaluatorId = payload.evaluatorId
  phase.evaluationDate = new Date().toISOString().slice(0, 10)

  plan.updatedAt = now()
  plan.hasException = true
  plan.exceptionReason = `第${phase.phaseNumber}阶段评估被驳回`

  state.timelines.push({
    id: nextId('t'),
    planId,
    type: 'evaluation',
    title: `第${phase.phaseNumber}阶段评估被驳回`,
    description: payload.rejectReason,
    operatorId: payload.evaluatorId,
    operatorName: payload.evaluatorName,
    operatorRole: payload.evaluatorRole,
    timestamp: now(),
    phaseId,
    phaseNumber: phase.phaseNumber
  })

  state.timelines.push({
    id: nextId('t'),
    planId,
    type: 'exception',
    title: `第${phase.phaseNumber}阶段评估被驳回`,
    description: `需要补充资料后重新提交评估申请。驳回原因：${payload.rejectReason}`,
    operatorId: payload.evaluatorId,
    operatorName: payload.evaluatorName,
    operatorRole: payload.evaluatorRole,
    timestamp: now(),
    phaseId,
    phaseNumber: phase.phaseNumber
  })

  state.exceptions.push({
    id: nextId('ex'),
    planId,
    phaseId,
    type: 'reject',
    title: `第${phase.phaseNumber}阶段评估被驳回`,
    reason: payload.rejectReason,
    handlerId: payload.evaluatorId,
    handlerName: payload.evaluatorName,
    status: 'processing',
    createdAt: now()
  })
}

export function pendingReviewPhase(planId: string, phaseId: string, payload: PendingPayload): void {
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return

  const phase = plan.phases.find(ph => ph.id === phaseId)
  if (!phase) return

  phase.status = 'pending_review'
  phase.evaluationResult = payload.evaluationResult
  phase.evaluationScore = payload.evaluationScore
  phase.evaluatorId = payload.evaluatorId
  phase.evaluationDate = new Date().toISOString().slice(0, 10)

  plan.updatedAt = now()
  plan.hasException = true
  plan.exceptionReason = `第${phase.phaseNumber}阶段待复核`

  state.timelines.push({
    id: nextId('t'),
    planId,
    type: 'review',
    title: `第${phase.phaseNumber}阶段提交复核`,
    description: `${payload.evaluationResult}，评分${payload.evaluationScore}分，待护理主管复核确认`,
    operatorId: payload.evaluatorId,
    operatorName: payload.evaluatorName,
    operatorRole: payload.evaluatorRole,
    timestamp: now(),
    phaseId,
    phaseNumber: phase.phaseNumber
  })

  state.exceptions.push({
    id: nextId('ex'),
    planId,
    phaseId,
    type: 'supplement',
    title: `第${phase.phaseNumber}阶段待复核`,
    reason: `评估已完成，评分${payload.evaluationScore}分，等待护理主管复核确认。`,
    handlerId: payload.evaluatorId,
    handlerName: payload.evaluatorName,
    status: 'processing',
    createdAt: now()
  })
}

function resolveExceptionsForPhase(planId: string, phaseId: string, resolution: string): void {
  const related = state.exceptions.filter(
    e => e.planId === planId && e.phaseId === phaseId && e.status !== 'resolved'
  )
  for (const ex of related) {
    ex.status = 'resolved'
    ex.resolvedAt = now()
    ex.resolution = resolution
  }

  const remaining = state.exceptions.filter(e => e.planId === planId && e.status !== 'resolved')
  if (remaining.length === 0) {
    const plan = state.plans.find(p => p.id === planId)
    if (plan) {
      plan.hasException = false
      plan.exceptionReason = undefined
    }
  }
}

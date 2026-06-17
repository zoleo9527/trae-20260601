import prisma from '../prisma'

export type ActivityStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type SettlementStatus = 'UNSETTLED' | 'PARTIAL' | 'SETTLED' | 'DISPUTED'

export interface StatusTransition {
  from: ActivityStatus | SettlementStatus
  to: ActivityStatus | SettlementStatus
  allowed: boolean
  reason?: string
}

export interface StatusFlow {
  activityStatus: ActivityStatus
  settlementStatus?: SettlementStatus
  possibleTransitions: StatusTransition[]
  conflicts?: string[]
}

const activityStatusTransitions: Record<ActivityStatus, ActivityStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CONFIRMED'],
  COMPLETED: [],
  CANCELLED: ['PENDING']
}

const settlementStatusTransitions: Record<SettlementStatus, SettlementStatus[]> = {
  UNSETTLED: ['PARTIAL', 'DISPUTED'],
  PARTIAL: ['SETTLED', 'DISPUTED', 'UNSETTLED'],
  SETTLED: ['DISPUTED'],
  DISPUTED: ['PARTIAL', 'SETTLED']
}

const activityToSettlementMapping: Record<ActivityStatus, SettlementStatus[]> = {
  PENDING: ['UNSETTLED', 'PARTIAL'],
  CONFIRMED: ['UNSETTLED', 'PARTIAL'],
  IN_PROGRESS: ['PARTIAL', 'UNSETTLED'],
  COMPLETED: ['PARTIAL', 'SETTLED', 'DISPUTED'],
  CANCELLED: ['SETTLED', 'DISPUTED']
}

export function getActivityStatusTransitions(currentStatus: ActivityStatus): StatusTransition[] {
  const allowedTransitions = activityStatusTransitions[currentStatus]
  const allStatuses: ActivityStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

  return allStatuses.map((status) => ({
    from: currentStatus,
    to: status,
    allowed: allowedTransitions.includes(status),
    reason: !allowedTransitions.includes(status) ? getTransitionReason(currentStatus, status) : undefined
  }))
}

export function getSettlementStatusTransitions(currentStatus: SettlementStatus): StatusTransition[] {
  const allowedTransitions = settlementStatusTransitions[currentStatus]
  const allStatuses: SettlementStatus[] = ['UNSETTLED', 'PARTIAL', 'SETTLED', 'DISPUTED']

  return allStatuses.map((status) => ({
    from: currentStatus,
    to: status,
    allowed: allowedTransitions.includes(status),
    reason: !allowedTransitions.includes(status) ? getSettlementTransitionReason(currentStatus, status) : undefined
  }))
}

export function getActivityToSettlementMapping(activityStatus: ActivityStatus): SettlementStatus[] {
  return activityToSettlementMapping[activityStatus]
}

export function isSettlementStatusAllowedForActivity(
  activityStatus: ActivityStatus,
  settlementStatus: SettlementStatus
): boolean {
  return getActivityToSettlementMapping(activityStatus).includes(settlementStatus)
}

function getTransitionReason(from: ActivityStatus, to: ActivityStatus): string {
  const reasons: Record<string, Record<string, string>> = {
    PENDING: {
      IN_PROGRESS: '活动未确认，不能直接开始',
      COMPLETED: '活动未确认且未开始，不能直接完成'
    },
    CONFIRMED: {
      COMPLETED: '活动未开始，不能直接完成'
    },
    IN_PROGRESS: {
      PENDING: '活动进行中，不能回退到待确认',
      CANCELLED: '活动进行中，不能取消'
    },
    COMPLETED: {
      PENDING: '活动已完成，不能回退到待确认',
      CONFIRMED: '活动已完成，不能回退到已确认',
      IN_PROGRESS: '活动已完成，不能重新开始',
      CANCELLED: '活动已完成，不能取消'
    },
    CANCELLED: {
      CONFIRMED: '已取消的活动需要先恢复为待确认',
      IN_PROGRESS: '已取消的活动需要先恢复为待确认',
      COMPLETED: '已取消的活动需要先恢复为待确认'
    }
  }
  return reasons[from]?.[to] || '不允许此状态转换'
}

function getSettlementTransitionReason(from: SettlementStatus, to: SettlementStatus): string {
  const reasons: Record<string, Record<string, string>> = {
    UNSETTLED: {
      SETTLED: '未结算状态不能直接变为已结清，需先有部分支付(PARTIAL)'
    },
    PARTIAL: {},
    SETTLED: {
      UNSETTLED: '已结清状态不能回退为未结算',
      PARTIAL: '已结清状态不能回退为部分支付'
    },
    DISPUTED: {}
  }
  return reasons[from]?.[to] || '不允许此状态转换'
}

export async function transitionActivityStatus(
  activityId: string,
  newStatus: ActivityStatus,
  userId: string
): Promise<{ success: boolean; message: string; activity?: any; settlementUpdated?: boolean; settlementUpdateMessage?: string }> {
  const activity = await prisma.teamBuilding.findUnique({
    where: { id: activityId },
    include: { settlement: true }
  })

  if (!activity) {
    return { success: false, message: '活动不存在' }
  }

  const currentStatus = activity.status as ActivityStatus
  const transitions = getActivityStatusTransitions(currentStatus)
  const allowed = transitions.some((t) => t.to === newStatus && t.allowed)

  if (!allowed) {
    const reason = transitions.find((t) => t.to === newStatus)?.reason
    return { success: false, message: reason || '不允许此状态转换' }
  }

  if (newStatus === 'COMPLETED') {
    if (!activity.settlement || activity.settlement.length === 0) {
      return { success: false, message: '活动完成前需先创建结算单' }
    }
  }

  let settlementUpdateMessage: string | undefined
  let settlementUpdated = false

  if (newStatus === 'CANCELLED' || newStatus === 'COMPLETED') {
    const result = await updateSettlementStatusOnActivityTransition(activityId, newStatus)
    settlementUpdated = result.updated
    settlementUpdateMessage = result.message
  }

  const updatedActivity = await prisma.teamBuilding.update({
    where: { id: activityId },
    data: {
      status: newStatus,
      updatedBy: userId
    },
    include: { settlement: true }
  })

  let messages = ['状态更新成功']
  if (settlementUpdateMessage) {
    messages.push(settlementUpdateMessage)
  }

  return { 
    success: true, 
    message: messages.join('；'), 
    activity: updatedActivity, 
    settlementUpdated 
  }
}

export async function transitionSettlementStatus(
  settlementId: string,
  newStatus: SettlementStatus,
  userId: string
): Promise<{ success: boolean; message: string; settlement?: any }> {
  const settlement = await prisma.expenseSettlement.findUnique({
    where: { id: settlementId },
    include: { teamBuilding: true }
  })

  if (!settlement) {
    return { success: false, message: '结算单不存在' }
  }

  const currentStatus = settlement.status as SettlementStatus
  const transitions = getSettlementStatusTransitions(currentStatus)
  const allowed = transitions.some((t) => t.to === newStatus && t.allowed)

  if (!allowed) {
    const reason = transitions.find((t) => t.to === newStatus)?.reason
    return { success: false, message: reason || '不允许此状态转换' }
  }

  const activityStatus = settlement.teamBuilding.status as ActivityStatus
  if (!isSettlementStatusAllowedForActivity(activityStatus, newStatus)) {
    return {
      success: false,
      message: `当前活动状态(${activityStatus})不允许结算状态变为${newStatus}`
    }
  }

  const updatedSettlement = await prisma.expenseSettlement.update({
    where: { id: settlementId },
    data: {
      status: newStatus,
      updatedBy: userId
    },
    include: { teamBuilding: true }
  })

  return { success: true, message: '状态更新成功', settlement: updatedSettlement }
}

async function updateSettlementStatusOnActivityTransition(
  activityId: string,
  newStatus: ActivityStatus
): Promise<{ updated: boolean; message?: string }> {
  const activity = await prisma.teamBuilding.findUnique({
    where: { id: activityId },
    include: { settlement: true }
  })

  if (!activity || !activity.settlement || activity.settlement.length === 0) {
    return { updated: false }
  }

  if (newStatus === 'CANCELLED') {
    await prisma.expenseSettlement.updateMany({
      where: { teamBuildingId: activityId },
      data: { status: 'SETTLED' }
    })
    return { updated: true, message: '已将关联结算单状态更新为 SETTLED' }
  }

  if (newStatus === 'COMPLETED') {
    const unsettledSettlements = activity.settlement.filter(
      (s) => s.status === 'UNSETTLED'
    )

    if (unsettledSettlements.length > 0) {
      await prisma.expenseSettlement.updateMany({
        where: { teamBuildingId: activityId, status: 'UNSETTLED' },
        data: { status: 'PARTIAL' }
      })
      return { updated: true, message: `已将 ${unsettledSettlements.length} 个 UNSETTLED 结算单自动更新为 PARTIAL` }
    }
  }

  return { updated: false }
}

export async function getActivityStatusFlow(activityId: string): Promise<StatusFlow> {
  const activity = await prisma.teamBuilding.findUnique({
    where: { id: activityId },
    include: { settlement: true }
  })

  if (!activity) {
    throw new Error('活动不存在')
  }

  const activityStatus = activity.status as ActivityStatus
  const settlementStatus = activity.settlement?.[0]?.status as SettlementStatus | undefined

  const conflicts: string[] = []
  if (settlementStatus && !isSettlementStatusAllowedForActivity(activityStatus, settlementStatus)) {
    conflicts.push(`结算状态 ${settlementStatus} 与活动状态 ${activityStatus} 不匹配`)
  }

  return {
    activityStatus,
    settlementStatus,
    possibleTransitions: getActivityStatusTransitions(activityStatus),
    conflicts
  }
}

export async function getSettlementStatusFlow(settlementId: string): Promise<StatusFlow> {
  const settlement = await prisma.expenseSettlement.findUnique({
    where: { id: settlementId },
    include: { teamBuilding: true }
  })

  if (!settlement) {
    throw new Error('结算单不存在')
  }

  const settlementStatus = settlement.status as SettlementStatus
  const activityStatus = settlement.teamBuilding.status as ActivityStatus

  const conflicts: string[] = []
  if (!isSettlementStatusAllowedForActivity(activityStatus, settlementStatus)) {
    conflicts.push(`结算状态 ${settlementStatus} 与活动状态 ${activityStatus} 不匹配`)
  }

  return {
    activityStatus,
    settlementStatus,
    possibleTransitions: getSettlementStatusTransitions(settlementStatus),
    conflicts
  }
}

export async function validateStatusConsistency(activityId: string): Promise<{ valid: boolean; issues: string[] }> {
  const activity = await prisma.teamBuilding.findUnique({
    where: { id: activityId },
    include: { settlement: true }
  })

  if (!activity) {
    return { valid: false, issues: ['活动不存在'] }
  }

  const issues: string[] = []
  const activityStatus = activity.status as ActivityStatus

  if (activity.settlement && activity.settlement.length > 0) {
    activity.settlement.forEach((settlement) => {
      const settlementStatus = settlement.status as SettlementStatus
      if (!isSettlementStatusAllowedForActivity(activityStatus, settlementStatus)) {
        issues.push(`结算单 ${settlement.id}: ${settlementStatus} 与活动状态 ${activityStatus} 冲突`)
      }
    })
  }

  return { valid: issues.length === 0, issues }
}
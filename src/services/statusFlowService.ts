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
}

const activityStatusTransitions: Record<ActivityStatus, ActivityStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CONFIRMED'],
  COMPLETED: [],
  CANCELLED: ['PENDING']
}

const settlementStatusTransitions: Record<SettlementStatus, SettlementStatus[]> = {
  UNSETTLED: ['PARTIAL', 'SETTLED', 'DISPUTED'],
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
      SETTLED: '未结算状态不能直接变为已结清，需先有部分支付'
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
): Promise<{ success: boolean; message: string; activity?: any }> {
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

  const updatedActivity = await prisma.teamBuilding.update({
    where: { id: activityId },
    data: {
      status: newStatus,
      updatedBy: userId
    },
    include: { settlement: true }
  })

  await updateSettlementStatusOnActivityTransition(activityId, newStatus)

  return { success: true, message: '状态更新成功', activity: updatedActivity }
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
): Promise<void> {
  if (newStatus === 'CANCELLED') {
    await prisma.expenseSettlement.updateMany({
      where: { teamBuildingId: activityId },
      data: { status: 'SETTLED' }
    })
  }
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

  return {
    activityStatus,
    settlementStatus,
    possibleTransitions: getActivityStatusTransitions(activityStatus)
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

  return {
    activityStatus,
    settlementStatus,
    possibleTransitions: getSettlementStatusTransitions(settlementStatus)
  }
}
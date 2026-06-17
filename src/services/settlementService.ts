import prisma from '../prisma'
import { UpdateSettlementRequest, SettlementFilter, PaginatedResponse } from '../types'
import { ExpenseSettlement } from '@prisma/client'
import { getActivityToSettlementMapping, getSettlementStatusTransitions, isSettlementStatusAllowedForActivity, SettlementStatus } from './statusFlowService'

export interface SettlementDetail {
  id: string
  teamBuildingId: string
  activityName: string
  activityDate: string
  activityStatus: string
  activityNotes: string | null
  status: string
  totalAmount: number
  depositAmount: number
  paidAmount: number
  outstandingAmount: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
  updatedBy: string
  anomalies: AnomalyItem[]
}

export interface AnomalyItem {
  id: string
  type: 'room' | 'ingredient' | 'accommodation'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

export async function createSettlement(
  teamBuildingId: string,
  userId: string,
  notes?: string
): Promise<ExpenseSettlement> {
  const teamBuilding = await prisma.teamBuilding.findUnique({
    where: { id: teamBuildingId },
    include: { privateRooms: true, accommodations: true, ingredients: true }
  })

  if (!teamBuilding) {
    throw new Error('Team building not found')
  }

  const privateRoomCost = teamBuilding.privateRooms.length * 200
  const accommodationCost = teamBuilding.accommodations.length * 150
  const ingredientCost = teamBuilding.ingredients.reduce(
    (sum, ing) => sum + Number(ing.quantity) * Number(ing.unitPrice),
    0
  )
  const totalAmount = privateRoomCost + accommodationCost + ingredientCost

  const depositAmount = teamBuilding.accommodations.reduce(
    (sum, acc) => sum + (Number(acc.depositAmount) || 0),
    0
  )

  const paidAmount = teamBuilding.accommodations.filter((acc) => acc.depositPaid).reduce(
    (sum, acc) => sum + (Number(acc.depositAmount) || 0),
    0
  )

  return prisma.expenseSettlement.create({
    data: {
      teamBuildingId,
      status: paidAmount >= totalAmount ? 'SETTLED' : paidAmount > 0 ? 'PARTIAL' : 'UNSETTLED',
      totalAmount,
      depositAmount,
      paidAmount,
      outstandingAmount: totalAmount - paidAmount,
      notes,
      updatedBy: userId
    },
    include: { teamBuilding: true }
  })
}

export async function getSettlementById(id: string): Promise<SettlementDetail | null> {
  const settlement = await prisma.expenseSettlement.findUnique({
    where: { id },
    include: {
      teamBuilding: { include: { privateRooms: true, accommodations: true, ingredients: true } }
    }
  })

  if (!settlement) {
    return null
  }

  return transformToSettlementDetail(settlement)
}

export async function getSettlements(
  filter: SettlementFilter,
  page: number,
  pageSize: number
): Promise<PaginatedResponse<SettlementDetail>> {
  const { status, dateStart, dateEnd } = filter

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (dateStart || dateEnd) {
    where.createdAt = {}
    if (dateStart) {
      where.createdAt.gte = new Date(dateStart)
    }
    if (dateEnd) {
      where.createdAt.lte = new Date(dateEnd)
    }
  }

  const [settlements, total] = await Promise.all([
    prisma.expenseSettlement.findMany({
      where,
      include: {
        teamBuilding: { include: { privateRooms: true, accommodations: true, ingredients: true } }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.expenseSettlement.count({ where })
  ])

  const data = settlements.map(transformToSettlementDetail)

  return { data, total, page, pageSize }
}

export async function updateSettlement(
  id: string,
  data: UpdateSettlementRequest,
  userId: string
): Promise<SettlementDetail | null> {
  const settlement = await prisma.expenseSettlement.findUnique({
    where: { id },
    include: { teamBuilding: { include: { privateRooms: true, accommodations: true, ingredients: true } } }
  })

  if (!settlement) {
    throw new Error('Settlement not found')
  }

  if (data.status !== undefined) {
    throw new Error('状态更新请使用专用的状态流转接口 /api/status-flow/settlement/:id/transition')
  }

  const { paidAmount, ...rest } = data
  const newPaidAmount = paidAmount !== undefined ? paidAmount : Number(settlement.paidAmount)
  const newTotalAmount = data.totalAmount !== undefined ? data.totalAmount : Number(settlement.totalAmount)
  const outstandingAmount = newTotalAmount - newPaidAmount

  let newStatus = settlement.status as SettlementStatus
  if (paidAmount !== undefined) {
    const activityStatus = settlement.teamBuilding.status
    const newStatusFromPayment = newPaidAmount >= newTotalAmount ? 'SETTLED' : newPaidAmount > 0 ? 'PARTIAL' : 'UNSETTLED'
    
    const currentStatus = settlement.status as SettlementStatus
    const settlementTransitions = getSettlementStatusTransitions(currentStatus)
    const isAllowedBySettlementFlow = settlementTransitions.some(t => t.to === newStatusFromPayment && t.allowed)
    
    if (!isAllowedBySettlementFlow) {
      const reason = settlementTransitions.find(t => t.to === newStatusFromPayment)?.reason
      throw new Error(reason || `结算状态流转规则不允许从 ${currentStatus} 变为 ${newStatusFromPayment}`)
    }
    
    if (!isSettlementStatusAllowedForActivity(activityStatus as any, newStatusFromPayment)) {
      throw new Error(`根据活动状态(${activityStatus})，不允许结算状态变为${newStatusFromPayment}`)
    }
    
    newStatus = newStatusFromPayment
  }

  const updatedSettlement = await prisma.expenseSettlement.update({
    where: { id },
    data: {
      ...rest,
      paidAmount: newPaidAmount,
      outstandingAmount,
      status: newStatus,
      updatedBy: userId
    },
    include: { teamBuilding: { include: { privateRooms: true, accommodations: true, ingredients: true } } }
  })

  return transformToSettlementDetail(updatedSettlement)
}

export async function getUnsettledSettlements(): Promise<SettlementDetail[]> {
  const settlements = await prisma.expenseSettlement.findMany({
    where: { status: { in: ['UNSETTLED', 'PARTIAL', 'DISPUTED'] } },
    include: {
      teamBuilding: { include: { privateRooms: true, accommodations: true, ingredients: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  return settlements.map(transformToSettlementDetail)
}

interface RoomItem {
  id: string
  name: string
  notes: string | null
}

interface IngredientItem {
  id: string
  name: string
  stockStatus: string
  notes: string | null
}

interface AccommodationItem {
  id: string
  roomNumber: string
  depositPaid: boolean
  depositAmount: unknown
  notes: string | null
}

interface SettlementTeamBuilding {
  id: string
  name: string
  date: Date
  status: string
  notes: string | null
  privateRooms: RoomItem[]
  accommodations: AccommodationItem[]
  ingredients: IngredientItem[]
}

interface SettlementInput {
  id: string
  teamBuildingId: string
  status: string
  totalAmount: unknown
  depositAmount: unknown
  paidAmount: unknown
  outstandingAmount: unknown
  notes: string | null
  createdAt: Date
  updatedAt: Date
  updatedBy: string
  teamBuilding: SettlementTeamBuilding
}

function transformToSettlementDetail(settlement: SettlementInput): SettlementDetail {
  const anomalies: AnomalyItem[] = []

  settlement.teamBuilding.privateRooms.forEach((room: RoomItem) => {
    if (room.notes?.includes('超订')) {
      anomalies.push({
        id: room.id,
        type: 'room',
        title: `包间超订: ${room.name}`,
        description: room.notes || '包间超订预警',
        severity: 'high'
      })
    } else if (room.notes?.includes('检修') || room.notes?.includes('维护') || room.notes?.includes('维修')) {
      anomalies.push({
        id: room.id,
        type: 'room',
        title: `包间检修维护: ${room.name}`,
        description: room.notes || '包间需要检修维护',
        severity: 'medium'
      })
    } else if (room.notes?.includes('异常') || room.notes?.includes('问题')) {
      anomalies.push({
        id: room.id,
        type: 'room',
        title: `包间异常: ${room.name}`,
        description: room.notes || '包间存在异常情况',
        severity: 'high'
      })
    } else if (room.notes?.includes('预警')) {
      anomalies.push({
        id: room.id,
        type: 'room',
        title: `包间预警: ${room.name}`,
        description: room.notes,
        severity: 'medium'
      })
    }
  })

  settlement.teamBuilding.ingredients.forEach((ing: IngredientItem) => {
    if (ing.stockStatus === 'INSUFFICIENT') {
      anomalies.push({
        id: ing.id,
        type: 'ingredient',
        title: `食材短缺: ${ing.name}`,
        description: ing.notes || '食材库存不足',
        severity: 'high'
      })
    } else if (ing.stockStatus === 'LOW') {
      anomalies.push({
        id: ing.id,
        type: 'ingredient',
        title: `食材库存偏低: ${ing.name}`,
        description: ing.notes || '食材库存偏低',
        severity: 'medium'
      })
    } else if (ing.notes?.includes('异常') || ing.notes?.includes('问题')) {
      anomalies.push({
        id: ing.id,
        type: 'ingredient',
        title: `食材异常: ${ing.name}`,
        description: ing.notes,
        severity: 'high'
      })
    }
  })

  settlement.teamBuilding.accommodations.forEach((acc: AccommodationItem) => {
    if (!acc.depositPaid && acc.depositAmount) {
      anomalies.push({
        id: acc.id,
        type: 'accommodation',
        title: `押金未支付: ${acc.roomNumber}`,
        description: acc.notes || `押金 ${acc.depositAmount} 元未支付`,
        severity: 'medium'
      })
    }
    if (acc.notes?.includes('争议') || acc.notes?.includes('纠纷')) {
      anomalies.push({
        id: acc.id,
        type: 'accommodation',
        title: `押金争议: ${acc.roomNumber}`,
        description: acc.notes || '押金存在争议',
        severity: 'high'
      })
    }
    if (acc.notes?.includes('异常') || acc.notes?.includes('问题')) {
      if (!anomalies.some((a) => a.id === acc.id)) {
        anomalies.push({
          id: acc.id,
          type: 'accommodation',
          title: `住宿异常: ${acc.roomNumber}`,
          description: acc.notes,
          severity: 'high'
        })
      }
    }
  })

  return {
    id: settlement.id,
    teamBuildingId: settlement.teamBuildingId,
    activityName: settlement.teamBuilding.name,
    activityDate: settlement.teamBuilding.date.toISOString(),
    activityStatus: settlement.teamBuilding.status,
    activityNotes: settlement.teamBuilding.notes,
    status: settlement.status,
    totalAmount: Number(settlement.totalAmount),
    depositAmount: Number(settlement.depositAmount),
    paidAmount: Number(settlement.paidAmount),
    outstandingAmount: Number(settlement.outstandingAmount),
    notes: settlement.notes,
    createdAt: settlement.createdAt,
    updatedAt: settlement.updatedAt,
    updatedBy: settlement.updatedBy,
    anomalies
  }
}
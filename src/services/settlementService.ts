import prisma from '../prisma'
import { UpdateSettlementRequest, SettlementFilter, PaginatedResponse } from '../types'
import { ExpenseSettlement } from '@prisma/client'

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

export async function getSettlementById(id: string): Promise<ExpenseSettlement | null> {
  return prisma.expenseSettlement.findUnique({
    where: { id },
    include: { teamBuilding: { include: { privateRooms: true, accommodations: true, ingredients: true } } }
  })
}

export async function getSettlements(
  filter: SettlementFilter,
  page: number,
  pageSize: number
): Promise<PaginatedResponse<ExpenseSettlement>> {
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

  const [data, total] = await Promise.all([
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

  return { data, total, page, pageSize }
}

export async function updateSettlement(
  id: string,
  data: UpdateSettlementRequest,
  userId: string
): Promise<ExpenseSettlement | null> {
  const settlement = await prisma.expenseSettlement.findUnique({ where: { id } })

  if (!settlement) {
    throw new Error('Settlement not found')
  }

  const { paidAmount, ...rest } = data
  const newPaidAmount = paidAmount !== undefined ? paidAmount : Number(settlement.paidAmount)
  const newTotalAmount = data.totalAmount !== undefined ? data.totalAmount : Number(settlement.totalAmount)
  const outstandingAmount = newTotalAmount - newPaidAmount

  let status = settlement.status
  if (data.status) {
    status = data.status
  } else if (paidAmount !== undefined) {
    status = newPaidAmount >= newTotalAmount ? 'SETTLED' : newPaidAmount > 0 ? 'PARTIAL' : 'UNSETTLED'
  }

  return prisma.expenseSettlement.update({
    where: { id },
    data: {
      ...rest,
      paidAmount: newPaidAmount,
      outstandingAmount,
      status,
      updatedBy: userId
    },
    include: { teamBuilding: { include: { privateRooms: true, accommodations: true, ingredients: true } } }
  })
}

export async function getUnsettledSettlements(): Promise<ExpenseSettlement[]> {
  return prisma.expenseSettlement.findMany({
    where: { status: { in: ['UNSETTLED', 'PARTIAL', 'DISPUTED'] } },
    include: { teamBuilding: true },
    orderBy: { createdAt: 'asc' }
  })
}
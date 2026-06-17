import prisma from '../prisma'
import {
  CreateTeamBuildingRequest,
  UpdateTeamBuildingRequest,
  TeamBuildingFilter,
  PaginatedResponse
} from '../types'
import { TeamBuilding } from '@prisma/client'

export async function createTeamBuilding(
  data: CreateTeamBuildingRequest,
  userId: string
): Promise<TeamBuilding> {
  const { privateRooms, accommodations, ingredients, ...rest } = data

  return prisma.teamBuilding.create({
    data: {
      ...rest,
      date: new Date(data.date),
      status: 'PENDING',
      updatedBy: userId,
      privateRooms: privateRooms?.length
        ? {
            create: privateRooms.map((room) => ({
              ...room,
              bookedAt: new Date(room.bookedAt)
            }))
          }
        : undefined,
      accommodations: accommodations?.length
        ? {
            create: accommodations.map((acc) => ({
              ...acc,
              checkInDate: new Date(acc.checkInDate),
              checkOutDate: new Date(acc.checkOutDate)
            }))
          }
        : undefined,
      ingredients: ingredients?.length
        ? {
            create: ingredients.map((ing) => ({
              ...ing,
              stockStatus: ing.stockStatus as any
            }))
          }
        : undefined
    },
    include: {
      privateRooms: true,
      accommodations: true,
      ingredients: true,
      settlement: true
    }
  })
}

export async function getTeamBuildingById(id: string): Promise<TeamBuilding | null> {
  return prisma.teamBuilding.findUnique({
    where: { id },
    include: {
      privateRooms: true,
      accommodations: true,
      ingredients: true,
      settlement: true
    }
  })
}

export async function getTeamBuildings(
  filter: TeamBuildingFilter,
  page: number,
  pageSize: number
): Promise<PaginatedResponse<TeamBuilding>> {
  const { status, riskLevel, dateStart, dateEnd, keyword } = filter

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (riskLevel) {
    where.riskLevel = riskLevel
  }

  if (dateStart || dateEnd) {
    where.date = {}
    if (dateStart) {
      where.date.gte = new Date(dateStart)
    }
    if (dateEnd) {
      where.date.lte = new Date(dateEnd)
    }
  }

  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { contactName: { contains: keyword, mode: 'insensitive' } },
      { contactPhone: { contains: keyword } }
    ]
  }

  const [data, total] = await Promise.all([
    prisma.teamBuilding.findMany({
      where,
      include: {
        privateRooms: true,
        accommodations: true,
        ingredients: true,
        settlement: true
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.teamBuilding.count({ where })
  ])

  return { data, total, page, pageSize }
}

export async function updateTeamBuilding(
  id: string,
  data: UpdateTeamBuildingRequest,
  userId: string
): Promise<TeamBuilding | null> {
  const { date, status, ...rest } = data

  if (status !== undefined) {
    throw new Error('状态更新请使用专用的状态流转接口 /api/status-flow/activity/:id/transition')
  }

  return prisma.teamBuilding.update({
    where: { id },
    data: {
      ...rest,
      date: date ? new Date(date) : undefined,
      updatedBy: userId
    },
    include: {
      privateRooms: true,
      accommodations: true,
      ingredients: true,
      settlement: true
    }
  })
}

export async function deleteTeamBuilding(id: string): Promise<void> {
  await prisma.teamBuilding.delete({ where: { id } })
}

export async function getPendingTeamBuildings(): Promise<TeamBuilding[]> {
  return prisma.teamBuilding.findMany({
    where: { status: 'PENDING' },
    include: {
      privateRooms: true,
      accommodations: true,
      ingredients: true,
      settlement: true
    },
    orderBy: { date: 'asc' }
  })
}

export async function getHighRiskTeamBuildings(): Promise<TeamBuilding[]> {
  return prisma.teamBuilding.findMany({
    where: { riskLevel: 'HIGH' },
    include: {
      privateRooms: true,
      accommodations: true,
      ingredients: true,
      settlement: true
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getRecentChanges(days: number = 7): Promise<TeamBuilding[]> {
  const dateThreshold = new Date()
  dateThreshold.setDate(dateThreshold.getDate() - days)

  return prisma.teamBuilding.findMany({
    where: { updatedAt: { gte: dateThreshold } },
    include: {
      privateRooms: true,
      accommodations: true,
      ingredients: true,
      settlement: true
    },
    orderBy: { updatedAt: 'desc' }
  })
}
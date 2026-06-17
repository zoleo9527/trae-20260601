import prisma from '../prisma'

export type UserRole = 'OWNER' | 'CHEF' | 'HOUSEKEEPER' | 'ADMIN'

export interface TaskItem {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  relatedActivity?: string
  activityId?: string
}

export interface RiskItem {
  id: string
  title: string
  description: string
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  relatedActivity?: string
  activityId?: string
  category: 'room' | 'ingredient' | 'accommodation' | 'settlement'
}

export interface RoleView {
  role: UserRole
  pendingTasks: TaskItem[]
  risks: RiskItem[]
  recentActivities: ActivitySummary[]
  stats: RoleStats
}

export interface ActivitySummary {
  id: string
  name: string
  date: string
  status: string
  participantCount: number
}

export interface RoleStats {
  totalActivities: number
  pendingActivities: number
  highRiskActivities: number
  unsettledSettlements: number
}

export async function getOwnerView(): Promise<RoleView> {
  const [activities, settlements, highRiskActivities] = await Promise.all([
    prisma.teamBuilding.findMany({
      include: { settlement: true, privateRooms: true, accommodations: true, ingredients: true },
      orderBy: { date: 'asc' }
    }),
    prisma.expenseSettlement.findMany({
      where: { status: { in: ['UNSETTLED', 'PARTIAL', 'DISPUTED'] } },
      include: { teamBuilding: true }
    }),
    prisma.teamBuilding.findMany({
      where: { riskLevel: { in: ['HIGH', 'MEDIUM'] } },
      orderBy: { updatedAt: 'desc' }
    })
  ])

  const pendingTasks: TaskItem[] = []
  const risks: RiskItem[] = []

  activities.forEach((activity) => {
    if (activity.status === 'PENDING') {
      pendingTasks.push({
        id: activity.id,
        title: `确认团建活动: ${activity.name}`,
        description: `联系人: ${activity.contactName}, 日期: ${new Date(activity.date).toLocaleDateString()}`,
        priority: 'high',
        dueDate: activity.date.toISOString(),
        relatedActivity: activity.name,
        activityId: activity.id
      })
    }

    activity.privateRooms?.forEach((room) => {
      if (room.notes?.includes('超订') || room.notes?.includes('预警')) {
        risks.push({
          id: room.id,
          title: `包间预订异常: ${room.name}`,
          description: room.notes || '包间存在超订风险',
          level: 'HIGH',
          relatedActivity: activity.name,
          activityId: activity.id,
          category: 'room'
        })
      }
    })

    activity.ingredients?.forEach((ing) => {
      if (ing.stockStatus === 'LOW' || ing.stockStatus === 'INSUFFICIENT') {
        risks.push({
          id: ing.id,
          title: `食材库存不足: ${ing.name}`,
          description: ing.notes || `当前库存状态: ${ing.stockStatus}`,
          level: ing.stockStatus === 'INSUFFICIENT' ? 'HIGH' : 'MEDIUM',
          relatedActivity: activity.name,
          activityId: activity.id,
          category: 'ingredient'
        })
      }
    })

    activity.accommodations?.forEach((acc) => {
      if (!acc.depositPaid && acc.depositAmount) {
        risks.push({
          id: acc.id,
          title: `押金未支付: ${acc.roomNumber}`,
          description: acc.notes || `押金 ${acc.depositAmount} 元未支付`,
          level: 'MEDIUM',
          relatedActivity: activity.name,
          activityId: activity.id,
          category: 'accommodation'
        })
      }
    })
  })

  settlements.forEach((settlement) => {
    if (settlement.status === 'PARTIAL') {
      pendingTasks.push({
        id: settlement.id,
        title: `跟进费用结算: ${settlement.teamBuilding.name}`,
        description: `待收金额: ${settlement.outstandingAmount} 元`,
        priority: 'medium',
        relatedActivity: settlement.teamBuilding.name,
        activityId: settlement.teamBuildingId
      })
    } else if (settlement.status === 'UNSETTLED') {
      pendingTasks.push({
        id: settlement.id,
        title: `处理费用结算: ${settlement.teamBuilding.name}`,
        description: `总金额: ${settlement.totalAmount} 元，尚未结算`,
        priority: 'high',
        relatedActivity: settlement.teamBuilding.name,
        activityId: settlement.teamBuildingId
      })
    } else if (settlement.status === 'DISPUTED') {
      risks.push({
        id: settlement.id,
        title: `结算争议: ${settlement.teamBuilding.name}`,
        description: settlement.notes || '存在费用争议',
        level: 'HIGH',
        relatedActivity: settlement.teamBuilding.name,
        activityId: settlement.teamBuildingId,
        category: 'settlement'
      })
    }
  })

  const recentActivities = activities.slice(0, 5).map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date.toISOString(),
    status: a.status,
    participantCount: a.participantCount
  }))

  return {
    role: 'OWNER',
    pendingTasks,
    risks,
    recentActivities,
    stats: {
      totalActivities: activities.length,
      pendingActivities: activities.filter((a) => a.status === 'PENDING').length,
      highRiskActivities: highRiskActivities.length,
      unsettledSettlements: settlements.length
    }
  }
}

export async function getChefView(): Promise<RoleView> {
  const activities = await prisma.teamBuilding.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    include: { ingredients: true },
    orderBy: { date: 'asc' }
  })

  const pendingTasks: TaskItem[] = []
  const risks: RiskItem[] = []

  activities.forEach((activity) => {
    const hasInsufficientIngredients = activity.ingredients.some(
      (ing) => ing.stockStatus === 'INSUFFICIENT'
    )
    const hasLowIngredients = activity.ingredients.some(
      (ing) => ing.stockStatus === 'LOW'
    )

    if (hasInsufficientIngredients) {
      pendingTasks.push({
        id: activity.id,
        title: `采购食材: ${activity.name}`,
        description: '部分食材库存不足，需紧急采购',
        priority: 'high',
        dueDate: activity.date.toISOString(),
        relatedActivity: activity.name,
        activityId: activity.id
      })
    } else if (hasLowIngredients) {
      pendingTasks.push({
        id: activity.id,
        title: `补充食材: ${activity.name}`,
        description: '部分食材库存偏低，建议补充',
        priority: 'medium',
        dueDate: activity.date.toISOString(),
        relatedActivity: activity.name,
        activityId: activity.id
      })
    }

    if (activity.notes?.includes('素食') || activity.notes?.includes('特殊')) {
      pendingTasks.push({
        id: `${activity.id}-special`,
        title: `特殊菜品准备: ${activity.name}`,
        description: activity.notes || '有特殊饮食要求',
        priority: 'medium',
        dueDate: activity.date.toISOString(),
        relatedActivity: activity.name,
        activityId: activity.id
      })
    }

    activity.ingredients.forEach((ing) => {
      if (ing.stockStatus === 'INSUFFICIENT') {
        risks.push({
          id: ing.id,
          title: `食材短缺: ${ing.name}`,
          description: ing.notes || `库存状态: ${ing.stockStatus}`,
          level: 'HIGH',
          relatedActivity: activity.name,
          activityId: activity.id,
          category: 'ingredient'
        })
      } else if (ing.stockStatus === 'LOW') {
        risks.push({
          id: ing.id,
          title: `食材库存偏低: ${ing.name}`,
          description: ing.notes || '库存不足，需采购',
          level: 'MEDIUM',
          relatedActivity: activity.name,
          activityId: activity.id,
          category: 'ingredient'
        })
      }
    })
  })

  const recentActivities = activities.slice(0, 5).map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date.toISOString(),
    status: a.status,
    participantCount: a.participantCount
  }))

  return {
    role: 'CHEF',
    pendingTasks,
    risks,
    recentActivities,
    stats: {
      totalActivities: activities.length,
      pendingActivities: activities.filter((a) => a.status === 'PENDING').length,
      highRiskActivities: risks.filter((r) => r.level === 'HIGH').length,
      unsettledSettlements: 0
    }
  }
}

export async function getHousekeeperView(): Promise<RoleView> {
  const activities = await prisma.teamBuilding.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    include: { accommodations: true, privateRooms: true },
    orderBy: { date: 'asc' }
  })

  const pendingTasks: TaskItem[] = []
  const risks: RiskItem[] = []

  activities.forEach((activity) => {
    activity.accommodations.forEach((acc) => {
      if (!acc.depositPaid && acc.depositAmount) {
        pendingTasks.push({
          id: acc.id,
          title: `催收押金: ${acc.roomNumber} - ${acc.guestName}`,
          description: `押金 ${acc.depositAmount} 元未支付，需联系客人`,
          priority: 'high',
          dueDate: acc.checkInDate.toISOString(),
          relatedActivity: activity.name,
          activityId: activity.id
        })
      }

      pendingTasks.push({
        id: `${acc.id}-clean`,
        title: `打扫房间: ${acc.roomNumber}`,
        description: `${acc.guestName} 入住，需提前打扫`,
        priority: 'medium',
        dueDate: acc.checkInDate.toISOString(),
        relatedActivity: activity.name,
        activityId: activity.id
      })
    })

    activity.privateRooms.forEach((room) => {
      if (room.notes?.includes('检修') || room.notes?.includes('维护')) {
        pendingTasks.push({
          id: room.id,
          title: `包间维护: ${room.name}`,
          description: room.notes || '包间需要检修维护',
          priority: 'high',
          relatedActivity: activity.name,
          activityId: activity.id
        })
      }

      if (room.notes?.includes('超订')) {
        risks.push({
          id: room.id,
          title: `包间超订: ${room.name}`,
          description: room.notes || '包间存在超订风险',
          level: 'HIGH',
          relatedActivity: activity.name,
          activityId: activity.id,
          category: 'room'
        })
      }
    })

    activity.accommodations.forEach((acc) => {
      if (acc.notes?.includes('异常') || acc.notes?.includes('问题')) {
        risks.push({
          id: acc.id,
          title: `住宿异常: ${acc.roomNumber}`,
          description: acc.notes,
          level: 'MEDIUM',
          relatedActivity: activity.name,
          activityId: activity.id,
          category: 'accommodation'
        })
      }
    })
  })

  const recentActivities = activities.slice(0, 5).map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date.toISOString(),
    status: a.status,
    participantCount: a.participantCount
  }))

  return {
    role: 'HOUSEKEEPER',
    pendingTasks,
    risks,
    recentActivities,
    stats: {
      totalActivities: activities.length,
      pendingActivities: activities.filter((a) => a.status === 'PENDING').length,
      highRiskActivities: risks.filter((r) => r.level === 'HIGH').length,
      unsettledSettlements: 0
    }
  }
}

export async function getRoleView(role: UserRole): Promise<RoleView> {
  switch (role) {
    case 'OWNER':
      return getOwnerView()
    case 'CHEF':
      return getChefView()
    case 'HOUSEKEEPER':
      return getHousekeeperView()
    default:
      return getOwnerView()
  }
}
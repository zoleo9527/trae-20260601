import { type Request, type Response } from 'express'
import * as CustomerService from '../services/CustomerService.js'
import * as HandoverService from '../services/HandoverService.js'
import * as UserService from '../services/UserService.js'
import * as NoteService from '../services/NoteService.js'
import { ApiResponse, DashboardStats, HandoverRateStats, RenewalRateStats, CustomerStatus, RiskLevel, HandoverStatus } from '../types/types.js'

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const customerStats = await CustomerService.getCustomerStats()
  const handoverStats = await HandoverService.getHandoverStats()
  const userStats = await UserService.getUserStats()

  const stats: DashboardStats = {
    totalCustomers: customerStats.total,
    activeCustomers: customerStats.byStatus[CustomerStatus.ACTIVE],
    expiringCustomers: customerStats.byStatus[CustomerStatus.EXPIRING],
    expiredCustomers: customerStats.byStatus[CustomerStatus.EXPIRED],
    suspendedCustomers: customerStats.byStatus[CustomerStatus.SUSPENDED],
    highRiskCustomers: customerStats.byRiskLevel[RiskLevel.HIGH],
    mediumRiskCustomers: customerStats.byRiskLevel[RiskLevel.MEDIUM],
    lowRiskCustomers: customerStats.byRiskLevel[RiskLevel.LOW],
    pendingHandovers: handoverStats.byStatus[HandoverStatus.PENDING],
    approvedHandovers: handoverStats.byStatus[HandoverStatus.APPROVED],
    totalHandovers: handoverStats.total,
    totalUsers: userStats.total,
    activeUsers: userStats.active
  }

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats
  }

  res.json(response)
}

export async function getHandoverRate(req: Request, res: Response): Promise<void> {
  const handoverStats = await HandoverService.getHandoverStats()

  const total = handoverStats.total
  const approved = handoverStats.byStatus[HandoverStatus.APPROVED]
  const rejected = handoverStats.byStatus[HandoverStatus.REJECTED]
  const pending = handoverStats.byStatus[HandoverStatus.PENDING]

  const approvalRate = total > 0 ? (approved / total) * 100 : 0

  const stats: HandoverRateStats = {
    totalHandovers: total,
    approvedHandovers: approved,
    rejectedHandovers: rejected,
    pendingHandovers: pending,
    approvalRate
  }

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats
  }

  res.json(response)
}

export async function getRenewalRate(req: Request, res: Response): Promise<void> {
  const customerStats = await CustomerService.getCustomerStats()

  const expired = customerStats.byStatus[CustomerStatus.EXPIRED]
  const active = customerStats.byStatus[CustomerStatus.ACTIVE]
  const expiring = customerStats.byStatus[CustomerStatus.EXPIRING]

  const totalExpired = expired + expiring
  const renewed = active
  const pending = expiring

  const renewalRate = totalExpired > 0 ? (renewed / (renewed + expired)) * 100 : 100

  const stats: RenewalRateStats = {
    totalExpired,
    renewed,
    notRenewed: expired,
    pending,
    renewalRate
  }

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats
  }

  res.json(response)
}
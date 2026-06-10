import { RepaymentRepository } from '../repositories/RepaymentRepository'
import { FarmerRepository } from '../repositories/FarmerRepository'
import { IRepayment } from '../models/Repayment'

export interface RepaymentRequest {
  repaymentId: string
  amount: number
  operatorId: string
  operatorName: string
}

export interface FarmerDebtSummary {
  farmerId: string
  name: string
  currentDebt: number
  totalOrders: number
  pendingRepayments: number
}

export class RepaymentService {
  private repaymentRepository: RepaymentRepository
  private farmerRepository: FarmerRepository

  constructor() {
    this.repaymentRepository = new RepaymentRepository()
    this.farmerRepository = new FarmerRepository()
  }

  async getRepaymentById(repaymentId: string): Promise<IRepayment> {
    const repayment = await this.repaymentRepository.findById(repaymentId)
    if (!repayment) {
      throw new Error(`还款记录不存在: ${repaymentId}`)
    }
    return repayment
  }

  async getPendingRepayments(): Promise<IRepayment[]> {
    return await this.repaymentRepository.findPending()
  }

  async getRepaymentsByFarmerId(farmerId: string): Promise<IRepayment[]> {
    return await this.repaymentRepository.findByFarmerId(farmerId)
  }

  async makePayment(request: RepaymentRequest): Promise<IRepayment> {
    const repayment = await this.getRepaymentById(request.repaymentId)
    
    if (repayment.status === 'paid') {
      throw new Error('该账单已结清')
    }

    if (request.amount <= 0) {
      throw new Error('还款金额必须大于0')
    }

    const remaining = repayment.amount - repayment.paidAmount
    if (request.amount > remaining) {
      throw new Error(`还款金额超出待还金额: 待还 ${remaining}, 还款 ${request.amount}`)
    }

    const updated = await this.repaymentRepository.pay(request.repaymentId, request.amount)
    if (!updated) {
      throw new Error(`还款失败: ${request.repaymentId}`)
    }

    await this.farmerRepository.updateDebt(repayment.farmerId, -request.amount)

    return updated
  }

  async getFarmerDebtSummary(farmerId: string): Promise<FarmerDebtSummary> {
    const farmer = await this.farmerRepository.findById(farmerId)
    if (!farmer) {
      throw new Error(`农户不存在: ${farmerId}`)
    }

    const repayments = await this.repaymentRepository.findByFarmerId(farmerId)
    const pendingRepayments = repayments.filter(r => r.status !== 'paid').reduce((sum, r) => sum + (r.amount - r.paidAmount), 0)

    return {
      farmerId: farmer.farmerId,
      name: farmer.name,
      currentDebt: farmer.currentDebt,
      totalOrders: repayments.length,
      pendingRepayments
    }
  }

  async getAllPendingDebts(): Promise<FarmerDebtSummary[]> {
    const farmers = await this.farmerRepository.findWithDebt()
    const summaries: FarmerDebtSummary[] = []

    for (const farmer of farmers) {
      const summary = await this.getFarmerDebtSummary(farmer.farmerId)
      summaries.push(summary)
    }

    return summaries.sort((a, b) => b.currentDebt - a.currentDebt)
  }
}
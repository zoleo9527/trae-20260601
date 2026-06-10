import { FarmerRepository } from '../repositories/FarmerRepository'
import { IFarmer } from '../models/Farmer'
import { v4 as uuidv4 } from 'uuid'

export interface CreateFarmerRequest {
  name: string
  phone: string
  idCard: string
  address: string
  landArea: number
  crops: string[]
}

export interface UpdateFarmerRequest {
  name?: string
  phone?: string
  address?: string
  landArea?: number
  crops?: string[]
}

export interface FarmerCreditResult {
  farmerId: string
  name: string
  currentDebt: number
  creditLimit: number
  availableCredit: number
  creditLevel: string
}

export class FarmerService {
  private farmerRepository: FarmerRepository

  constructor() {
    this.farmerRepository = new FarmerRepository()
  }

  async createFarmer(request: CreateFarmerRequest): Promise<IFarmer> {
    const existingByPhone = await this.farmerRepository.findByPhone(request.phone)
    if (existingByPhone) {
      throw new Error(`农户手机号已存在: ${request.phone}`)
    }

    const existingByIdCard = await this.farmerRepository.findByPhone(request.idCard)
    if (existingByIdCard) {
      throw new Error(`农户身份证号已存在: ${request.idCard}`)
    }

    const creditLevel = this.calculateCreditLevel(request.landArea)
    const creditLimit = this.calculateCreditLimit(creditLevel, request.landArea)

    const farmer: Partial<IFarmer> = {
      farmerId: `FARMER-${uuidv4().slice(0, 8).toUpperCase()}`,
      name: request.name,
      phone: request.phone,
      idCard: request.idCard,
      address: request.address,
      landArea: request.landArea,
      crops: request.crops,
      creditLevel,
      creditLimit,
      currentDebt: 0
    }

    return await this.farmerRepository.create(farmer)
  }

  async getFarmerById(farmerId: string): Promise<IFarmer> {
    const farmer = await this.farmerRepository.findById(farmerId)
    if (!farmer) {
      throw new Error(`农户不存在: ${farmerId}`)
    }
    return farmer
  }

  async getFarmerByPhone(phone: string): Promise<IFarmer> {
    const farmer = await this.farmerRepository.findByPhone(phone)
    if (!farmer) {
      throw new Error(`农户不存在: ${phone}`)
    }
    return farmer
  }

  async getAllFarmers(): Promise<IFarmer[]> {
    return await this.farmerRepository.findAll()
  }

  async getFarmersWithDebt(): Promise<IFarmer[]> {
    return await this.farmerRepository.findWithDebt()
  }

  async updateFarmer(farmerId: string, request: UpdateFarmerRequest): Promise<IFarmer> {
    const farmer = await this.getFarmerById(farmerId)
    
    if (request.phone && request.phone !== farmer.phone) {
      const existing = await this.farmerRepository.findByPhone(request.phone)
      if (existing && existing.farmerId !== farmerId) {
        throw new Error(`手机号已被使用: ${request.phone}`)
      }
    }

    const updateData: Partial<IFarmer> = { ...request }
    
    if (request.landArea !== undefined && request.landArea !== farmer.landArea) {
      const creditLevel = this.calculateCreditLevel(request.landArea)
      const creditLimit = this.calculateCreditLimit(creditLevel, request.landArea)
      updateData.creditLevel = creditLevel
      updateData.creditLimit = creditLimit
    }

    const updated = await this.farmerRepository.update(farmerId, updateData)
    if (!updated) {
      throw new Error(`更新农户失败: ${farmerId}`)
    }
    return updated
  }

  async updateCreditLimit(farmerId: string, creditLimit: number): Promise<IFarmer> {
    const farmer = await this.getFarmerById(farmerId)
    if (creditLimit < farmer.currentDebt) {
      throw new Error('授信额度不能低于当前欠款')
    }
    
    const updated = await this.farmerRepository.update(farmerId, { creditLimit })
    if (!updated) {
      throw new Error(`更新授信额度失败: ${farmerId}`)
    }
    return updated
  }

  async updateDebt(farmerId: string, amount: number): Promise<IFarmer> {
    const farmer = await this.getFarmerById(farmerId)
    const newDebt = farmer.currentDebt + amount
    
    if (newDebt < 0) {
      throw new Error('欠款不能为负数')
    }
    
    if (newDebt > farmer.creditLimit) {
      throw new Error(`超出授信额度: 当前欠款 ${farmer.currentDebt}, 新增 ${amount}, 额度 ${farmer.creditLimit}`)
    }

    const updated = await this.farmerRepository.updateDebt(farmerId, amount)
    if (!updated) {
      throw new Error(`更新欠款失败: ${farmerId}`)
    }
    return updated
  }

  async deleteFarmer(farmerId: string): Promise<void> {
    const farmer = await this.getFarmerById(farmerId)
    if (farmer.currentDebt > 0) {
      throw new Error(`农户存在未结清欠款: ${farmer.currentDebt}`)
    }
    await this.farmerRepository.delete(farmerId)
  }

  async getCreditInfo(farmerId: string): Promise<FarmerCreditResult> {
    const farmer = await this.getFarmerById(farmerId)
    return {
      farmerId: farmer.farmerId,
      name: farmer.name,
      currentDebt: farmer.currentDebt,
      creditLimit: farmer.creditLimit,
      availableCredit: farmer.creditLimit - farmer.currentDebt,
      creditLevel: farmer.creditLevel
    }
  }

  private calculateCreditLevel(landArea: number): 'A' | 'B' | 'C' | 'D' {
    if (landArea >= 50) return 'A'
    if (landArea >= 30) return 'B'
    if (landArea >= 10) return 'C'
    return 'D'
  }

  private calculateCreditLimit(level: string, landArea: number): number {
    const baseLimits: Record<string, number> = {
      'A': 50000,
      'B': 30000,
      'C': 15000,
      'D': 5000
    }
    return baseLimits[level] + landArea * 200
  }
}
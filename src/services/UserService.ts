import { UserRepository } from '../repositories/UserRepository'
import { IUser, UserRole } from '../models/User'
import { v4 as uuidv4 } from 'uuid'

export interface CreateUserRequest {
  name: string
  phone: string
  role: UserRole
  password: string
}

export class UserService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  async createUser(request: CreateUserRequest): Promise<IUser> {
    const existing = await this.userRepository.findByPhone(request.phone)
    if (existing) {
      throw new Error(`用户已存在: ${request.phone}`)
    }

    const user: Partial<IUser> = {
      userId: `USER-${request.role.toUpperCase().slice(0, 4)}-${uuidv4().slice(0, 4).toUpperCase()}`,
      name: request.name,
      phone: request.phone,
      role: request.role,
      password: request.password
    }

    return await this.userRepository.create(user)
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error(`用户不存在: ${userId}`)
    }
    return user
  }

  async getUserByPhone(phone: string): Promise<IUser> {
    const user = await this.userRepository.findByPhone(phone)
    if (!user) {
      throw new Error(`用户不存在: ${phone}`)
    }
    return user
  }

  async getAllUsers(): Promise<IUser[]> {
    return await this.userRepository.findAll()
  }

  async validateCreatorRole(userId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (user.role !== 'technician') {
      throw new Error(`操作权限不足: 只有农技员可以创建订单，当前用户角色: ${user.role}`)
    }
  }

  async validateApproverRole(userId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (user.role !== 'owner') {
      throw new Error(`操作权限不足: 只有门店老板可以审批订单，当前用户角色: ${user.role}`)
    }
  }

  async validateShipperRole(userId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (user.role !== 'warehouse') {
      throw new Error(`操作权限不足: 只有仓管可以发货，当前用户角色: ${user.role}`)
    }
  }

  async validateCompleterRole(userId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (user.role !== 'warehouse') {
      throw new Error(`操作权限不足: 只有仓管可以完成订单，当前用户角色: ${user.role}`)
    }
  }
}
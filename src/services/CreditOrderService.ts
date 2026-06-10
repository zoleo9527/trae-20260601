import { OrderRepository } from '../repositories/OrderRepository'
import { ProductRepository } from '../repositories/ProductRepository'
import { FarmerRepository } from '../repositories/FarmerRepository'
import { RepaymentRepository } from '../repositories/RepaymentRepository'
import { UserService } from './UserService'
import { ICreditOrder, IOrderItem, OrderStatus } from '../models/CreditOrder'
import { IFarmer } from '../models/Farmer'
import { IProduct } from '../models/Product'
import { v4 as uuidv4 } from 'uuid'

export interface CreateOrderItem {
  productId: string
  quantity: number
}

export interface CreateOrderRequest {
  farmerId: string
  items: CreateOrderItem[]
  operatorId: string
  operatorName: string
}

export interface OrderApprovalRequest {
  orderId: string
  operatorId: string
  operatorName: string
  approve: boolean
  comment?: string
}

export interface OrderShipmentRequest {
  orderId: string
  operatorId: string
  operatorName: string
}

export interface OrderCompletionRequest {
  orderId: string
  operatorId: string
  operatorName: string
}

export interface OrderResult {
  success: boolean
  order?: ICreditOrder
  warnings: string[]
  errors: string[]
}

export class CreditOrderService {
  private orderRepository: OrderRepository
  private productRepository: ProductRepository
  private farmerRepository: FarmerRepository
  private repaymentRepository: RepaymentRepository
  private userService: UserService

  constructor() {
    this.orderRepository = new OrderRepository()
    this.productRepository = new ProductRepository()
    this.farmerRepository = new FarmerRepository()
    this.repaymentRepository = new RepaymentRepository()
    this.userService = new UserService()
  }

  async createOrder(request: CreateOrderRequest): Promise<OrderResult> {
    const warnings: string[] = []
    const errors: string[] = []

    let creatorUser
    try {
      creatorUser = await this.userService.getUserById(request.operatorId)
      await this.userService.validateCreatorRole(request.operatorId)
    } catch (error: any) {
      errors.push(error.message)
      return { success: false, warnings, errors }
    }

    const farmer = await this.farmerRepository.findById(request.farmerId)
    if (!farmer) {
      errors.push(`农户不存在: ${request.farmerId}`)
      return { success: false, warnings, errors }
    }

    const orderItems: IOrderItem[] = []
    let totalAmount = 0

    for (const item of request.items) {
      const product = await this.productRepository.findById(item.productId)
      if (!product) {
        errors.push(`商品不存在: ${item.productId}`)
        continue
      }

      if (product.stock < item.quantity) {
        errors.push(`库存不足: ${product.name}, 库存 ${product.stock}, 需求 ${item.quantity}`)
        continue
      }

      let isRestricted = false
      let restrictedReason: string | undefined

      if (product.isRestricted) {
        isRestricted = true
        restrictedReason = product.restrictedReason
        
        if (product.restrictedCrops && farmer.crops.length > 0) {
          const hasRestrictedCrop = farmer.crops.some(crop => 
            product.restrictedCrops!.includes(crop)
          )
          if (hasRestrictedCrop) {
            errors.push(`禁限用药提醒: ${product.name} 不适用于 ${farmer.crops.join(', ')}`)
          } else {
            warnings.push(`注意: ${product.name} 为禁限用药，已确认适用`)
          }
        } else {
          warnings.push(`注意: ${product.name} 为禁限用药`)
        }
      }

      if (product.stock <= product.minStock) {
        warnings.push(`库存预警: ${product.name} 库存 ${product.stock}，接近最低库存 ${product.minStock}`)
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        productId: product.productId,
        productName: product.name,
        productType: product.type,
        quantity: item.quantity,
        unitPrice: product.price,
        totalAmount: itemTotal,
        isRestricted,
        restrictedReason
      })
    }

    if (errors.length > 0) {
      return { success: false, warnings, errors }
    }

    if (totalAmount > farmer.creditLimit - farmer.currentDebt) {
      errors.push(`超出可用授信额度: 订单金额 ${totalAmount}, 可用额度 ${farmer.creditLimit - farmer.currentDebt}`)
      return { success: false, warnings, errors }
    }

    const order: Partial<ICreditOrder> = {
      orderId: `ORDER-${uuidv4().slice(0, 8).toUpperCase()}`,
      farmerId: farmer.farmerId,
      farmerName: farmer.name,
      items: orderItems,
      totalAmount,
      status: 'pending',
      creatorId: creatorUser.userId,
      creatorName: creatorUser.name
    }

    const createdOrder = await this.orderRepository.create(order)
    return { success: true, order: createdOrder, warnings, errors }
  }

  async getOrderById(orderId: string): Promise<ICreditOrder> {
    const order = await this.orderRepository.findById(orderId)
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`)
    }
    return order
  }

  async getPendingOrders(): Promise<ICreditOrder[]> {
    return await this.orderRepository.findPendingOrders()
  }

  async getOrdersByFarmerId(farmerId: string): Promise<ICreditOrder[]> {
    return await this.orderRepository.findByFarmerId(farmerId)
  }

  async approveOrder(request: OrderApprovalRequest): Promise<OrderResult> {
    const warnings: string[] = []
    const errors: string[] = []

    let approverUser
    try {
      approverUser = await this.userService.getUserById(request.operatorId)
      await this.userService.validateApproverRole(request.operatorId)
    } catch (error: any) {
      errors.push(error.message)
      return { success: false, warnings, errors }
    }

    const order = await this.getOrderById(request.orderId)
    
    if (order.status !== 'pending') {
      errors.push(`订单状态错误: 当前状态 ${order.status}，需要 pending`)
      return { success: false, warnings, errors }
    }

    if (request.approve) {
      const farmer = await this.farmerRepository.findById(order.farmerId)
      if (!farmer) {
        errors.push(`农户不存在: ${order.farmerId}`)
        return { success: false, warnings, errors }
      }

      if (order.totalAmount > farmer.creditLimit - farmer.currentDebt) {
        errors.push(`超出可用授信额度: 订单金额 ${order.totalAmount}, 可用额度 ${farmer.creditLimit - farmer.currentDebt}`)
        return { success: false, warnings, errors }
      }

      await this.farmerRepository.updateDebt(order.farmerId, order.totalAmount)

      const updatedOrder = await this.orderRepository.approveOrder(
        order.orderId,
        approverUser.userId,
        approverUser.name,
        request.comment
      )

      await this.repaymentRepository.create({
        repaymentId: `REPAY-${uuidv4().slice(0, 8).toUpperCase()}`,
        orderId: order.orderId,
        farmerId: order.farmerId,
        farmerName: order.farmerName,
        amount: order.totalAmount,
        paidAmount: 0,
        status: 'pending'
      })

      return { success: true, order: updatedOrder!, warnings, errors }
    } else {
      const updatedOrder = await this.orderRepository.rejectOrder(
        order.orderId,
        approverUser.userId,
        approverUser.name,
        request.comment
      )
      return { success: true, order: updatedOrder!, warnings, errors }
    }
  }

  async shipOrder(request: OrderShipmentRequest): Promise<OrderResult> {
    const warnings: string[] = []
    const errors: string[] = []

    let shipperUser
    try {
      shipperUser = await this.userService.getUserById(request.operatorId)
      await this.userService.validateShipperRole(request.operatorId)
    } catch (error: any) {
      errors.push(error.message)
      return { success: false, warnings, errors }
    }

    const order = await this.getOrderById(request.orderId)
    
    if (order.status !== 'approved') {
      errors.push(`订单状态错误: 当前状态 ${order.status}，需要 approved`)
      return { success: false, warnings, errors }
    }

    for (const item of order.items) {
      const product = await this.productRepository.findById(item.productId)
      if (!product) {
        errors.push(`商品不存在: ${item.productId}`)
        continue
      }

      if (product.stock < item.quantity) {
        errors.push(`库存不足: ${product.name}, 库存 ${product.stock}, 需求 ${item.quantity}`)
        continue
      }

      await this.productRepository.updateStock(item.productId, -item.quantity)
    }

    if (errors.length > 0) {
      return { success: false, warnings, errors }
    }

    const updatedOrder = await this.orderRepository.shipOrder(
      order.orderId,
      shipperUser.userId,
      shipperUser.name
    )
    return { success: true, order: updatedOrder!, warnings, errors }
  }

  async completeOrder(request: OrderCompletionRequest): Promise<OrderResult> {
    const warnings: string[] = []
    const errors: string[] = []

    let completerUser
    try {
      completerUser = await this.userService.getUserById(request.operatorId)
      await this.userService.validateCompleterRole(request.operatorId)
    } catch (error: any) {
      errors.push(error.message)
      return { success: false, warnings, errors }
    }

    const order = await this.getOrderById(request.orderId)
    
    if (order.status !== 'shipped') {
      errors.push(`订单状态错误: 当前状态 ${order.status}，需要 shipped`)
      return { success: false, warnings, errors }
    }

    const updatedOrder = await this.orderRepository.completeOrder(
      order.orderId,
      completerUser.userId,
      completerUser.name
    )
    return { success: true, order: updatedOrder!, warnings, errors }
  }

  async getAllOrders(): Promise<ICreditOrder[]> {
    return await this.orderRepository.findAll()
  }
}
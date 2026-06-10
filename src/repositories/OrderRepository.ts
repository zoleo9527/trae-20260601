import CreditOrder, { ICreditOrder, OrderStatus } from '../models/CreditOrder'

export class OrderRepository {
  async create(order: Partial<ICreditOrder>): Promise<ICreditOrder> {
    const newOrder = new CreditOrder(order)
    return await newOrder.save()
  }

  async findById(orderId: string): Promise<ICreditOrder | null> {
    return await CreditOrder.findOne({ orderId })
  }

  async findByFarmerId(farmerId: string): Promise<ICreditOrder[]> {
    return await CreditOrder.find({ farmerId }).sort({ createdAt: -1 })
  }

  async findByStatus(status: OrderStatus): Promise<ICreditOrder[]> {
    return await CreditOrder.find({ status }).sort({ createdAt: -1 })
  }

  async findPendingOrders(): Promise<ICreditOrder[]> {
    return await CreditOrder.find({ status: 'pending' }).sort({ createdAt: -1 })
  }

  async findApprovedOrders(): Promise<ICreditOrder[]> {
    return await CreditOrder.find({ status: 'approved' }).sort({ createdAt: -1 })
  }

  async updateStatus(orderId: string, status: OrderStatus, comment?: string): Promise<ICreditOrder | null> {
    const update: Partial<ICreditOrder> = { status }
    if (comment) update.approvalComment = comment
    if (status === 'completed') update.completedAt = new Date()
    return await CreditOrder.findOneAndUpdate({ orderId }, update, { new: true })
  }

  async update(orderId: string, updateData: Partial<ICreditOrder>): Promise<ICreditOrder | null> {
    return await CreditOrder.findOneAndUpdate({ orderId }, updateData, { new: true })
  }

  async findAll(): Promise<ICreditOrder[]> {
    return await CreditOrder.find().sort({ createdAt: -1 })
  }

  async findUncompletedOrders(): Promise<ICreditOrder[]> {
    return await CreditOrder.find({ 
      status: { $in: ['pending', 'approved', 'shipped'] } 
    }).sort({ createdAt: -1 })
  }
}
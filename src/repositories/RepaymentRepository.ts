import Repayment, { IRepayment, RepaymentStatus } from '../models/Repayment'

export class RepaymentRepository {
  async create(repayment: Partial<IRepayment>): Promise<IRepayment> {
    const newRepayment = new Repayment(repayment)
    return await newRepayment.save()
  }

  async findById(repaymentId: string): Promise<IRepayment | null> {
    return await Repayment.findOne({ repaymentId })
  }

  async findByOrderId(orderId: string): Promise<IRepayment | null> {
    return await Repayment.findOne({ orderId })
  }

  async findByFarmerId(farmerId: string): Promise<IRepayment[]> {
    return await Repayment.find({ farmerId }).sort({ createdAt: -1 })
  }

  async findByStatus(status: RepaymentStatus): Promise<IRepayment[]> {
    return await Repayment.find({ status }).sort({ createdAt: -1 })
  }

  async findPending(): Promise<IRepayment[]> {
    return await Repayment.find({ status: { $in: ['pending', 'partial'] } }).sort({ createdAt: -1 })
  }

  async update(repaymentId: string, updateData: Partial<IRepayment>): Promise<IRepayment | null> {
    return await Repayment.findOneAndUpdate({ repaymentId }, updateData, { new: true })
  }

  async pay(repaymentId: string, amount: number): Promise<IRepayment | null> {
    const repayment = await Repayment.findOne({ repaymentId })
    if (!repayment) return null
    
    const newPaidAmount = repayment.paidAmount + amount
    let newStatus: RepaymentStatus = 'partial'
    
    if (newPaidAmount >= repayment.amount) {
      newPaidAmount = repayment.amount
      newStatus = 'paid'
    } else if (newPaidAmount === 0) {
      newStatus = 'pending'
    }
    
    return await Repayment.findOneAndUpdate(
      { repaymentId },
      { 
        paidAmount: newPaidAmount, 
        status: newStatus,
        paymentDate: new Date()
      },
      { new: true }
    )
  }
}
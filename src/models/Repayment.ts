import mongoose, { Schema, Document } from 'mongoose'

export type RepaymentStatus = 'pending' | 'partial' | 'paid'

export interface IRepayment extends Document {
  repaymentId: string
  orderId: string
  farmerId: string
  farmerName: string
  amount: number
  paidAmount: number
  status: RepaymentStatus
  paymentDate?: Date
  createdAt: Date
  updatedAt: Date
}

const RepaymentSchema: Schema = new Schema({
  repaymentId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  farmerId: { type: String, required: true },
  farmerName: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  paymentDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

RepaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<IRepayment>('Repayment', RepaymentSchema)
import mongoose, { Schema, Document } from 'mongoose'

export type OrderStatus = 'pending' | 'approved' | 'shipped' | 'completed' | 'rejected'

export interface IOrderItem {
  productId: string
  productName: string
  productType: 'pesticide' | 'seed' | 'fertilizer'
  quantity: number
  unitPrice: number
  totalAmount: number
  isRestricted: boolean
  restrictedReason?: string
}

export interface ICreditOrder extends Document {
  orderId: string
  farmerId: string
  farmerName: string
  items: IOrderItem[]
  totalAmount: number
  status: OrderStatus
  creatorId: string
  creatorName: string
  approverId?: string
  approverName?: string
  approvalComment?: string
  shipperId?: string
  shipperName?: string
  completerId?: string
  completerName?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

const OrderItemSchema: Schema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productType: { type: String, enum: ['pesticide', 'seed', 'fertilizer'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  isRestricted: { type: Boolean, default: false },
  restrictedReason: { type: String }
})

const CreditOrderSchema: Schema = new Schema({
  orderId: { type: String, required: true, unique: true },
  farmerId: { type: String, required: true },
  farmerName: { type: String, required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'shipped', 'completed', 'rejected'], default: 'pending' },
  creatorId: { type: String, required: true },
  creatorName: { type: String, required: true },
  approverId: { type: String },
  approverName: { type: String },
  approvalComment: { type: String },
  shipperId: { type: String },
  shipperName: { type: String },
  completerId: { type: String },
  completerName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
})

CreditOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<ICreditOrder>('CreditOrder', CreditOrderSchema)
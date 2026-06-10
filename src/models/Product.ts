import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  productId: string
  name: string
  type: 'pesticide' | 'seed' | 'fertilizer'
  specification: string
  unit: string
  price: number
  stock: number
  minStock: number
  isRestricted: boolean
  restrictedReason?: string
  restrictedCrops?: string[]
  createdAt: Date
  updatedAt: Date
}

const ProductSchema: Schema = new Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['pesticide', 'seed', 'fertilizer'], required: true },
  specification: { type: String, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 10, min: 0 },
  isRestricted: { type: Boolean, default: false },
  restrictedReason: { type: String },
  restrictedCrops: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

ProductSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<IProduct>('Product', ProductSchema)
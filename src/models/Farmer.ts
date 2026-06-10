import mongoose, { Schema, Document } from 'mongoose'

export interface IFarmer extends Document {
  farmerId: string
  name: string
  phone: string
  idCard: string
  address: string
  landArea: number
  crops: string[]
  creditLimit: number
  currentDebt: number
  creditLevel: 'A' | 'B' | 'C' | 'D'
  createdAt: Date
  updatedAt: Date
}

const FarmerSchema: Schema = new Schema({
  farmerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  idCard: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  landArea: { type: Number, required: true, min: 0 },
  crops: [{ type: String }],
  creditLimit: { type: Number, default: 0 },
  currentDebt: { type: Number, default: 0 },
  creditLevel: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'C' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

FarmerSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<IFarmer>('Farmer', FarmerSchema)
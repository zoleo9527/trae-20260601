import mongoose, { Schema, Document } from 'mongoose'

export interface IIdempotent extends Document {
  requestId: string
  status: 'processing' | 'completed' | 'failed'
  response?: string
  createdAt: Date
  expiresAt: Date
}

const IdempotentSchema: Schema = new Schema({
  requestId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['processing', 'completed', 'failed'], required: true },
  response: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
})

IdempotentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model<IIdempotent>('Idempotent', IdempotentSchema)
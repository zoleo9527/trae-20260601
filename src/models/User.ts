import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'owner' | 'technician' | 'warehouse'

export interface IUser extends Document {
  userId: string
  name: string
  phone: string
  role: UserRole
  password: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ['owner', 'technician', 'warehouse'], required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<IUser>('User', UserSchema)
import User, { IUser, UserRole } from '../models/User'

export class UserRepository {
  async create(user: Partial<IUser>): Promise<IUser> {
    const newUser = new User(user)
    return await newUser.save()
  }

  async findById(userId: string): Promise<IUser | null> {
    return await User.findOne({ userId })
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return await User.findOne({ phone })
  }

  async findByRole(role: UserRole): Promise<IUser[]> {
    return await User.find({ role }).sort({ createdAt: -1 })
  }

  async findAll(): Promise<IUser[]> {
    return await User.find().sort({ createdAt: -1 })
  }

  async update(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findOneAndUpdate({ userId }, updateData, { new: true })
  }

  async delete(userId: string): Promise<IUser | null> {
    return await User.findOneAndDelete({ userId })
  }
}
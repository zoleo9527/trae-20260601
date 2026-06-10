import Farmer, { IFarmer } from '../models/Farmer'

export class FarmerRepository {
  async create(farmer: Partial<IFarmer>): Promise<IFarmer> {
    const newFarmer = new Farmer(farmer)
    return await newFarmer.save()
  }

  async findById(farmerId: string): Promise<IFarmer | null> {
    return await Farmer.findOne({ farmerId })
  }

  async findByPhone(phone: string): Promise<IFarmer | null> {
    return await Farmer.findOne({ phone })
  }

  async findAll(): Promise<IFarmer[]> {
    return await Farmer.find().sort({ createdAt: -1 })
  }

  async findByCreditLevel(level: string): Promise<IFarmer[]> {
    return await Farmer.find({ creditLevel: level }).sort({ createdAt: -1 })
  }

  async findWithDebt(): Promise<IFarmer[]> {
    return await Farmer.find({ currentDebt: { $gt: 0 } }).sort({ currentDebt: -1 })
  }

  async update(farmerId: string, updateData: Partial<IFarmer>): Promise<IFarmer | null> {
    return await Farmer.findOneAndUpdate({ farmerId }, updateData, { new: true })
  }

  async updateDebt(farmerId: string, amount: number): Promise<IFarmer | null> {
    return await Farmer.findOneAndUpdate(
      { farmerId },
      { $inc: { currentDebt: amount } },
      { new: true }
    )
  }

  async delete(farmerId: string): Promise<IFarmer | null> {
    return await Farmer.findOneAndDelete({ farmerId })
  }
}
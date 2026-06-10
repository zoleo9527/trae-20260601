import Product, { IProduct } from '../models/Product'

export class ProductRepository {
  async create(product: Partial<IProduct>): Promise<IProduct> {
    const newProduct = new Product(product)
    return await newProduct.save()
  }

  async findById(productId: string): Promise<IProduct | null> {
    return await Product.findOne({ productId })
  }

  async findByName(name: string): Promise<IProduct | null> {
    return await Product.findOne({ name })
  }

  async findByType(type: 'pesticide' | 'seed' | 'fertilizer'): Promise<IProduct[]> {
    return await Product.find({ type }).sort({ createdAt: -1 })
  }

  async findAll(): Promise<IProduct[]> {
    return await Product.find().sort({ createdAt: -1 })
  }

  async findRestricted(): Promise<IProduct[]> {
    return await Product.find({ isRestricted: true }).sort({ createdAt: -1 })
  }

  async findLowStock(): Promise<IProduct[]> {
    return await Product.find({ stock: { $lte: '$minStock' } }).sort({ stock: 1 })
  }

  async update(productId: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    return await Product.findOneAndUpdate({ productId }, updateData, { new: true })
  }

  async updateStock(productId: string, quantity: number): Promise<IProduct | null> {
    return await Product.findOneAndUpdate(
      { productId },
      { $inc: { stock: quantity } },
      { new: true }
    )
  }

  async delete(productId: string): Promise<IProduct | null> {
    return await Product.findOneAndDelete({ productId })
  }
}
import { ProductRepository } from '../repositories/ProductRepository'
import { IProduct } from '../models/Product'
import { v4 as uuidv4 } from 'uuid'

export interface CreateProductRequest {
  name: string
  type: 'pesticide' | 'seed' | 'fertilizer'
  specification: string
  unit: string
  price: number
  stock?: number
  minStock?: number
  isRestricted?: boolean
  restrictedReason?: string
  restrictedCrops?: string[]
}

export interface UpdateProductRequest {
  name?: string
  specification?: string
  unit?: string
  price?: number
  minStock?: number
  isRestricted?: boolean
  restrictedReason?: string
  restrictedCrops?: string[]
}

export interface ProductStockAlert {
  productId: string
  name: string
  stock: number
  minStock: number
  alertLevel: 'low' | 'critical'
}

export class ProductService {
  private productRepository: ProductRepository

  constructor() {
    this.productRepository = new ProductRepository()
  }

  async createProduct(request: CreateProductRequest): Promise<IProduct> {
    const existing = await this.productRepository.findByName(request.name)
    if (existing) {
      throw new Error(`商品已存在: ${request.name}`)
    }

    const product: Partial<IProduct> = {
      productId: `PROD-${uuidv4().slice(0, 8).toUpperCase()}`,
      name: request.name,
      type: request.type,
      specification: request.specification,
      unit: request.unit,
      price: request.price,
      stock: request.stock || 0,
      minStock: request.minStock || 10,
      isRestricted: request.isRestricted || false,
      restrictedReason: request.restrictedReason,
      restrictedCrops: request.restrictedCrops
    }

    return await this.productRepository.create(product)
  }

  async getProductById(productId: string): Promise<IProduct> {
    const product = await this.productRepository.findById(productId)
    if (!product) {
      throw new Error(`商品不存在: ${productId}`)
    }
    return product
  }

  async getAllProducts(): Promise<IProduct[]> {
    return await this.productRepository.findAll()
  }

  async getProductsByType(type: 'pesticide' | 'seed' | 'fertilizer'): Promise<IProduct[]> {
    return await this.productRepository.findByType(type)
  }

  async getSeeds(): Promise<IProduct[]> {
    return await this.productRepository.findByType('seed')
  }

  async getPesticides(): Promise<IProduct[]> {
    return await this.productRepository.findByType('pesticide')
  }

  async getRestrictedProducts(): Promise<IProduct[]> {
    return await this.productRepository.findRestricted()
  }

  async getLowStockAlerts(): Promise<ProductStockAlert[]> {
    const products = await this.productRepository.findAll()
    const alerts: ProductStockAlert[] = []

    for (const product of products) {
      if (product.stock <= product.minStock) {
        alerts.push({
          productId: product.productId,
          name: product.name,
          stock: product.stock,
          minStock: product.minStock,
          alertLevel: product.stock <= product.minStock * 0.5 ? 'critical' : 'low'
        })
      }
    }

    return alerts.sort((a, b) => {
      const levelOrder = { critical: 0, low: 1 }
      return levelOrder[a.alertLevel] - levelOrder[b.alertLevel]
    })
  }

  async updateProduct(productId: string, request: UpdateProductRequest): Promise<IProduct> {
    await this.getProductById(productId)

    const updateData: Partial<IProduct> = { ...request }
    const updated = await this.productRepository.update(productId, updateData)
    
    if (!updated) {
      throw new Error(`更新商品失败: ${productId}`)
    }
    return updated
  }

  async updateStock(productId: string, quantity: number): Promise<IProduct> {
    const product = await this.getProductById(productId)
    const newStock = product.stock + quantity
    
    if (newStock < 0) {
      throw new Error(`库存不足: 当前库存 ${product.stock}，操作数量 ${quantity}`)
    }

    const updated = await this.productRepository.updateStock(productId, quantity)
    if (!updated) {
      throw new Error(`更新库存失败: ${productId}`)
    }
    return updated
  }

  async deleteProduct(productId: string): Promise<void> {
    const product = await this.getProductById(productId)
    if (product.stock > 0) {
      throw new Error(`商品存在库存，无法删除: ${product.name}, 库存 ${product.stock}`)
    }
    await this.productRepository.delete(productId)
  }

  async getSeasonalStockSuggestion(cropType: string): Promise<IProduct[]> {
    const pesticides = await this.getPesticides()
    const fertilizers = await this.productRepository.findByType('fertilizer')
    const seeds = await this.getSeeds()

    const seasonalProducts: IProduct[] = []
    const cropProductMap: Record<string, string[]> = {
      '水稻': ['稻瘟灵', '水稻专用肥', '杂交水稻种子'],
      '小麦': ['吡虫啉', '小麦专用肥', '小麦种子'],
      '玉米': ['玉米螟杀虫剂', '玉米专用肥', '玉米种子'],
      '蔬菜': ['高效氯氰菊酯', '蔬菜专用肥', '蔬菜种子'],
      '果树': ['甲基硫菌灵', '果树专用肥', '果树苗木']
    }

    const suggestedNames = cropProductMap[cropType] || []
    
    for (const name of suggestedNames) {
      const found = [...pesticides, ...fertilizers, ...seeds].find(p => 
        p.name.includes(name) || name.includes(p.name)
      )
      if (found) {
        seasonalProducts.push(found)
      }
    }

    return seasonalProducts
  }
}
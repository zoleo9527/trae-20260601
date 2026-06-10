import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product, { IProduct } from '../models/Product'
import Farmer, { IFarmer } from '../models/Farmer'
import User, { IUser } from '../models/User'

dotenv.config()

const seedProducts: Partial<IProduct>[] = [
  {
    productId: 'PROD-SEED001',
    name: '杂交水稻种子',
    type: 'seed',
    specification: '500g/袋',
    unit: '袋',
    price: 60,
    stock: 100,
    minStock: 20
  },
  {
    productId: 'PROD-SEED002',
    name: '小麦种子',
    type: 'seed',
    specification: '1kg/袋',
    unit: '袋',
    price: 35,
    stock: 80,
    minStock: 15
  },
  {
    productId: 'PROD-SEED003',
    name: '玉米种子',
    type: 'seed',
    specification: '500g/袋',
    unit: '袋',
    price: 45,
    stock: 60,
    minStock: 15
  },
  {
    productId: 'PROD-SEED004',
    name: '蔬菜种子',
    type: 'seed',
    specification: '10g/袋',
    unit: '袋',
    price: 15,
    stock: 200,
    minStock: 50
  },
  {
    productId: 'PROD-PEST001',
    name: '稻瘟灵',
    type: 'pesticide',
    specification: '500ml/瓶',
    unit: '瓶',
    price: 45,
    stock: 50,
    minStock: 10
  },
  {
    productId: 'PROD-PEST002',
    name: '吡虫啉',
    type: 'pesticide',
    specification: '100g/袋',
    unit: '袋',
    price: 25,
    stock: 100,
    minStock: 20
  },
  {
    productId: 'PROD-PEST003',
    name: '高效氯氰菊酯',
    type: 'pesticide',
    specification: '200ml/瓶',
    unit: '瓶',
    price: 35,
    stock: 80,
    minStock: 15,
    isRestricted: true,
    restrictedReason: '高毒农药，需严格控制使用',
    restrictedCrops: ['蔬菜', '水果']
  },
  {
    productId: 'PROD-PEST004',
    name: '玉米螟杀虫剂',
    type: 'pesticide',
    specification: '300ml/瓶',
    unit: '瓶',
    price: 55,
    stock: 40,
    minStock: 10
  },
  {
    productId: 'PROD-PEST005',
    name: '甲基硫菌灵',
    type: 'pesticide',
    specification: '500g/袋',
    unit: '袋',
    price: 30,
    stock: 60,
    minStock: 15
  },
  {
    productId: 'PROD-FERT001',
    name: '水稻专用肥',
    type: 'fertilizer',
    specification: '25kg/袋',
    unit: '袋',
    price: 85,
    stock: 120,
    minStock: 30
  },
  {
    productId: 'PROD-FERT002',
    name: '小麦专用肥',
    type: 'fertilizer',
    specification: '25kg/袋',
    unit: '袋',
    price: 80,
    stock: 100,
    minStock: 25
  },
  {
    productId: 'PROD-FERT003',
    name: '玉米专用肥',
    type: 'fertilizer',
    specification: '25kg/袋',
    unit: '袋',
    price: 82,
    stock: 90,
    minStock: 25
  },
  {
    productId: 'PROD-FERT004',
    name: '蔬菜专用肥',
    type: 'fertilizer',
    specification: '10kg/袋',
    unit: '袋',
    price: 45,
    stock: 150,
    minStock: 40
  },
  {
    productId: 'PROD-FERT005',
    name: '果树专用肥',
    type: 'fertilizer',
    specification: '50kg/袋',
    unit: '袋',
    price: 150,
    stock: 50,
    minStock: 10
  }
]

const seedFarmers: Partial<IFarmer>[] = [
  {
    farmerId: 'FARMER-001',
    name: '张三',
    phone: '13800138001',
    idCard: '110101199001011234',
    address: '江苏省南京市江宁区',
    landArea: 50,
    crops: ['水稻', '小麦'],
    creditLevel: 'A',
    creditLimit: 60000,
    currentDebt: 0
  },
  {
    farmerId: 'FARMER-002',
    name: '李四',
    phone: '13800138002',
    idCard: '110101198502022345',
    address: '江苏省南京市浦口区',
    landArea: 35,
    crops: ['玉米', '蔬菜'],
    creditLevel: 'B',
    creditLimit: 37000,
    currentDebt: 5000
  },
  {
    farmerId: 'FARMER-003',
    name: '王五',
    phone: '13800138003',
    idCard: '110101198803033456',
    address: '江苏省南京市六合区',
    landArea: 15,
    crops: ['蔬菜'],
    creditLevel: 'C',
    creditLimit: 18000,
    currentDebt: 3000
  },
  {
    farmerId: 'FARMER-004',
    name: '赵六',
    phone: '13800138004',
    idCard: '110101199204044567',
    address: '江苏省南京市栖霞区',
    landArea: 8,
    crops: ['果树'],
    creditLevel: 'D',
    creditLimit: 6600,
    currentDebt: 0
  },
  {
    farmerId: 'FARMER-005',
    name: '孙七',
    phone: '13800138005',
    idCard: '110101198705055678',
    address: '江苏省南京市雨花台区',
    landArea: 60,
    crops: ['水稻', '小麦', '玉米'],
    creditLevel: 'A',
    creditLimit: 62000,
    currentDebt: 12000
  }
]

const seedUsers: Partial<IUser>[] = [
  {
    userId: 'USER-OWNER01',
    name: '王老板',
    phone: '13900139001',
    role: 'owner',
    password: '123456'
  },
  {
    userId: 'USER-TECH01',
    name: '李农技',
    phone: '13900139002',
    role: 'technician',
    password: '123456'
  },
  {
    userId: 'USER-WARE01',
    name: '张仓管',
    phone: '13900139003',
    role: 'warehouse',
    password: '123456'
  }
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agri_store')
    console.log('Connected to MongoDB')

    await Product.deleteMany({})
    await Farmer.deleteMany({})
    await User.deleteMany({})

    await Product.insertMany(seedProducts)
    console.log('Seeded products')

    await Farmer.insertMany(seedFarmers)
    console.log('Seeded farmers')

    await User.insertMany(seedUsers)
    console.log('Seeded users')

    console.log('Seed data completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Failed to seed data:', error)
    process.exit(1)
  }
}

seed()
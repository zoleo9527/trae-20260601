import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { FarmerService } from '../services/FarmerService'
import { CreditOrderService } from '../services/CreditOrderService'
import { ProductService } from '../services/ProductService'
import { RepaymentService } from '../services/RepaymentService'
import { IdempotentService } from '../services/IdempotentService'

dotenv.config()

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agri_store')
    console.log('Connected to MongoDB')

    const farmerService = new FarmerService()
    const orderService = new CreditOrderService()
    const productService = new ProductService()
    const repaymentService = new RepaymentService()
    const idempotentService = new IdempotentService()

    console.log('\n=== 1. 农户档案处理测试 ===')
    
    try {
      const newFarmer = await farmerService.createFarmer({
        name: '测试农户',
        phone: '13999999999',
        idCard: '320101199506067890',
        address: '江苏省南京市测试区',
        landArea: 25,
        crops: ['水稻', '蔬菜']
      })
      console.log('创建农户成功:', newFarmer.farmerId, newFarmer.name)

      const creditInfo = await farmerService.getCreditInfo(newFarmer.farmerId)
      console.log('授信信息:', JSON.stringify(creditInfo, null, 2))

      const updatedFarmer = await farmerService.updateFarmer(newFarmer.farmerId, {
        address: '江苏省南京市更新区'
      })
      console.log('更新农户成功:', updatedFarmer.address)
    } catch (error: any) {
      console.log('农户档案测试异常:', error.message)
    }

    console.log('\n=== 2. 种子数据测试 ===')
    
    try {
      const seeds = await productService.getSeeds()
      console.log('种子列表数量:', seeds.length)
      console.log('种子详情:', seeds.map(s => `${s.name} - ${s.price}元/${s.unit}`))

      const seasonal = await productService.getSeasonalStockSuggestion('水稻')
      console.log('水稻季节备货建议:', seasonal.map(s => s.name))
    } catch (error: any) {
      console.log('种子数据测试异常:', error.message)
    }

    console.log('\n=== 3. 幂等提交测试 ===')
    
    try {
      const requestId = 'test-request-001'
      
      const firstResult = await idempotentService.checkAndLock(requestId)
      console.log('首次请求:', firstResult.isNew ? '新请求' : '重复请求')

      await idempotentService.complete(requestId, JSON.stringify({ success: true, data: 'test' }))

      const secondResult = await idempotentService.checkAndLock(requestId)
      console.log('重复请求:', secondResult.isNew ? '新请求' : '重复请求', '- 返回缓存:', secondResult.response)
    } catch (error: any) {
      console.log('幂等测试异常:', error.message)
    }

    console.log('\n=== 4. 赊销授信回看测试 ===')
    
    try {
      const pendingDebts = await repaymentService.getAllPendingDebts()
      console.log('待收欠款农户数量:', pendingDebts.length)
      console.log('待收欠款详情:', pendingDebts.map(d => `${d.name}: ${d.currentDebt}元`))

      if (pendingDebts.length > 0) {
        const summary = await repaymentService.getFarmerDebtSummary(pendingDebts[0].farmerId)
        console.log('单个农户欠款摘要:', JSON.stringify(summary, null, 2))
      }
    } catch (error: any) {
      console.log('赊销授信回看测试异常:', error.message)
    }

    console.log('\n=== 5. 异常样例测试 - 禁限用药提醒 ===')
    
    try {
      const farmer = await farmerService.getFarmerById('FARMER-003')
      console.log('测试农户:', farmer.name, '种植:', farmer.crops.join(','))

      const restrictedProduct = await productService.getProductById('PROD-PEST003')
      console.log('禁限用药:', restrictedProduct.name, '- 限制作物:', restrictedProduct.restrictedCrops)

      const orderResult = await orderService.createOrder({
        farmerId: 'FARMER-003',
        items: [{ productId: 'PROD-PEST003', quantity: 2 }],
        operatorId: 'USER-TECH01',
        operatorName: '李农技'
      })
      console.log('禁限用药订单创建结果:', orderResult.success)
      console.log('错误信息:', orderResult.errors)
      console.log('警告信息:', orderResult.warnings)
    } catch (error: any) {
      console.log('禁限用药测试异常:', error.message)
    }

    console.log('\n=== 6. 异常样例测试 - 超出授信额度 ===')
    
    try {
      const orderResult = await orderService.createOrder({
        farmerId: 'FARMER-004',
        items: [
          { productId: 'PROD-FERT005', quantity: 10 }
        ],
        operatorId: 'USER-TECH01',
        operatorName: '李农技'
      })
      console.log('超授信订单创建结果:', orderResult.success)
      console.log('错误信息:', orderResult.errors)
    } catch (error: any) {
      console.log('超授信测试异常:', error.message)
    }

    console.log('\n=== 7. 异常样例测试 - 库存不足 ===')
    
    try {
      const orderResult = await orderService.createOrder({
        farmerId: 'FARMER-001',
        items: [
          { productId: 'PROD-SEED001', quantity: 1000 }
        ],
        operatorId: 'USER-TECH01',
        operatorName: '李农技'
      })
      console.log('库存不足订单创建结果:', orderResult.success)
      console.log('错误信息:', orderResult.errors)
    } catch (error: any) {
      console.log('库存不足测试异常:', error.message)
    }

    console.log('\n=== 8. 门店老板、农技员、仓管接力流程测试 ===')
    
    try {
      const farmerId = 'FARMER-001'
      const farmer = await farmerService.getFarmerById(farmerId)
      console.log('接力流程测试 - 农户:', farmer.name)

      const orderResult = await orderService.createOrder({
        farmerId,
        items: [
          { productId: 'PROD-SEED001', quantity: 5 },
          { productId: 'PROD-FERT001', quantity: 2 }
        ],
        operatorId: 'USER-TECH01',
        operatorName: '李农技'
      })

      if (!orderResult.success || !orderResult.order) {
        console.log('订单创建失败:', orderResult.errors)
        return
      }

      const order = orderResult.order
      console.log('农技员创建订单:', order.orderId, '- 金额:', order.totalAmount)

      const approveResult = await orderService.approveOrder({
        orderId: order.orderId,
        operatorId: 'USER-OWNER01',
        operatorName: '王老板',
        approve: true,
        comment: '同意授信'
      })
      console.log('老板审批结果:', approveResult.success ? '通过' : '拒绝')

      if (approveResult.order) {
        const shipResult = await orderService.shipOrder({
          orderId: order.orderId,
          operatorId: 'USER-WARE01',
          operatorName: '张仓管'
        })
        console.log('仓管发货结果:', shipResult.success ? '成功' : '失败')

        if (shipResult.order) {
          const completeResult = await orderService.completeOrder({
            orderId: order.orderId,
            operatorId: 'USER-WARE01',
            operatorName: '张仓管'
          })
          console.log('订单完成结果:', completeResult.success ? '成功' : '失败')
        }
      }

      const finalFarmer = await farmerService.getFarmerById(farmerId)
      console.log('农户最终欠款:', finalFarmer.currentDebt)
    } catch (error: any) {
      console.log('接力流程测试异常:', error.message)
    }

    console.log('\n=== 测试完成 ===')
    process.exit(0)
  } catch (error) {
    console.error('测试失败:', error)
    process.exit(1)
  }
}

runTests()
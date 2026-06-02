import { PrismaClient } from '@prisma/client';
import {
  calculateBadProductCompensation,
  calculateOutOfStockRefund,
  calculateWeightAdjustment,
} from '../src/utils/amountCalculator.js';

const prisma = new PrismaClient();

type LeaderStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
type OrderStatus = 'PENDING' | 'FULFILLED' | 'COMPLETED' | 'CANCELLED';
type BatchStatus = 'CREATED' | 'DELIVERED' | 'SETTLED';
type AfterSaleType = 'OUT_OF_STOCK' | 'BAD_PRODUCT' | 'WEIGHT_DIFF' | 'OTHER';
type AfterSaleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
type AdjustmentType = 'WEIGHT_REFUND' | 'WEIGHT_SUPPLEMENT' | 'OUT_OF_STOCK_REFUND' | 'BAD_PRODUCT_COMP' | 'COMMISSION_ADJUST' | 'OTHER';
type AdjustmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
type SettlementStatus = 'DRAFT' | 'REVIEWING' | 'LOCKED' | 'PAID' | 'DISPUTED';

async function main() {
  console.log('🌱 开始生成种子数据...');
  console.log('');

  // 1. 创建商品
  console.log('📦 创建商品...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: '山东烟台红富士苹果',
        sku: 'APPLE-001',
        price: 599, // 5.99元/斤
        costPrice: 350,
        unit: '斤',
        isWeighted: true, // 称重商品
      },
    }),
    prisma.product.create({
      data: {
        name: '海南新鲜香蕉',
        sku: 'BANANA-001',
        price: 399, // 3.99元/斤
        costPrice: 200,
        unit: '斤',
        isWeighted: true, // 称重商品
      },
    }),
    prisma.product.create({
      data: {
        name: '进口车厘子 2斤装',
        sku: 'CHERRY-001',
        price: 8900, // 89元/份
        costPrice: 5500,
        unit: '份',
        isWeighted: false,
      },
    }),
    prisma.product.create({
      data: {
        name: '有机鸡蛋 30枚',
        sku: 'EGG-001',
        price: 3500, // 35元/盒
        costPrice: 2200,
        unit: '盒',
        isWeighted: false,
      },
    }),
  ]);
  console.log(`   ✅ 创建了 ${products.length} 个商品`);

  // 2. 创建团点和团长
  console.log('📍 创建团点和团长...');
  const groupPoint = await prisma.groupPoint.create({
    data: {
      name: '阳光花园小区团点',
      address: '北京市朝阳区阳光花园A区1号楼便利店',
      leader: {
        create: {
          name: '张桂兰',
          phone: '13800138001',
          idCard: '110101198001011234',
          commissionRate: 1000, // 10% 佣金
          status: 'ACTIVE',
        },
      },
    },
    include: { leader: true },
  });
  console.log(`   ✅ 创建团点: ${groupPoint.name}, 团长: ${groupPoint.leader.name} (佣金率: ${groupPoint.leader.commissionRate / 100}%)`);

  // 3. 创建订单
  console.log('📝 创建订单...');

  // 订单1: 含称重商品 - 后续用于称重少退场景
  const order1 = await prisma.order.create({
    data: {
      orderNo: 'ORD202606010001',
      groupPointId: groupPoint.id,
      customerName: '李女士',
      customerPhone: '13900139001',
      totalAmount: 0,
      status: 'PENDING',
      items: {
        create: [
          {
            productId: products[0].id, // 苹果
            quantity: 5, // 下单5斤
            unitPrice: 599,
            subtotal: 5 * 599, // 2995分 = 29.95元
          },
          {
            productId: products[1].id, // 香蕉
            quantity: 3, // 下单3斤
            unitPrice: 399,
            subtotal: 3 * 399, // 1197分 = 11.97元
          },
        ],
      },
    },
    include: { items: true },
  });
  const order1Total = order1.items.reduce((s, i) => s + i.subtotal, 0);
  await prisma.order.update({
    where: { id: order1.id },
    data: { totalAmount: order1Total },
  });
  console.log(`   ✅ 订单1: ${order1.orderNo} - 苹果5斤+香蕉3斤，预估${order1Total / 100}元`);

  // 订单2: 含车厘子 - 后续用于缺货退款场景
  const order2 = await prisma.order.create({
    data: {
      orderNo: 'ORD202606010002',
      groupPointId: groupPoint.id,
      customerName: '王先生',
      customerPhone: '13900139002',
      totalAmount: 0,
      status: 'PENDING',
      items: {
        create: [
          {
            productId: products[2].id, // 车厘子
            quantity: 1,
            unitPrice: 8900,
            subtotal: 8900, // 89元
          },
          {
            productId: products[3].id, // 鸡蛋
            quantity: 2,
            unitPrice: 3500,
            subtotal: 2 * 3500, // 70元
          },
        ],
      },
    },
    include: { items: true },
  });
  const order2Total = order2.items.reduce((s, i) => s + i.subtotal, 0);
  await prisma.order.update({
    where: { id: order2.id },
    data: { totalAmount: order2Total },
  });
  console.log(`   ✅ 订单2: ${order2.orderNo} - 车厘子1份+鸡蛋2盒，预估${order2Total / 100}元`);

  // 订单3: 含苹果 - 后续用于坏果赔付场景
  const order3 = await prisma.order.create({
    data: {
      orderNo: 'ORD202606010003',
      groupPointId: groupPoint.id,
      customerName: '赵阿姨',
      customerPhone: '13900139003',
      totalAmount: 0,
      status: 'PENDING',
      items: {
        create: [
          {
            productId: products[0].id, // 苹果
            quantity: 10, // 下单10斤
            unitPrice: 599,
            subtotal: 10 * 599, // 5990分 = 59.90元
          },
        ],
      },
    },
    include: { items: true },
  });
  const order3Total = order3.items.reduce((s, i) => s + i.subtotal, 0);
  await prisma.order.update({
    where: { id: order3.id },
    data: { totalAmount: order3Total },
  });
  console.log(`   ✅ 订单3: ${order3.orderNo} - 苹果10斤，预估${order3Total / 100}元`);

  // 4. 履约订单 - 模拟实际称重
  console.log('🚚 履约订单（模拟实际称重）...');

  // 订单1履约：苹果实际4.8斤（少0.2斤），香蕉实际3.05斤（多0.05斤）
  const appleItem1 = order1.items[0]; // 苹果，预估5斤 = 2995分
  const bananaItem1 = order1.items[1]; // 香蕉，预估3斤 = 1197分

  const appleActualQty = 4.8;
  const appleActualSubtotal = Math.round(appleActualQty * 599); // 4.8 * 5.99 = 2875.2 ≈ 2875分
  const bananaActualQty = 3.05;
  const bananaActualSubtotal = Math.round(bananaActualQty * 399); // 3.05 * 3.99 = 1216.95 ≈ 1217分

  const appleWeightResult = calculateWeightAdjustment(appleItem1.subtotal, appleActualSubtotal);
  const bananaWeightResult = calculateWeightAdjustment(bananaItem1.subtotal, bananaActualSubtotal);

  await prisma.orderItem.update({
    where: { id: appleItem1.id },
    data: {
      actualQuantity: appleActualQty,
      actualSubtotal: appleActualSubtotal,
      weightDiff: appleWeightResult.shouldAdjust ? appleWeightResult.diff : 0,
    },
  });
  await prisma.orderItem.update({
    where: { id: bananaItem1.id },
    data: {
      actualQuantity: bananaActualQty,
      actualSubtotal: bananaActualSubtotal,
      weightDiff: bananaWeightResult.shouldAdjust ? bananaWeightResult.diff : 0,
    },
  });
  const order1Actual = appleActualSubtotal + bananaActualSubtotal;
  await prisma.order.update({
    where: { id: order1.id },
    data: { actualAmount: order1Actual, status: 'FULFILLED' },
  });
  console.log(`   ✅ 订单1履约: 苹果实际${appleActualQty}斤，差异${appleWeightResult.diff > 0 ? '+' : ''}${appleWeightResult.diff}分，${appleWeightResult.shouldAdjust ? '需补差' : '在误差范围内'}`);
  console.log(`           香蕉实际${bananaActualQty}斤，差异${bananaWeightResult.diff > 0 ? '+' : ''}${bananaWeightResult.diff}分，${bananaWeightResult.shouldAdjust ? '需补差' : '在误差范围内'}`);

  // 订单2履约：车厘子缺货，鸡蛋正常
  const cherryItem2 = order2.items[0]; // 车厘子
  const eggItem2 = order2.items[1]; // 鸡蛋

  await prisma.orderItem.update({
    where: { id: eggItem2.id },
    data: {
      actualQuantity: 2,
      actualSubtotal: 2 * 3500,
      weightDiff: 0,
    },
  });
  // 车厘子标记为0（缺货）
  await prisma.orderItem.update({
    where: { id: cherryItem2.id },
    data: {
      actualQuantity: 0,
      actualSubtotal: 0,
      weightDiff: -cherryItem2.subtotal,
    },
  });
  const order2Actual = 2 * 3500;
  await prisma.order.update({
    where: { id: order2.id },
    data: { actualAmount: order2Actual, status: 'FULFILLED' },
  });
  console.log(`   ✅ 订单2履约: 车厘子缺货，鸡蛋正常履约，实际${order2Actual / 100}元`);

  // 订单3履约：苹果10斤全部正常
  const appleItem3 = order3.items[0];
  await prisma.orderItem.update({
    where: { id: appleItem3.id },
    data: {
      actualQuantity: 10,
      actualSubtotal: 10 * 599,
      weightDiff: 0,
    },
  });
  await prisma.order.update({
    where: { id: order3.id },
    data: { actualAmount: 10 * 599, status: 'FULFILLED' },
  });
  console.log(`   ✅ 订单3履约: 苹果10斤正常`);

  // 5. 创建售后单
  console.log('🔧 创建售后单...');

  // 售后1: 订单2 - 车厘子缺货退款
  const outOfStockRefund = calculateOutOfStockRefund(cherryItem2.unitPrice, 1);
  const outOfStockDetail = `缺货商品单价${cherryItem2.unitPrice}分 × 数量1 = 退款${outOfStockRefund}分`;
  const afterSale1 = await prisma.afterSaleOrder.create({
    data: {
      afterSaleNo: 'AS202606010001',
      orderId: order2.id,
      type: 'OUT_OF_STOCK',
      reason: '车厘子库存不足，无法发货',
      amount: outOfStockRefund,
      status: 'APPROVED',
      handledBy: '客服-小李',
      handledAt: new Date(),
      // 计算依据字段
      productId: cherryItem2.productId,
      quantity: 1,
      unitPrice: cherryItem2.unitPrice,
      calculationDetail: outOfStockDetail,
    },
  });
  console.log(`   ✅ 售后1: ${afterSale1.afterSaleNo} - 缺货退款 ${outOfStockRefund / 100}元`);
  console.log(`           计算依据: ${outOfStockDetail}`);

  // 售后2: 订单3 - 坏果赔付（10斤中有4斤坏果，坏果率40% > 5%，按120%赔付）
  const badCompResult = calculateBadProductCompensation(order3Total, 10, 4);
  const badProductAmount = Math.floor((order3Total * 4) / 10);
  const badCompDetail = `订单总额${order3Total}分 × 坏果占比4/10 = 坏果金额${badProductAmount}分 × 120% = 赔付${badCompResult.compensation}分（坏果率${badCompResult.badRate}%）`;
  const afterSale2 = await prisma.afterSaleOrder.create({
    data: {
      afterSaleNo: 'AS202606010002',
      orderId: order3.id,
      type: 'BAD_PRODUCT',
      reason: `客户收到苹果有4斤坏果，拍照举证`,
      amount: badCompResult.compensation,
      status: 'APPROVED',
      handledBy: '客服-小王',
      handledAt: new Date(),
      // 计算依据字段
      badQuantity: 4,
      totalQuantity: 10,
      badRate: badCompResult.badRate,
      calculationDetail: badCompDetail,
    },
  });
  console.log(`   ✅ 售后2: ${afterSale2.afterSaleNo} - 坏果率${badCompResult.badRate}%，赔付 ${badCompResult.compensation / 100}元`);

  // 6. 创建补差记录
  console.log('💵 创建补差记录...');

  // 补差1: 订单1称重少退（苹果少0.2斤）
  const adjustment1 = await prisma.adjustmentRecord.create({
    data: {
      adjustmentNo: 'ADJ202606010001',
      orderId: order1.id,
      afterSaleId: null,
      type: 'WEIGHT_REFUND',
      amount: appleWeightResult.diff, // 少退，补给团长
      reason: `苹果称重差异，预估5斤实际4.8斤，差异${appleWeightResult.diffRate}‰`,
      status: 'CONFIRMED',
      operator: '运营-小张',
    },
  });
  console.log(`   ✅ 补差1: ${adjustment1.adjustmentNo} - 称重少退 ${appleWeightResult.diff / 100}元`);

  // 补差2: 团长质疑佣金 - 张桂兰认为上月佣金计算有误，申请补回50元
  const adjustment2 = await prisma.adjustmentRecord.create({
    data: {
      adjustmentNo: 'ADJ202606010002',
      orderId: order1.id, // 关联一个订单即可
      afterSaleId: null,
      type: 'COMMISSION_ADJUST',
      amount: 5000, // 补50元
      reason: '团长张桂兰质疑5月28日批次佣金计算，经核查确有误差，予以补回',
      status: 'CONFIRMED',
      operator: '财务-李姐',
    },
  });
  console.log(`   ✅ 补差2: ${adjustment2.adjustmentNo} - 佣金调整 +${adjustment2.amount / 100}元（团长质疑）`);

  // 关联售后单的补差记录
  await prisma.adjustmentRecord.create({
    data: {
      adjustmentNo: 'ADJ202606010003',
      orderId: order2.id,
      afterSaleId: afterSale1.id,
      type: 'OUT_OF_STOCK_REFUND',
      amount: -afterSale1.amount, // 从团长处扣除
      reason: afterSale1.reason,
      status: 'CONFIRMED',
      operator: '系统',
    },
  });
  await prisma.adjustmentRecord.create({
    data: {
      adjustmentNo: 'ADJ202606010004',
      orderId: order3.id,
      afterSaleId: afterSale2.id,
      type: 'BAD_PRODUCT_COMP',
      amount: -afterSale2.amount, // 从团长处扣除
      reason: afterSale2.reason,
      status: 'CONFIRMED',
      operator: '系统',
    },
  });
  console.log(`   ✅ 已自动创建售后关联补差记录2条`);

  // 7. 创建履约批次
  console.log('📦 创建履约批次...');
  const batch = await prisma.fulfillmentBatch.create({
    data: {
      batchNo: 'BAT202606010001',
      groupPointId: groupPoint.id,
      deliveryDate: new Date('2026-06-01'),
      status: 'DELIVERED',
      totalOrderCount: 3,
      totalAmount: order1Total + order2Total + order3Total,
    },
  });

  await prisma.order.updateMany({
    where: { id: { in: [order1.id, order2.id, order3.id] } },
    data: { batchId: batch.id },
  });
  console.log(`   ✅ 批次 ${batch.batchNo} 包含3个订单，总额${(batch.totalAmount) / 100}元`);

  console.log('');
  console.log('🎉 种子数据生成完成！');
  console.log('');
  console.log('📊 数据概览:');
  console.log(`   商品: ${products.length} 个`);
  console.log(`   团点: 1 个（团长佣金率 10%）`);
  console.log(`   订单: 3 笔`);
  console.log(`   售后单: 2 笔（缺货退款、坏果赔付）`);
  console.log(`   补差记录: 4 条（称重少退、佣金调整、缺货、坏果）`);
  console.log(`   履约批次: 1 个`);
  console.log('');
  console.log('🔍 包含场景:');
  console.log('   ✅ 称重少退 - 苹果预估5斤实际4.8斤，补差120分');
  console.log('   ✅ 商品缺货 - 车厘子缺货，全额退款8900分');
  console.log('   ✅ 坏果补偿 - 10斤坏4斤，坏果率40%，赔付2875分(59.90×4/10×120%)');
  console.log('   ✅ 团长质疑佣金 - 补回5000分');
  console.log('');
  console.log('💡 现在可以运行 pnpm test 验证金额计算规则');
  console.log('💡 或者运行 pnpm dev 启动 API 服务');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

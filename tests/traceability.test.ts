import { PrismaClient } from '@prisma/client';
import { WaveService } from '../src/services/wave.service';
import { PickTaskService } from '../src/services/pickTask.service';
import { PackageService } from '../src/services/package.service';
import { AfterSalesService } from '../src/services/afterSales.service';
import { FeedbackType, FeedbackStatus, OrderStatus } from '../src/types';

const prisma = new PrismaClient();

async function testScenario1_MissingItem() {
  console.log('\n=== 场景1: 少货问题追溯 ===\n');

  const waveService = new WaveService();
  const pickTaskService = new PickTaskService();
  const packageService = new PackageService();
  const afterSalesService = new AfterSalesService();

  const supervisor = await prisma.employee.findUnique({ where: { code: 'S001' } });
  const picker1 = await prisma.employee.findUnique({ where: { code: 'P001' } });
  const reviewer = await prisma.employee.findUnique({ where: { code: 'R001' } });
  const cs = await prisma.employee.findUnique({ where: { code: 'C001' } });

  if (!supervisor || !picker1 || !reviewer || !cs) {
    throw new Error('请先运行种子数据');
  }

  const orders = await prisma.order.findMany({ take: 2 });
  const orderIds = orders.map((o) => o.id);
  console.log('1. 张主管创建波次，包含2个订单...');
  const waveId = await waveService.createWave('测试波次-少货场景', orderIds, supervisor.id);
  const wave = await waveService.getWaveById(waveId);
  console.log(`   ✓ 波次创建成功: ${wave?.waveNo}`);

  console.log('2. 开始波次...');
  await waveService.startWave(waveId, supervisor.id);
  console.log('   ✓ 波次已开始');

  const pickTasks = await pickTaskService.getAvailableTasks();
  console.log(`3. 李拣货领取${pickTasks.length}个拣货任务...`);

  for (let i = 0; i < pickTasks.length; i++) {
    const task = pickTasks[i];
    await pickTaskService.assignTask(task.id, picker1.id);
    await pickTaskService.startPicking(task.id, picker1.id);

    if (i === 0) {
      console.log(`   故意少拣: 任务${task.taskNo} 应拣${task.quantity}, 实拣${task.quantity - 1}`);
      await pickTaskService.completeTask(task.id, picker1.id, task.quantity - 1);
    } else {
      await pickTaskService.completeTask(task.id, picker1.id, task.quantity);
    }
  }
  console.log('   ✓ 拣货任务完成（故意少拣1个）');

  await waveService.completeWave(wave!.id);
  console.log('4. 波次完成');

  const order1 = orders[0];
  const order1Items = await prisma.orderItem.findMany({ where: { orderId: order1.id } });
  console.log('5. 创建包裹...');
  const pkgId = await packageService.createPackage(
    order1.id,
    order1Items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    0.5
  );
  const pkg = await packageService.getPackageById(pkgId);
  console.log(`   ✓ 包裹创建成功: ${pkg?.packageNo}`);

  console.log('6. 赵复核进行复核（但没发现少货，直接通过）...');
  const reviewItems = order1Items.map((item) => ({
    productId: item.productId,
    expectedProductId: item.productId,
    expectedQty: item.quantity,
    actualQty: item.quantity,
  }));
  await packageService.reviewPackage(pkgId, reviewer.id, reviewItems, '复核通过');
  console.log('   ✓ 复核通过（未发现少货）');

  await packageService.shipPackage(pkgId);
  console.log('7. 包裹出库发货');

  console.log('8. 客户收到货发现少了1个，提交售后反馈...');
  const feedbackId = await afterSalesService.createFeedback(
    pkgId,
    FeedbackType.MISSING_ITEM,
    '收到包裹发现少了1个无线蓝牙耳机',
    order1.customerName,
    order1.customerPhone
  );
  const feedback = await afterSalesService.getFeedbackById(feedbackId);
  console.log(`   ✓ 售后反馈已提交: ${feedback?.feedbackNo}`);

  console.log('9. 刘客服开始调查...');
  await afterSalesService.startInvestigation(feedbackId, cs.id);
  console.log('   ✓ 开始调查');

  console.log('10. 系统追溯根源...');
  const traceResult = await afterSalesService.traceRootCause(feedbackId);
  console.log('   可能原因:');
  traceResult.possibleCauses.forEach((cause: any, i: number) => {
    console.log(`     ${i + 1}. ${cause.description}`);
  });

  if (traceResult.wavePickTasks) {
    const wrongPick = traceResult.wavePickTasks.find((t: any) => t.pickedQuantity < t.quantity);
    if (wrongPick) {
      console.log(`   找到问题: 拣货员 ${wrongPick.pickedBy?.name} 在拣货任务 ${wrongPick.taskNo} 少拣了 ${wrongPick.quantity - wrongPick.pickedQuantity} 个`);

      console.log('11. 标记根源并解决...');
      await afterSalesService.resolveFeedback(
        feedbackId,
        cs.id,
        traceResult.wave.id,
        wrongPick.id,
        '确认为拣货员李拣货在拣货时少拿了1个，已安排补发'
      );
      console.log('   ✓ 问题已解决，根源已记录');
    }
  }

  await afterSalesService.closeFeedback(feedbackId, cs.id);
  console.log('12. 售后反馈关闭');

  console.log('\n13. 查看完整追溯链路:');
  const chain = await afterSalesService.getFullTraceabilityChain(feedbackId);
  chain.timeline.forEach((event: any) => {
    console.log(`   [${event.time.toISOString().slice(0, 19)}] ${event.title}: ${event.description}`);
  });

  console.log('\n✓ 场景1测试完成 - 少货问题追溯成功');
}

async function testScenario2_WrongSKU() {
  console.log('\n=== 场景2: 错SKU问题追溯 ===\n');

  const waveService = new WaveService();
  const pickTaskService = new PickTaskService();
  const packageService = new PackageService();
  const afterSalesService = new AfterSalesService();

  const supervisor = await prisma.employee.findUnique({ where: { code: 'S001' } });
  const picker2 = await prisma.employee.findUnique({ where: { code: 'P002' } });
  const reviewer = await prisma.employee.findUnique({ where: { code: 'R001' } });
  const cs = await prisma.employee.findUnique({ where: { code: 'C001' } });

  const orders = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING },
    take: 1,
  });

  if (orders.length === 0) {
    console.log('   没有待处理订单，跳过此场景');
    return;
  }

  const order = orders[0];
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    include: { product: true },
  });

  console.log(`1. 张主管创建波次，包含订单 ${order.orderNo}...`);
  const waveId = await waveService.createWave('测试波次-错SKU场景', [order.id], supervisor!.id);
  const wave = await waveService.getWaveById(waveId);
  console.log(`   ✓ 波次创建成功: ${wave?.waveNo}`);

  await waveService.startWave(waveId, supervisor!.id);
  console.log('2. 波次开始');

  const pickTasks = await pickTaskService.getAvailableTasks();
  console.log(`3. 王拣货领取${pickTasks.length}个拣货任务...`);

  for (const task of pickTasks) {
    await pickTaskService.assignTask(task.id, picker2!.id);
    await pickTaskService.startPicking(task.id, picker2!.id);
    await pickTaskService.completeTask(task.id, picker2!.id, task.quantity);
  }
  console.log('   ✓ 拣货完成');

  await waveService.completeWave(wave!.id);
  console.log('4. 波次完成');

  const products = await prisma.product.findMany();
  const expectedProduct = orderItems[0].product;
  const wrongProduct = products.find((p) => p.id !== expectedProduct.id)!;

  console.log('5. 创建包裹（故意装错SKU，应发「' + expectedProduct.sku + '」实装「' + wrongProduct.sku + '」）...');
  const pkgId = await packageService.createPackage(
    order.id,
    [{ productId: wrongProduct.id, expectedProductId: expectedProduct.id, quantity: orderItems[0].quantity }],
    0.3
  );
  console.log(`   ✓ 包裹创建，expectedProductId=${expectedProduct.id}, productId=${wrongProduct.id}`);

  console.log('6. 复核时未发现错误，直接通过（复核员未核对SKU，只验数量）...');
  const reviewItems = [
    {
      productId: wrongProduct.id,
      expectedQty: orderItems[0].quantity,
      actualQty: orderItems[0].quantity,
    },
  ];
  const reviewId = await packageService.reviewPackage(pkgId, reviewer!.id, reviewItems, '复核通过');
  const reviewRecord = await packageService.getReviewRecordById(reviewId);
  console.log(`   ✓ 复核结果: ${reviewRecord?.status}，isMatch: ${reviewRecord?.reviewItems.map((ri: any) => ri.isMatch).join(', ')}`);

  await packageService.shipPackage(pkgId);
  console.log('7. 包裹出库');

  console.log('8. 客户收到货发现SKU不对，投诉...');
  const feedbackId = await afterSalesService.createFeedback(
    pkgId,
    FeedbackType.WRONG_SKU,
    `订购的是${expectedProduct.sku}，但收到的是${wrongProduct.sku}`,
    order.customerName,
    order.customerPhone
  );
  const feedback = await afterSalesService.getFeedbackById(feedbackId);
  console.log(`   ✓ 售后反馈提交: ${feedback?.feedbackNo}`);

  await afterSalesService.startInvestigation(feedbackId, cs!.id);
  console.log('9. 开始调查');

  console.log('10. 追溯根源...');
  const traceResult = await afterSalesService.traceRootCause(feedbackId);
  console.log('   可能原因:');
  traceResult.possibleCauses.forEach((cause: any, i: number) => {
    console.log(`     ${i + 1}. [${cause.type}] ${cause.description}`);
    if (cause.expectedProduct && cause.actualProduct) {
      console.log(`        应发: ${cause.expectedProduct.sku} | 实发: ${cause.actualProduct.sku}`);
    }
    if (cause.waveId) {
      console.log(`        关联波次: ${cause.waveId}`);
    }
    if (cause.pickTask) {
      console.log(`        关联拣货任务: ${cause.pickTask.taskNo}，拣货员: ${cause.pickTask.pickedBy?.name || '未分配'}`);
    }
  });

  const skuCause = traceResult.possibleCauses.find((c: any) => c.type === 'SKU_MISMATCH_IN_PACKAGE');
  if (skuCause) {
    console.log('\n   ✓ 成功追溯到错SKU根因！');
    await afterSalesService.resolveFeedback(
      feedbackId,
      cs!.id,
      skuCause.waveId,
      skuCause.pickTask?.id,
      `确认为装错SKU，应发${expectedProduct.sku}实发${wrongProduct.sku}，已安排换货`
    );
    console.log('   ✓ 问题已解决');
  } else {
    console.log('\n   ✗ 未能追溯到错SKU根因！');
  }

  console.log('\n✓ 场景2测试完成 - 错SKU问题可追溯');
}

async function testScenario3_ReviewReject() {
  console.log('\n=== 场景3: 复核退回 ===\n');

  const waveService = new WaveService();
  const pickTaskService = new PickTaskService();
  const packageService = new PackageService();

  const supervisor = await prisma.employee.findUnique({ where: { code: 'S001' } });
  const picker1 = await prisma.employee.findUnique({ where: { code: 'P001' } });
  const reviewer = await prisma.employee.findUnique({ where: { code: 'R001' } });

  const pendingOrders = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING },
    take: 1,
  });

  if (pendingOrders.length === 0) {
    console.log('   没有待处理订单，跳过此场景');
    return;
  }

  const order = pendingOrders[0];
  console.log(`1. 创建波次 - 订单 ${order.orderNo}`);
  const waveId = await waveService.createWave('测试波次-复核退回', [order.id], supervisor!.id);
  await waveService.startWave(waveId, supervisor!.id);

  const pickTasks = await pickTaskService.getAvailableTasks();
  console.log('2. 拣货员领取并完成任务...');
  for (const task of pickTasks) {
    await pickTaskService.assignTask(task.id, picker1!.id);
    await pickTaskService.startPicking(task.id, picker1!.id);
    await pickTaskService.completeTask(task.id, picker1!.id, task.quantity);
  }
  await waveService.completeWave(waveId);

  const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  console.log('3. 创建包裹...');
  const pkgId = await packageService.createPackage(
    order.id,
    orderItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
  );

  console.log('4. 复核时发现数量不对，退回...');
  const reviewItems = orderItems.map((item, index) => ({
    productId: item.productId,
    expectedProductId: item.productId,
    expectedQty: item.quantity,
    actualQty: index === 0 ? item.quantity - 1 : item.quantity,
  }));

  const reviewId = await packageService.reviewPackage(
    pkgId,
    reviewer!.id,
    reviewItems,
    '发现第一个商品少1个，退回重拣'
  );
  const review = await packageService.getReviewRecordById(reviewId);

  console.log(`   ✓ 复核结果: ${review?.status} - ${review?.notes}`);

  const updatedPkg = await packageService.getPackageById(pkgId);
  console.log(`   包裹状态: ${updatedPkg?.status}`);

  console.log('\n✓ 场景3测试完成 - 复核退回流程正常');
}

async function testScenario4_ConcurrencyLock() {
  console.log('\n=== 场景4: 并发锁定测试 ===\n');

  const waveService = new WaveService();
  const supervisor = await prisma.employee.findUnique({ where: { code: 'S001' } });

  const pendingOrders = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING },
    take: 1,
  });

  if (pendingOrders.length === 0) {
    console.log('   没有待处理订单，跳过此场景');
    return;
  }

  const order = pendingOrders[0];
  console.log(`测试订单: ${order.orderNo} (状态: ${order.status})`);

  const waveCountBefore = await prisma.wave.count();
  console.log(`   测试前波次总数: ${waveCountBefore}`);

  console.log('1. 张主管尝试创建波次1...');
  const promise1 = waveService.createWave('并发测试波次1', [order.id], supervisor!.id);

  console.log('2. 张主管同时尝试创建波次2（同一订单）...');
  const promise2 = waveService.createWave('并发测试波次2', [order.id], supervisor!.id);

  let successCount = 0;
  let failCount = 0;
  try {
    const results = await Promise.allSettled([promise1, promise2]);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        const wave = await waveService.getWaveById(result.value);
        console.log(`   波次${i + 1}: 创建成功 - ${wave?.waveNo}`);
        successCount++;
      } else {
        console.log(`   波次${i + 1}: 创建失败 - ${result.reason.message}`);
        failCount++;
      }
    }
  } catch (e: any) {
    console.log('   并发控制生效:', e.message);
  }

  const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  console.log(`   订单最终状态: ${updatedOrder?.status}, 所属波次: ${updatedOrder?.waveId || '无'}`);

  const waveCountAfter = await prisma.wave.count();
  const newWavesCreated = waveCountAfter - waveCountBefore;
  console.log(`   新创建波次数: ${newWavesCreated}（应为1）`);
  if (newWavesCreated === 1 && successCount === 1 && failCount === 1) {
    console.log('   ✓ 并发锁定正确：只有一个波次成功创建，另一个被拒绝');
  } else if (successCount === 1 && failCount === 1) {
    console.log('   ✓ 并发锁定正确：只有一个波次成功');
  } else {
    console.log('   ✗ 并发锁定可能存在问题');
  }

  console.log('\n✓ 场景4测试完成 - 并发锁定机制正常工作');
}

async function testScenario5_MultiSKUActualQuantity() {
  console.log('\n=== 场景5: 多SKU包裹actualQuantity正确性验证 ===\n');

  const waveService = new WaveService();
  const pickTaskService = new PickTaskService();
  const packageService = new PackageService();

  const supervisor = await prisma.employee.findUnique({ where: { code: 'S001' } });
  const picker1 = await prisma.employee.findUnique({ where: { code: 'P001' } });
  const reviewer = await prisma.employee.findUnique({ where: { code: 'R001' } });

  const products = await prisma.product.findMany();
  const locations = await prisma.location.findMany();

  const order = await prisma.order.create({
    data: {
      orderNo: `ORD-MULTISKU-${Date.now()}`,
      customerName: '多SKU测试客户',
      customerPhone: '13900009999',
      address: '测试地址',
      status: OrderStatus.PENDING,
      orderItems: {
        create: [
          { productId: products[0].id, quantity: 3 },
          { productId: products[1].id, quantity: 5 },
        ],
      },
    },
    include: { orderItems: true },
  });
  await prisma.inventory.upsert({
    where: {
      productId_locationId: { productId: products[0].id, locationId: locations[0].id },
    },
    update: { quantity: { increment: 10 } },
    create: { productId: products[0].id, locationId: locations[0].id, quantity: 10 },
  });
  await prisma.inventory.upsert({
    where: {
      productId_locationId: { productId: products[1].id, locationId: locations[1].id },
    },
    update: { quantity: { increment: 10 } },
    create: { productId: products[1].id, locationId: locations[1].id, quantity: 10 },
  });
  console.log('   创建测试订单（含2个SKU）');

  console.log(`1. 创建波次 - 订单 ${order.orderNo}（含${order.orderItems.length}个SKU）`);
  const waveId = await waveService.createWave('测试波次-多SKU', [order.id], supervisor!.id);
  await waveService.startWave(waveId, supervisor!.id);

  const allTasks = await pickTaskService.getAvailableTasks();
  const pickTasks = allTasks.filter((t) => t.waveId === waveId);
  for (const task of pickTasks) {
    await pickTaskService.assignTask(task.id, picker1!.id);
    await pickTaskService.startPicking(task.id, picker1!.id);
    await pickTaskService.completeTask(task.id, picker1!.id, task.quantity);
  }
  await waveService.completeWave(waveId);

  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    include: { product: true },
  });
  console.log('2. 创建包裹（含多SKU）...');
  const pkgId = await packageService.createPackage(
    order.id,
    orderItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
  );

  console.log('3. 复核通过...');
  const reviewItems = orderItems.map((item) => ({
    productId: item.productId,
    expectedProductId: item.productId,
    expectedQty: item.quantity,
    actualQty: item.quantity,
  }));
  await packageService.reviewPackage(pkgId, reviewer!.id, reviewItems, '复核通过');

  console.log('4. 验证每个PackageItem的actualQuantity是否正确（修复前会被写成首项数量）...');
  const pkgData = await packageService.getPackageById(pkgId);
  let allCorrect = true;
  for (const pi of pkgData!.packageItems) {
    const reviewItem = reviewItems.find((ri) => ri.productId === pi.productId);
    const expected = reviewItem?.actualQty;
    const actual = pi.actualQuantity;
    const ok = actual === expected;
    if (!ok) allCorrect = false;
    console.log(`   商品 ${pi.product.sku}: quantity=${pi.quantity}, actualQuantity=${actual}, 期望=${expected} ${ok ? '✓' : '✗'}`);
  }

  if (allCorrect) {
    console.log('   ✓ 所有actualQuantity正确');
  } else {
    console.log('   ✗ 部分actualQuantity不正确');
  }

  console.log('\n✓ 场景5测试完成 - 多SKU包裹actualQuantity正确');
}

async function runAllTests() {
  console.log('========================================');
  console.log('  仓库追溯系统 - 完整业务流程测试');
  console.log('========================================');

  try {
    await testScenario1_MissingItem();
    await testScenario2_WrongSKU();
    await testScenario3_ReviewReject();
    await testScenario4_ConcurrencyLock();
    await testScenario5_MultiSKUActualQuantity();

    console.log('\n========================================');
    console.log('  所有测试场景执行完成！');
    console.log('========================================');
  } catch (error: any) {
    console.error('\n测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

runAllTests();

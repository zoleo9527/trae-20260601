import { PrismaClient } from '@prisma/client';
import { EmployeeRole, OrderStatus, WaveStatus, PickTaskStatus, PackageStatus, ReviewStatus, FeedbackType, FeedbackStatus } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建种子数据...');

  console.log('1. 创建员工账号...');
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { code: 'S001' },
      update: {},
      create: {
        code: 'S001',
        name: '张主管',
        role: EmployeeRole.WAREHOUSE_SUPERVISOR,
      },
    }),
    prisma.employee.upsert({
      where: { code: 'P001' },
      update: {},
      create: {
        code: 'P001',
        name: '李拣货',
        role: EmployeeRole.PICKER,
      },
    }),
    prisma.employee.upsert({
      where: { code: 'P002' },
      update: {},
      create: {
        code: 'P002',
        name: '王拣货',
        role: EmployeeRole.PICKER,
      },
    }),
    prisma.employee.upsert({
      where: { code: 'R001' },
      update: {},
      create: {
        code: 'R001',
        name: '赵复核',
        role: EmployeeRole.REVIEWER,
      },
    }),
    prisma.employee.upsert({
      where: { code: 'C001' },
      update: {},
      create: {
        code: 'C001',
        name: '刘客服',
        role: EmployeeRole.CUSTOMER_SERVICE,
      },
    }),
  ]);
  console.log('   ✓ 员工创建完成');

  console.log('2. 创建库位...');
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { code: 'A-01-01-01' },
      update: {},
      create: {
        code: 'A-01-01-01',
        aisle: 'A',
        shelf: '01',
        level: '01',
        position: '01',
      },
    }),
    prisma.location.upsert({
      where: { code: 'A-01-01-02' },
      update: {},
      create: {
        code: 'A-01-01-02',
        aisle: 'A',
        shelf: '01',
        level: '01',
        position: '02',
      },
    }),
    prisma.location.upsert({
      where: { code: 'A-01-02-01' },
      update: {},
      create: {
        code: 'A-01-02-01',
        aisle: 'A',
        shelf: '01',
        level: '02',
        position: '01',
      },
    }),
    prisma.location.upsert({
      where: { code: 'B-01-01-01' },
      update: {},
      create: {
        code: 'B-01-01-01',
        aisle: 'B',
        shelf: '01',
        level: '01',
        position: '01',
      },
    }),
  ]);
  console.log('   ✓ 库位创建完成');

  console.log('3. 创建商品...');
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'SKU001' },
      update: {},
      create: {
        sku: 'SKU001',
        name: '无线蓝牙耳机',
        category: '电子产品',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU002' },
      update: {},
      create: {
        sku: 'SKU002',
        name: '手机充电器',
        category: '电子产品',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU003' },
      update: {},
      create: {
        sku: 'SKU003',
        name: '数据线Type-C',
        category: '配件',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU004' },
      update: {},
      create: {
        sku: 'SKU004',
        name: '手机壳',
        category: '配件',
      },
    }),
  ]);
  console.log('   ✓ 商品创建完成');

  console.log('4. 创建库存...');
  await Promise.all([
    prisma.inventory.upsert({
      where: {
        productId_locationId: {
          productId: products[0].id,
          locationId: locations[0].id,
        },
      },
      update: { quantity: 100 },
      create: {
        productId: products[0].id,
        locationId: locations[0].id,
        quantity: 100,
      },
    }),
    prisma.inventory.upsert({
      where: {
        productId_locationId: {
          productId: products[1].id,
          locationId: locations[1].id,
        },
      },
      update: { quantity: 200 },
      create: {
        productId: products[1].id,
        locationId: locations[1].id,
        quantity: 200,
      },
    }),
    prisma.inventory.upsert({
      where: {
        productId_locationId: {
          productId: products[2].id,
          locationId: locations[2].id,
        },
      },
      update: { quantity: 500 },
      create: {
        productId: products[2].id,
        locationId: locations[2].id,
        quantity: 500,
      },
    }),
    prisma.inventory.upsert({
      where: {
        productId_locationId: {
          productId: products[3].id,
          locationId: locations[3].id,
        },
      },
      update: { quantity: 300 },
      create: {
        productId: products[3].id,
        locationId: locations[3].id,
        quantity: 300,
      },
    }),
  ]);
  console.log('   ✓ 库存创建完成');

  console.log('5. 创建订单...');
  const orders = await Promise.all([
    prisma.order.upsert({
      where: { orderNo: 'ORD20240601001' },
      update: {},
      create: {
        orderNo: 'ORD20240601001',
        customerName: '张三',
        customerPhone: '13800138001',
        address: '北京市朝阳区xxx街道123号',
        status: OrderStatus.PENDING,
        orderItems: {
          create: [
            { productId: products[0].id, quantity: 2 },
            { productId: products[2].id, quantity: 1 },
          ],
        },
      },
    }),
    prisma.order.upsert({
      where: { orderNo: 'ORD20240601002' },
      update: {},
      create: {
        orderNo: 'ORD20240601002',
        customerName: '李四',
        customerPhone: '13800138002',
        address: '上海市浦东新区xxx路456号',
        status: OrderStatus.PENDING,
        orderItems: {
          create: [
            { productId: products[1].id, quantity: 1 },
            { productId: products[3].id, quantity: 2 },
          ],
        },
      },
    }),
    prisma.order.upsert({
      where: { orderNo: 'ORD20240601003' },
      update: {},
      create: {
        orderNo: 'ORD20240601003',
        customerName: '王五',
        customerPhone: '13800138003',
        address: '广州市天河区xxx大道789号',
        status: OrderStatus.PENDING,
        orderItems: {
          create: [{ productId: products[0].id, quantity: 1 }],
        },
      },
    }),
    prisma.order.upsert({
      where: { orderNo: 'ORD20240601004' },
      update: {},
      create: {
        orderNo: 'ORD20240601004',
        customerName: '赵六',
        customerPhone: '13800138004',
        address: '深圳市南山区xxx科技园A栋',
        status: OrderStatus.PENDING,
        orderItems: {
          create: [
            { productId: products[1].id, quantity: 3 },
            { productId: products[2].id, quantity: 2 },
          ],
        },
      },
    }),
  ]);
  console.log('   ✓ 订单创建完成');

  console.log('\n种子数据创建完成！');
  console.log('\n员工账号:');
  employees.forEach((e) => {
    console.log(`  ID: ${e.id} - ${e.name} (${e.code}) - 角色: ${e.role}`);
  });
  console.log('\n商品:');
  products.forEach((p) => {
    console.log(`  ID: ${p.id} - ${p.sku} - ${p.name}`);
  });
  console.log('\n订单:');
  orders.forEach((o) => {
    console.log(`  ID: ${o.id} - ${o.orderNo} - ${o.customerName}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

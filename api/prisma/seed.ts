import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '../generated/prisma/client.js'
import { OrderStatus, Role } from '../generated/prisma/enums.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

const cuid = () => crypto.randomBytes(16).toString('hex')

async function main() {
  const passwordHash = await bcrypt.hash('demo123', 10)

  const sales = await prisma.user.create({
    data: {
      id: cuid(),
      username: 'sales',
      password: passwordHash,
      role: Role.SALES,
      displayName: '销售-小王',
    },
  })

  const brewer = await prisma.user.create({
    data: {
      id: cuid(),
      username: 'brewer',
      password: passwordHash,
      role: Role.BREWER,
      displayName: '酿酒师-老李',
    },
  })

  const packer = await prisma.user.create({
    data: {
      id: cuid(),
      username: 'packer',
      password: passwordHash,
      role: Role.PACKER,
      displayName: '包装-小陈',
    },
  })

  const admin = await prisma.user.create({
    data: {
      id: cuid(),
      username: 'admin',
      password: passwordHash,
      role: Role.ADMIN,
      displayName: '管理员-赵总',
    },
  })

  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000)
  const daysLater = (d: number) => new Date(now.getTime() + d * 86400000)

  const orders = await Promise.all([
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260601-001',
        distributorName: '华东酒水贸易有限公司',
        status: OrderStatus.DRAFT,
        deliveryDate: daysLater(15),
        remark: '待确认品种规格',
        createdById: sales.id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
        items: {
          create: [
            { id: cuid(), productName: '琥珀IPA', specification: '500ml×24瓶/箱', quantity: 50, unit: '箱' },
            { id: cuid(), productName: '小麦白啤', specification: '330ml×24罐/箱', quantity: 30, unit: '箱' },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260601-002',
        distributorName: '京城精酿商贸有限公司',
        status: OrderStatus.PENDING_CONFIRM,
        deliveryDate: daysLater(10),
        remark: '客户要求尽快确认',
        createdById: sales.id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
        items: {
          create: [
            { id: cuid(), productName: '黑啤精酿', specification: '500ml×12瓶/箱', quantity: 40, unit: '箱' },
            { id: cuid(), productName: '红啤烈焰', specification: '330ml×24罐/箱', quantity: 60, unit: '箱' },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260602-003',
        distributorName: '南方精酿供应链管理有限公司',
        status: OrderStatus.IN_PRODUCTION,
        deliveryDate: daysLater(7),
        remark: '已在酿造中，预计5天完成',
        createdById: sales.id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1),
        items: {
          create: [
            { id: cuid(), productName: '琥珀IPA', specification: '500ml×24瓶/箱', quantity: 80, unit: '箱' },
            { id: cuid(), productName: '小麦白啤', specification: '500ml×12瓶/箱', quantity: 50, unit: '箱' },
            { id: cuid(), productName: '蜂蜜艾尔', specification: '330ml×24罐/箱', quantity: 40, unit: '箱' },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260602-004',
        distributorName: '西南微酿商贸有限公司',
        status: OrderStatus.READY_TO_SHIP,
        deliveryDate: daysLater(3),
        remark: '已完成包装，等待发货',
        createdById: sales.id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(1),
        items: {
          create: [
            { id: cuid(), productName: '世涛黑啤', specification: '500ml×24瓶/箱', quantity: 30, unit: '箱' },
            { id: cuid(), productName: '燕麦世涛', specification: '330ml×24罐/箱', quantity: 25, unit: '箱' },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260603-005',
        distributorName: '华东酒水贸易有限公司',
        status: OrderStatus.SHIPPED,
        deliveryDate: daysLater(2),
        remark: '已发顺丰物流',
        createdById: sales.id,
        createdAt: daysAgo(8),
        updatedAt: daysAgo(1),
        items: {
          create: [
            { id: cuid(), productName: '琥珀IPA', specification: '500ml×24瓶/箱', quantity: 100, unit: '箱' },
            { id: cuid(), productName: '小麦白啤', specification: '330ml×24罐/箱', quantity: 80, unit: '箱' },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260603-006',
        distributorName: '京城精酿商贸有限公司',
        status: OrderStatus.COMPLETED,
        deliveryDate: daysAgo(5),
        remark: '客户已签收，订单完成',
        createdById: sales.id,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(5),
        items: {
          create: [
            { id: cuid(), productName: '黑啤精酿', specification: '500ml×12瓶/箱', quantity: 60, unit: '箱' },
            { id: cuid(), productName: '红啤烈焰', specification: '330ml×24罐/箱', quantity: 40, unit: '箱' },
            { id: cuid(), productName: '蜂蜜艾尔', specification: '500ml×12瓶/箱', quantity: 30, unit: '箱' },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260604-007',
        distributorName: '南方精酿供应链管理有限公司',
        status: OrderStatus.RETURNED,
        deliveryDate: daysAgo(3),
        remark: '运输破损，客户退货',
        createdById: sales.id,
        createdAt: daysAgo(12),
        updatedAt: daysAgo(3),
        items: {
          create: [
            { id: cuid(), productName: '世涛黑啤', specification: '500ml×24瓶/箱', quantity: 20, unit: '箱' },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: cuid(),
        orderNo: 'ORD-20260604-008',
        distributorName: '西南微酿商贸有限公司',
        status: OrderStatus.EXCEPTION,
        deliveryDate: daysLater(5),
        remark: '原料短缺，生产延迟',
        createdById: sales.id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(1),
        items: {
          create: [
            { id: cuid(), productName: '琥珀IPA', specification: '500ml×24瓶/箱', quantity: 70, unit: '箱' },
            { id: cuid(), productName: '燕麦世涛', specification: '330ml×24罐/箱', quantity: 50, unit: '箱' },
            { id: cuid(), productName: '小麦白啤', specification: '500ml×12瓶/箱', quantity: 40, unit: '箱' },
          ],
        },
      },
    }),
  ])

  const shipments = await Promise.all([
    prisma.shipment.create({
      data: {
        id: cuid(),
        orderId: orders[4].id,
        logisticsCompany: '顺丰速运',
        trackingNo: 'SF20260604001',
        shippedAt: daysAgo(1),
        createdById: packer.id,
        createdAt: daysAgo(1),
      },
    }),
    prisma.shipment.create({
      data: {
        id: cuid(),
        orderId: orders[5].id,
        logisticsCompany: '京东物流',
        trackingNo: 'JD20260525001',
        shippedAt: daysAgo(8),
        receivedAt: daysAgo(5),
        receivedById: sales.id,
        receiveRemark: '客户确认签收，包装完好',
        createdById: packer.id,
        createdAt: daysAgo(8),
      },
    }),
    prisma.shipment.create({
      data: {
        id: cuid(),
        orderId: orders[6].id,
        logisticsCompany: '中通快递',
        trackingNo: 'ZT20260530001',
        shippedAt: daysAgo(6),
        receivedAt: daysAgo(3),
        receivedById: sales.id,
        receiveRemark: '部分破损，客户退货8箱',
        createdById: packer.id,
        createdAt: daysAgo(6),
      },
    }),
  ])

  const auditLogs = [
    { id: cuid(), orderId: orders[0].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.DRAFT, remark: '创建订单', createdAt: daysAgo(2) },
    { id: cuid(), orderId: orders[1].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.PENDING_CONFIRM, remark: '创建订单并提交确认', createdAt: daysAgo(3) },
    { id: cuid(), orderId: orders[2].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.PENDING_CONFIRM, remark: '创建订单', createdAt: daysAgo(5) },
    { id: cuid(), orderId: orders[2].id, userId: brewer.id, action: 'CONFIRM', fromStatus: OrderStatus.PENDING_CONFIRM, toStatus: OrderStatus.IN_PRODUCTION, remark: '确认订单，开始生产', createdAt: daysAgo(1) },
    { id: cuid(), orderId: orders[3].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.PENDING_CONFIRM, remark: '创建订单', createdAt: daysAgo(7) },
    { id: cuid(), orderId: orders[3].id, userId: brewer.id, action: 'CONFIRM', fromStatus: OrderStatus.PENDING_CONFIRM, toStatus: OrderStatus.IN_PRODUCTION, remark: '开始生产', createdAt: daysAgo(4) },
    { id: cuid(), orderId: orders[3].id, userId: packer.id, action: 'COMPLETE_PRODUCTION', fromStatus: OrderStatus.IN_PRODUCTION, toStatus: OrderStatus.READY_TO_SHIP, remark: '包装完成，待发货', createdAt: daysAgo(1) },
    { id: cuid(), orderId: orders[4].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.PENDING_CONFIRM, remark: '创建订单', createdAt: daysAgo(8) },
    { id: cuid(), orderId: orders[4].id, userId: brewer.id, action: 'CONFIRM', fromStatus: OrderStatus.PENDING_CONFIRM, toStatus: OrderStatus.IN_PRODUCTION, remark: '开始生产', createdAt: daysAgo(5) },
    { id: cuid(), orderId: orders[4].id, userId: packer.id, action: 'COMPLETE_PRODUCTION', fromStatus: OrderStatus.IN_PRODUCTION, toStatus: OrderStatus.READY_TO_SHIP, remark: '包装完成', createdAt: daysAgo(2) },
    { id: cuid(), orderId: orders[4].id, userId: packer.id, action: 'SHIP', fromStatus: OrderStatus.READY_TO_SHIP, toStatus: OrderStatus.SHIPPED, remark: '已发货', createdAt: daysAgo(1) },
    { id: cuid(), orderId: orders[5].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.PENDING_CONFIRM, remark: '创建订单', createdAt: daysAgo(15) },
    { id: cuid(), orderId: orders[5].id, userId: brewer.id, action: 'CONFIRM', fromStatus: OrderStatus.PENDING_CONFIRM, toStatus: OrderStatus.IN_PRODUCTION, remark: '开始生产', createdAt: daysAgo(12) },
    { id: cuid(), orderId: orders[5].id, userId: packer.id, action: 'COMPLETE_PRODUCTION', fromStatus: OrderStatus.IN_PRODUCTION, toStatus: OrderStatus.READY_TO_SHIP, remark: '包装完成', createdAt: daysAgo(10) },
    { id: cuid(), orderId: orders[5].id, userId: packer.id, action: 'SHIP', fromStatus: OrderStatus.READY_TO_SHIP, toStatus: OrderStatus.SHIPPED, remark: '已发货', createdAt: daysAgo(8) },
    { id: cuid(), orderId: orders[5].id, userId: sales.id, action: 'RECEIVE', fromStatus: OrderStatus.SHIPPED, toStatus: OrderStatus.COMPLETED, remark: '客户签收确认', createdAt: daysAgo(5) },
    { id: cuid(), orderId: orders[6].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.PENDING_CONFIRM, remark: '创建订单', createdAt: daysAgo(12) },
    { id: cuid(), orderId: orders[6].id, userId: packer.id, action: 'SHIP', fromStatus: OrderStatus.PENDING_CONFIRM, toStatus: OrderStatus.SHIPPED, remark: '快速通道发货', createdAt: daysAgo(6) },
    { id: cuid(), orderId: orders[6].id, userId: sales.id, action: 'RETURN', fromStatus: OrderStatus.SHIPPED, toStatus: OrderStatus.RETURNED, remark: '运输破损退货', createdAt: daysAgo(3) },
    { id: cuid(), orderId: orders[7].id, userId: sales.id, action: 'CREATE', fromStatus: null, toStatus: OrderStatus.PENDING_CONFIRM, remark: '创建订单', createdAt: daysAgo(6) },
    { id: cuid(), orderId: orders[7].id, userId: brewer.id, action: 'MARK_EXCEPTION', fromStatus: OrderStatus.PENDING_CONFIRM, toStatus: OrderStatus.EXCEPTION, remark: '原料短缺，无法按时生产', createdAt: daysAgo(1) },
  ]

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log })
  }

  console.log('Seed completed successfully')
  console.log(`- Users: 4`)
  console.log(`- Orders: ${orders.length}`)
  console.log(`- Shipments: ${shipments.length}`)
  console.log(`- AuditLogs: ${auditLogs.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

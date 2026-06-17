import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.create({
    data: {
      name: '王老板',
      role: 'OWNER',
      phone: '13800138001'
    }
  })

  await prisma.user.create({
    data: {
      name: '李厨师',
      role: 'CHEF',
      phone: '13800138002'
    }
  })

  await prisma.user.create({
    data: {
      name: '张阿姨',
      role: 'HOUSEKEEPER',
      phone: '13800138003'
    }
  })

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  await prisma.teamBuilding.create({
    data: {
      name: '星辰科技团建',
      contactName: '陈经理',
      contactPhone: '13900139001',
      date: tomorrow,
      participantCount: 25,
      status: 'PENDING',
      riskLevel: 'MEDIUM',
      notes: '客户要求增加素食餐，已通知后厨准备',
      updatedBy: 'admin',
      privateRooms: {
        create: [
          { name: '翠竹厅', capacity: 15, bookedAt: tomorrow, notes: '节假日超订预警' },
          { name: '幽兰厅', capacity: 12, bookedAt: tomorrow }
        ]
      },
      accommodations: {
        create: [
          {
            roomNumber: '201',
            guestName: '陈经理',
            checkInDate: tomorrow,
            checkOutDate: nextWeek,
            depositAmount: 500,
            depositPaid: true,
            notes: '已付押金'
          },
          {
            roomNumber: '202',
            guestName: '刘主管',
            checkInDate: tomorrow,
            checkOutDate: nextWeek,
            depositAmount: 500,
            depositPaid: false,
            notes: '押金未支付，需跟进'
          }
        ]
      },
      ingredients: {
        create: [
          { name: '土鸡', quantity: 5, unit: '只', unitPrice: 120, stockStatus: 'SUFFICIENT' },
          { name: '土鸡蛋', quantity: 100, unit: '个', unitPrice: 1.5, stockStatus: 'LOW', notes: '库存不足，需采购' },
          { name: '有机蔬菜', quantity: 20, unit: '斤', unitPrice: 8, stockStatus: 'SUFFICIENT' }
        ]
      }
    }
  })

  await prisma.teamBuilding.create({
    data: {
      name: '蓝海集团年会',
      contactName: '周总监',
      contactPhone: '13900139002',
      date: nextWeek,
      participantCount: 50,
      status: 'CONFIRMED',
      riskLevel: 'HIGH',
      notes: '大型活动，包间和食材需提前准备',
      updatedBy: 'admin',
      privateRooms: {
        create: [
          { name: '牡丹厅', capacity: 20, bookedAt: nextWeek },
          { name: '玫瑰厅', capacity: 18, bookedAt: nextWeek },
          { name: '百合厅', capacity: 15, bookedAt: nextWeek, notes: '空调需检修' }
        ]
      },
      accommodations: {
        create: [
          {
            roomNumber: '301',
            guestName: '周总监',
            checkInDate: nextWeek,
            checkOutDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
            depositAmount: 1000,
            depositPaid: true
          }
        ]
      },
      ingredients: {
        create: [
          { name: '龙虾', quantity: 30, unit: '斤', unitPrice: 180, stockStatus: 'INSUFFICIENT', notes: '需提前预订' },
          { name: '鲍鱼', quantity: 50, unit: '只', unitPrice: 35, stockStatus: 'SUFFICIENT' },
          { name: '进口红酒', quantity: 10, unit: '瓶', unitPrice: 380, stockStatus: 'SUFFICIENT' }
        ]
      }
    }
  })

  await prisma.teamBuilding.create({
    data: {
      name: '绿意环保部门聚餐',
      contactName: '赵主任',
      contactPhone: '13900139003',
      date: today,
      participantCount: 12,
      status: 'IN_PROGRESS',
      riskLevel: 'NONE',
      notes: '进行中',
      updatedBy: 'admin',
      privateRooms: {
        create: [{ name: '梅花厅', capacity: 15, bookedAt: today }]
      },
      ingredients: {
        create: [
          { name: '时蔬拼盘', quantity: 5, unit: '份', unitPrice: 45, stockStatus: 'SUFFICIENT' },
          { name: '清蒸鱼', quantity: 2, unit: '条', unitPrice: 80, stockStatus: 'SUFFICIENT' }
        ]
      }
    }
  })

  await prisma.teamBuilding.create({
    data: {
      name: '阳光教育亲子活动',
      contactName: '孙校长',
      contactPhone: '13900139004',
      date: yesterday,
      participantCount: 30,
      status: 'COMPLETED',
      riskLevel: 'NONE',
      notes: '活动圆满结束，客户满意度高',
      updatedBy: 'admin',
      privateRooms: {
        create: [{ name: '荷花厅', capacity: 35, bookedAt: yesterday }]
      },
      accommodations: {
        create: [
          {
            roomNumber: '101',
            guestName: '孙校长',
            checkInDate: yesterday,
            checkOutDate: today,
            depositAmount: 300,
            depositPaid: true
          }
        ]
      },
      ingredients: {
        create: [
          { name: '儿童套餐', quantity: 30, unit: '份', unitPrice: 35, stockStatus: 'SUFFICIENT' },
          { name: '水果拼盘', quantity: 10, unit: '份', unitPrice: 50, stockStatus: 'SUFFICIENT' }
        ]
      }
    }
  })

  const completedTb = await prisma.teamBuilding.findFirst({
    where: { status: 'COMPLETED' }
  })

  if (completedTb) {
    await prisma.expenseSettlement.create({
      data: {
        teamBuildingId: completedTb.id,
        status: 'SETTLED',
        totalAmount: 2850,
        depositAmount: 300,
        paidAmount: 2850,
        outstandingAmount: 0,
        notes: '费用已结清，客户要求开发票',
        updatedBy: 'admin'
      }
    })
  }

  const pendingTb = await prisma.teamBuilding.findFirst({
    where: { status: 'PENDING' }
  })

  if (pendingTb) {
    await prisma.expenseSettlement.create({
      data: {
        teamBuildingId: pendingTb.id,
        status: 'PARTIAL',
        totalAmount: 3200,
        depositAmount: 1000,
        paidAmount: 500,
        outstandingAmount: 2700,
        notes: '部分押金已付，余额待结算',
        updatedBy: 'admin'
      }
    })
  }

  const confirmedTb = await prisma.teamBuilding.findFirst({
    where: { status: 'CONFIRMED' }
  })

  if (confirmedTb) {
    await prisma.expenseSettlement.create({
      data: {
        teamBuildingId: confirmedTb.id,
        status: 'UNSETTLED',
        totalAmount: 15500,
        depositAmount: 1000,
        paidAmount: 1000,
        outstandingAmount: 14500,
        notes: '押金已付，活动未开始',
        updatedBy: 'admin'
      }
    })
  }

  console.log('Seed data created successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
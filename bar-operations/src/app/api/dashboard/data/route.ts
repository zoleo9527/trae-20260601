import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    // 获取待办事项 - 即将过期的寄存
    const pendingDeposits = await prisma.deposit.findMany({
      where: {
        status: { in: ['ACTIVE', 'PARTIALLY'] },
        expiredAt: {
          lte: sevenDaysLater,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        expiredAt: 'asc',
      },
      take: 5,
    })

    const todoItems = pendingDeposits.map((deposit) => ({
      id: deposit.id,
      title: `处理寄存单 ${deposit.depositCode}`,
      description: deposit.items.map((item) => `${item.itemName} × ${item.remaining}`).join(', '),
      priority: deposit.expiredAt < today ? 'high' : 'medium',
      dueTime: deposit.expiredAt.toISOString().slice(0, 10),
      depositId: deposit.id,
      depositCode: deposit.depositCode,
    }))

    // 获取风险项
    const [expiredCount, anomalyCount, totalDepositCount] = await Promise.all([
      prisma.deposit.count({
        where: {
          status: 'EXPIRED',
        },
      }),
      prisma.redeemRecord.count({
        where: {
          time: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.deposit.count(),
    ])

    const riskItems = []
    
    if (expiredCount > 0) {
      riskItems.push({
        id: 'expired',
        type: 'expiry' as const,
        title: '寄存超期未取',
        description: `有 ${expiredCount} 个寄存单已过期`,
        severity: 'high' as const,
        count: expiredCount,
      })
    }

    if (anomalyCount > 10) {
      riskItems.push({
        id: 'anomaly',
        type: 'anomaly' as const,
        title: '高频核销预警',
        description: `24小时内核销次数超过 ${anomalyCount} 次`,
        severity: 'medium' as const,
        count: anomalyCount,
      })
    }

    if (totalDepositCount > 50) {
      riskItems.push({
        id: 'inventory',
        type: 'inventory' as const,
        title: '库存预警',
        description: `寄存总量已达 ${totalDepositCount} 单，建议清理`,
        severity: 'low' as const,
        count: totalDepositCount,
      })
    }

    // 获取最近变更
    const recentDeposits = await prisma.deposit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    const recentRedeems = await prisma.redeemRecord.findMany({
      include: {
        deposit: {
          select: { customerName: true, depositCode: true },
        },
      },
      orderBy: { time: 'desc' },
      take: 3,
    })

    const recentExpired = await prisma.deposit.findMany({
      where: { status: 'EXPIRED' },
      orderBy: { updatedAt: 'desc' },
      take: 2,
    })

    const recentItems = [
      ...recentDeposits.map((deposit) => ({
        id: deposit.id,
        type: 'deposit' as const,
        title: `新建寄存 ${deposit.depositCode}`,
        description: `客户：${deposit.customerName}`,
        time: deposit.createdAt.toISOString().replace('T', ' ').slice(0, 16),
        status: 'pending' as const,
        depositId: deposit.id,
      })),
      ...recentRedeems.map((redeem) => ({
        id: redeem.id,
        type: 'redeem' as const,
        title: `核销寄存 ${redeem.depositCode}`,
        description: `${redeem.itemName} × ${redeem.quantity}`,
        time: redeem.time.toISOString().replace('T', ' ').slice(0, 16),
        status: 'success' as const,
        depositId: redeem.depositId,
        redeemId: redeem.id,
      })),
      ...recentExpired.map((deposit) => ({
        id: deposit.id,
        type: 'expiry' as const,
        title: `寄存 ${deposit.depositCode} 已过期`,
        description: `客户：${deposit.customerName}`,
        time: deposit.updatedAt.toISOString().replace('T', ' ').slice(0, 16),
        status: 'danger' as const,
        depositId: deposit.id,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6)

    // 统计数据
    const todayDeposits = await prisma.deposit.count({
      where: {
        createdAt: {
          gte: new Date(today.toDateString()),
        },
      },
    })

    const todayRedeems = await prisma.redeemRecord.count({
      where: {
        time: {
          gte: new Date(today.toDateString()),
        },
      },
    })

    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthlyRevenue = await prisma.redeemRecord.aggregate({
      where: {
        time: {
          gte: startOfMonth,
        },
      },
      _sum: {
        quantity: true,
      },
    })

    const stats = {
      todayDeposits,
      todayRedeems,
      riskCount: riskItems.length,
      monthlyRevenue: (monthlyRevenue._sum.quantity || 0) * 100,
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        todoItems,
        riskItems,
        recentItems,
      },
    })
  } catch (error) {
    console.error('Get dashboard data error:', error)
    return NextResponse.json({ success: false, error: '获取首页数据失败' }, { status: 500 })
  }
}
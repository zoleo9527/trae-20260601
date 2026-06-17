import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        items: true,
        events: {
          orderBy: { time: 'desc' },
        },
        redeemRecords: {
          orderBy: { time: 'desc' },
        },
      },
    })

    if (!deposit) {
      return NextResponse.json({ success: false, error: '寄存记录不存在' }, { status: 404 })
    }

    const formattedDeposit = {
      ...deposit,
      createdAt: deposit.createdAt.toISOString().replace('T', ' ').slice(0, 16),
      expiredAt: deposit.expiredAt.toISOString().slice(0, 10),
      customerPhone: deposit.customerPhone
        ? deposit.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        : null,
      events: deposit.events.map((event) => ({
        ...event,
        time: event.time.toISOString().replace('T', ' ').slice(0, 16),
      })),
      redeemRecords: deposit.redeemRecords.map((record) => ({
        ...record,
        time: record.time.toISOString().replace('T', ' ').slice(0, 16),
      })),
    }

    return NextResponse.json({ success: true, data: formattedDeposit })
  } catch (error) {
    console.error('Get deposit detail error:', error)
    return NextResponse.json({ success: false, error: '获取寄存详情失败' }, { status: 500 })
  }
}
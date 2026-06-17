import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { depositIds, days, operator } = body

    if (!depositIds || depositIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择要延期的寄存单' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      for (const depositId of depositIds) {
        const deposit = await tx.deposit.findUnique({
          where: { id: depositId },
        })

        if (!deposit) continue

        const newExpiredAt = new Date(deposit.expiredAt)
        newExpiredAt.setDate(newExpiredAt.getDate() + days)

        await tx.deposit.update({
          where: { id: depositId },
          data: {
            expiredAt: newExpiredAt,
            status: deposit.status === 'EXPIRED' ? 'ACTIVE' : deposit.status,
          },
        })

        await tx.depositEvent.create({
          data: {
            depositId,
            type: 'EXTENDED',
            title: '寄存延期',
            description: `延期 ${days} 天`,
            operator: operator || 'admin',
          },
        })
      }
    })

    return NextResponse.json({ success: true, data: { count: depositIds.length } })
  } catch (error) {
    console.error('Batch extend error:', error)
    return NextResponse.json({ success: false, error: '批量延期失败' }, { status: 500 })
  }
}
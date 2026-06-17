import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { depositIds, operator } = body

    if (!depositIds || depositIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择要核销的寄存单' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      for (const depositId of depositIds) {
        const deposit = await tx.deposit.findUnique({
          where: { id: depositId },
          include: { items: true },
        })

        if (!deposit) continue

        for (const item of deposit.items) {
          if (item.remaining > 0) {
            await tx.redeemRecord.create({
              data: {
                depositId,
                depositCode: deposit.depositCode,
                itemName: item.itemName,
                quantity: item.remaining,
                operator: operator || 'admin',
              },
            })

            await tx.depositItem.update({
              where: { id: item.id },
              data: { remaining: 0 },
            })
          }
        }

        await tx.deposit.update({
          where: { id: depositId },
          data: { status: 'COMPLETED' },
        })

        await tx.depositEvent.create({
          data: {
            depositId,
            type: 'REDEEM',
            title: '批量核销完成',
            description: '所有物品已核销',
            operator: operator || 'admin',
          },
        })
      }
    })

    return NextResponse.json({ success: true, data: { count: depositIds.length } })
  } catch (error) {
    console.error('Batch redeem error:', error)
    return NextResponse.json({ success: false, error: '批量核销失败' }, { status: 500 })
  }
}
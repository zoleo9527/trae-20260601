import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { depositId, depositCode, items, operator, notes } = body

    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { items: true },
    })

    if (!deposit) {
      return NextResponse.json({ success: false, error: '寄存记录不存在' }, { status: 404 })
    }

    const depositItemsMap = new Map(deposit.items.map((item) => [item.itemName, item]))

    for (const item of items) {
      const depositItem = depositItemsMap.get(item.itemName)
      if (!depositItem || depositItem.remaining < item.quantity) {
        return NextResponse.json({ success: false, error: '库存不足' }, { status: 400 })
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.depositItem.update({
          where: { id: depositItemsMap.get(item.itemName)!.id },
          data: { remaining: { decrement: item.quantity } },
        })

        await tx.redeemRecord.create({
          data: {
            depositId,
            depositCode,
            itemName: item.itemName,
            quantity: item.quantity,
            operator: operator || 'admin',
            notes,
          },
        })
      }

      const updatedDeposit = await tx.deposit.findUnique({
        where: { id: depositId },
        include: { items: true },
      })

      const allCompleted = updatedDeposit!.items.every((item) => item.remaining === 0)
      const someCompleted = updatedDeposit!.items.some((item) => item.remaining < item.quantity)

      let newStatus = deposit.status
      if (allCompleted) {
        newStatus = 'COMPLETED'
      } else if (someCompleted) {
        newStatus = 'PARTIALLY'
      }

      await tx.deposit.update({
        where: { id: depositId },
        data: { status: newStatus },
      })

      await tx.depositEvent.create({
        data: {
          depositId,
          type: 'REDEEM',
          title: '核销取酒',
          description: items.map((i: { itemName: string; quantity: number }) => `${i.itemName} × ${i.quantity}`).join(', '),
          operator: operator || 'admin',
        },
      })

      return updatedDeposit
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('Create redeem error:', error)
    return NextResponse.json({ success: false, error: '核销失败' }, { status: 500 })
  }
}
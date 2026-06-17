import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerName, customerPhone, bookingId, expiryDays, items, operator } = body

    const depositCode = `DEP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const expiredAt = new Date()
    expiredAt.setDate(expiredAt.getDate() + (expiryDays || 30))

    const deposit = await prisma.deposit.create({
      data: {
        depositCode,
        customerName,
        customerPhone,
        bookingId,
        expiredAt,
        operator: operator || 'admin',
        items: {
          create: items.map((item: { itemName: string; category: string; quantity: number }) => ({
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            remaining: item.quantity,
          })),
        },
        events: {
          create: [
            {
              type: 'CREATED',
              title: '寄存创建',
              description: bookingId ? `关联订台 #${bookingId}` : '无关联订台',
              operator: operator || 'admin',
            },
            {
              type: 'CONFIRMED',
              title: '入库确认',
              description: '所有物品已入库',
              operator: operator || 'admin',
            },
          ],
        },
      },
      include: {
        items: true,
        events: true,
      },
    })

    return NextResponse.json({ success: true, data: deposit })
  } catch (error) {
    console.error('Create deposit error:', error)
    return NextResponse.json({ success: false, error: '创建寄存失败' }, { status: 500 })
  }
}
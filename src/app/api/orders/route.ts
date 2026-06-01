import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        part: true,
        drawing: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        inspections: {
          include: {
            inspectionItems: true,
          },
        },
        exceptions: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const order = await prisma.purchaseOrder.create({
      data,
      include: {
        supplier: true,
        part: true,
        drawing: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

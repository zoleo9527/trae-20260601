import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        users: true,
        purchaseOrders: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(suppliers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

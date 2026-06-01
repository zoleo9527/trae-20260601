import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      include: {
        drawings: true,
        purchaseOrders: true,
      },
      orderBy: { partNumber: 'asc' },
    })
    return NextResponse.json(parts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 })
  }
}

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const inspections = await prisma.inspection.findMany({
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            part: true,
          },
        },
        inspector: {
          select: { id: true, name: true, email: true },
        },
        inspectionItems: true,
        exceptions: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(inspections)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { inspectionItems, ...data } = await request.json()

    const inspection = await prisma.inspection.create({
      data: {
        ...data,
        inspectionItems: {
          create: inspectionItems,
        },
      },
      include: {
        purchaseOrder: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
        inspectionItems: true,
      },
    })
    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

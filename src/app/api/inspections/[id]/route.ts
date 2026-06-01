import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            part: true,
            drawing: true,
          },
        },
        inspector: {
          select: { id: true, name: true, email: true },
        },
        inspectionItems: true,
        exceptions: {
          include: {
            reportedBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 })
  }
}

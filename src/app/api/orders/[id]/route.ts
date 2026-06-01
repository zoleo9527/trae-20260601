import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        part: true,
        drawing: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        inspections: {
          include: {
            inspector: {
              select: { id: true, name: true, email: true },
            },
            inspectionItems: true,
          },
        },
        exceptions: {
          include: {
            reportedBy: {
              select: { id: true, name: true, email: true },
            },
            supplierFeedbacks: {
              include: {
                supplier: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            attachments: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const order = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data,
      include: {
        supplier: true,
        part: true,
        drawing: true,
      },
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exception = await prisma.exception.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            part: true,
            drawing: true,
          },
        },
        inspection: {
          include: {
            inspectionItems: true,
          },
        },
        reportedBy: {
          select: { id: true, name: true, email: true },
        },
        closedBy: {
          select: { id: true, name: true, email: true },
        },
        supplierFeedbacks: {
          include: {
            supplier: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    if (!exception) {
      return NextResponse.json({ error: 'Exception not found' }, { status: 404 })
    }

    return NextResponse.json(exception)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exception' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const exception = await prisma.exception.update({
      where: { id: params.id },
      data,
      include: {
        purchaseOrder: true,
        reportedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    return NextResponse.json(exception)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update exception' }, { status: 500 })
  }
}

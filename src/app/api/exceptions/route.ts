import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const exceptions = await prisma.exception.findMany({
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            part: true,
          },
        },
        inspection: true,
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
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(exceptions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exceptions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const exception = await prisma.exception.create({
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
    return NextResponse.json({ error: 'Failed to create exception' }, { status: 500 })
  }
}

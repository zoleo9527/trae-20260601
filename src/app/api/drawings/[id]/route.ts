import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const drawing = await prisma.drawing.findUnique({
      where: { id: params.id },
      include: {
        part: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 })
    }

    const versionHistory = await prisma.drawing.findMany({
      where: { partId: drawing.partId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { partId: drawing.partId },
      include: {
        drawing: {
          select: { id: true, version: true, revision: true, title: true },
        },
        supplier: { select: { id: true, name: true } },
        exceptions: {
          select: { id: true, exceptionNumber: true, title: true, status: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ ...drawing, versionHistory, purchaseOrders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch drawing' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const drawing = await prisma.drawing.update({
      where: { id: params.id },
      data,
      include: {
        part: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    return NextResponse.json(drawing)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update drawing' }, { status: 500 })
  }
}

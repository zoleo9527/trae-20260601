import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    const feedback = await prisma.supplierFeedback.create({
      data: {
        ...data,
        exceptionId: params.id,
      },
      include: {
        supplier: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await prisma.exception.update({
      where: { id: params.id },
      data: { status: 'SUPPLIER_RESPONDED' },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}

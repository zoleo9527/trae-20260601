import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const partId = searchParams.get('partId')

  try {
    const where = partId ? { partId } : {}
    const drawings = await prisma.drawing.findMany({
      where,
      include: {
        part: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(drawings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch drawings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const drawing = await prisma.drawing.create({
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
    return NextResponse.json({ error: 'Failed to create drawing' }, { status: 500 })
  }
}

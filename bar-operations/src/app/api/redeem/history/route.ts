import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''

    const records = await prisma.redeemRecord.findMany({
      where: searchTerm
        ? {
            OR: [
              { depositCode: { contains: searchTerm, mode: 'insensitive' } },
              { customerName: { contains: searchTerm } },
              { itemName: { contains: searchTerm } },
            ],
          }
        : {},
      include: {
        deposit: {
          select: { customerName: true },
        },
      },
      orderBy: {
        time: 'desc',
      },
    })

    const formattedRecords = records.map((record) => ({
      ...record,
      customerName: record.deposit?.customerName || '',
      time: record.time.toISOString().replace('T', ' ').slice(0, 16),
    }))

    return NextResponse.json({ success: true, data: formattedRecords })
  } catch (error) {
    console.error('Get redeem history error:', error)
    return NextResponse.json({ success: false, error: '获取核销历史失败' }, { status: 500 })
  }
}
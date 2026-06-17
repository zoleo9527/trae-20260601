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
              { itemName: { contains: searchTerm, mode: 'insensitive' } },
              { operator: { contains: searchTerm, mode: 'insensitive' } },
              {
                deposit: {
                  customerName: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            ],
          }
        : {},
      include: {
        deposit: {
          select: { customerName: true, id: true },
        },
      },
      orderBy: {
        time: 'desc',
      },
    })

    const formattedRecords = records.map((record) => ({
      ...record,
      customerName: record.deposit?.customerName || '',
      depositId: record.deposit?.id || '',
      time: record.time.toISOString().replace('T', ' ').slice(0, 16),
    }))

    return NextResponse.json({ success: true, data: formattedRecords })
  } catch (error) {
    console.error('Get redeem history error:', error)
    return NextResponse.json({ success: false, error: '获取核销历史失败' }, { status: 500 })
  }
}
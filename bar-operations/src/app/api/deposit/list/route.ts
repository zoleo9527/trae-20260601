import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const deposits = await prisma.deposit.findMany({
      where: {
        AND: [
          searchTerm
            ? {
                OR: [
                  { depositCode: { contains: searchTerm, mode: 'insensitive' } },
                  { customerName: { contains: searchTerm } },
                ],
              }
            : {},
          status !== 'all' ? { status: status.toUpperCase() as any } : {},
        ],
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedDeposits = deposits.map((deposit) => ({
      ...deposit,
      createdAt: deposit.createdAt.toISOString().replace('T', ' ').slice(0, 16),
      expiredAt: deposit.expiredAt.toISOString().slice(0, 10),
      customerPhone: deposit.customerPhone
        ? deposit.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        : null,
    }))

    return NextResponse.json({ success: true, data: formattedDeposits })
  } catch (error) {
    console.error('Get deposits error:', error)
    return NextResponse.json({ success: false, error: '获取寄存列表失败' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code') || ''

    if (!code) {
      return NextResponse.json({ success: false, error: '请提供寄存编号' }, { status: 400 })
    }

    const deposit = await prisma.deposit.findUnique({
      where: { depositCode: code.toUpperCase() },
      include: {
        items: true,
      },
    })

    if (!deposit) {
      return NextResponse.json({ success: false, error: '寄存记录不存在' }, { status: 404 })
    }

    const formattedDeposit = {
      ...deposit,
      createdAt: deposit.createdAt.toISOString().replace('T', ' ').slice(0, 16),
      expiredAt: deposit.expiredAt.toISOString().slice(0, 10),
      customerPhone: deposit.customerPhone
        ? deposit.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        : null,
    }

    return NextResponse.json({ success: true, data: formattedDeposit })
  } catch (error) {
    console.error('Search deposit error:', error)
    return NextResponse.json({ success: false, error: '搜索寄存失败' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const record = await prisma.redeemRecord.findUnique({
      where: { id },
      include: {
        deposit: {
          select: {
            customerName: true,
            customerPhone: true,
            id: true,
            depositCode: true,
            items: true,
          },
        },
      },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: '核销记录不存在' }, { status: 404 })
    }

    const depositItem = record.deposit?.items.find((item) => item.itemName === record.itemName)

    const formattedRecord = {
      ...record,
      customerName: record.deposit?.customerName || '',
      customerPhone: record.deposit?.customerPhone
        ? record.deposit.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        : null,
      depositId: record.deposit?.id || '',
      depositCode: record.deposit?.depositCode || '',
      category: depositItem?.category || '',
      time: record.time.toISOString().replace('T', ' ').slice(0, 16),
    }

    return NextResponse.json({ success: true, data: formattedRecord })
  } catch (error) {
    console.error('Get redeem detail error:', error)
    return NextResponse.json({ success: false, error: '获取核销详情失败' }, { status: 500 })
  }
}
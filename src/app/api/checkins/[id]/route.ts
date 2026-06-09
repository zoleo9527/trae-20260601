import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const checkin = await prisma.checkin.findUnique({
    where: { id: params.id },
    include: {
      schedule: {
        include: {
          patient: true,
          therapist: { include: { user: true } },
          equipment: true,
          assessment: true,
          statusLogs: { orderBy: { createdAt: 'asc' } },
        },
      },
      patient: true,
      checkinLogs: { orderBy: { createdAt: 'asc' } },
      attachments: { include: { uploader: true } },
    },
  })

  if (!checkin) {
    return NextResponse.json({ error: '未找到签到记录' }, { status: 404 })
  }

  return NextResponse.json(checkin)
}

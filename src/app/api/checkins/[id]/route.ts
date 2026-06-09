import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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
          statusLogs: { include: { operator: true }, orderBy: { createdAt: 'asc' } },
        },
      },
      patient: true,
      checkinLogs: { include: { operator: true }, orderBy: { createdAt: 'asc' } },
      attachments: { include: { uploader: true } },
    },
  })

  if (!checkin) {
    return NextResponse.json({ error: '未找到签到记录' }, { status: 404 })
  }

  return NextResponse.json(checkin)
}

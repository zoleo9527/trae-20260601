import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (date) {
    where.schedule = { scheduledDate: date }
  }

  const checkins = await prisma.checkin.findMany({
    where,
    include: {
      schedule: {
        include: {
          patient: true,
          therapist: { include: { user: true } },
          equipment: true,
          assessment: true,
        },
      },
      patient: true,
      checkinLogs: { include: { operator: true }, orderBy: { createdAt: 'asc' } },
      attachments: { include: { uploader: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(checkins)
}

export async function POST(request: Request) {
  const body = await request.json()

  const checkin = await prisma.checkin.create({
    data: {
      scheduleId: body.scheduleId,
      patientId: body.patientId,
      status: 'WAITING',
    },
  })

  await prisma.checkinLog.create({
    data: {
      checkinId: checkin.id,
      fromStatus: null,
      toStatus: 'WAITING',
      operatorId: body.operatorId || 'u3',
      remark: '创建签到记录',
    },
  })

  return NextResponse.json(checkin)
}

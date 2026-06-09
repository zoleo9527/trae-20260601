import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const therapistId = searchParams.get('therapistId')
  const date = searchParams.get('date')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (therapistId) where.therapistId = therapistId
  if (date) where.scheduledDate = date
  if (status) where.status = status

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      patient: true,
      therapist: { include: { user: true } },
      equipment: true,
      assessment: true,
      statusLogs: { orderBy: { createdAt: 'asc' } },
      checkins: { orderBy: { createdAt: 'desc' } },
      attachments: true,
      alerts: true,
    },
    orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
  })

  return NextResponse.json(schedules)
}

export async function POST(request: Request) {
  const body = await request.json()
  const schedule = await prisma.schedule.create({
    data: {
      patientId: body.patientId,
      therapistId: body.therapistId,
      treatmentType: body.treatmentType,
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
      duration: body.duration || 30,
      status: 'PENDING',
      equipmentId: body.equipmentId || null,
      assessmentId: body.assessmentId || null,
      remark: body.remark || null,
    },
  })

  await prisma.statusLog.create({
    data: {
      scheduleId: schedule.id,
      fromStatus: null,
      toStatus: 'PENDING',
      operatorId: body.operatorId || 'u3',
      operatorRole: body.operatorRole || 'RECEPTION',
      remark: '创建排班',
    },
  })

  return NextResponse.json(schedule)
}

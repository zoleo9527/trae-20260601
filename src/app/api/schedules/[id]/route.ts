import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      therapist: { include: { user: true } },
      equipment: true,
      assessment: { include: { patient: true } },
      statusLogs: { orderBy: { createdAt: 'asc' } },
      checkins: {
        include: {
          checkinLogs: { orderBy: { createdAt: 'asc' } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      attachments: { include: { uploader: true } },
      alerts: true,
    },
  })

  if (!schedule) {
    return NextResponse.json({ error: '未找到排班记录' }, { status: 404 })
  }

  return NextResponse.json(schedule)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  if (body.action === 'status') {
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id },
    })
    if (!schedule) {
      return NextResponse.json({ error: '未找到排班记录' }, { status: 404 })
    }

    const updated = await prisma.schedule.update({
      where: { id: params.id },
      data: { status: body.toStatus },
    })

    await prisma.statusLog.create({
      data: {
        scheduleId: params.id,
        fromStatus: schedule.status,
        toStatus: body.toStatus,
        operatorId: body.operatorId || 'u3',
        operatorRole: body.operatorRole || 'RECEPTION',
        remark: body.remark || null,
      },
    })

    if (body.toStatus === 'IN_TREATMENT') {
      const waitingCheckin = await prisma.checkin.findFirst({
        where: { scheduleId: params.id, status: 'CHECKED_IN' },
      })
      if (waitingCheckin) {
        await prisma.checkin.update({
          where: { id: waitingCheckin.id },
          data: { status: 'IN_TREATMENT' },
        })
        await prisma.checkinLog.create({
          data: {
            checkinId: waitingCheckin.id,
            fromStatus: 'CHECKED_IN',
            toStatus: 'IN_TREATMENT',
            operatorId: body.operatorId || 'u1',
            remark: '治疗师开始治疗',
          },
        })
      }
    }

    if (body.toStatus === 'COMPLETED') {
      const activeCheckin = await prisma.checkin.findFirst({
        where: { scheduleId: params.id, status: 'IN_TREATMENT' },
      })
      if (activeCheckin) {
        await prisma.checkin.update({
          where: { id: activeCheckin.id },
          data: { status: 'COMPLETED', completeTime: new Date() },
        })
        await prisma.checkinLog.create({
          data: {
            checkinId: activeCheckin.id,
            fromStatus: 'IN_TREATMENT',
            toStatus: 'COMPLETED',
            operatorId: body.operatorId || 'u3',
            remark: '治疗完成，消课确认',
          },
        })
      }
    }

    return NextResponse.json(updated)
  }

  const updated = await prisma.schedule.update({
    where: { id: params.id },
    data: {
      treatmentType: body.treatmentType,
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
      duration: body.duration,
      equipmentId: body.equipmentId,
      assessmentId: body.assessmentId,
      remark: body.remark,
    },
  })

  return NextResponse.json(updated)
}

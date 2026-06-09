import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const checkin = await prisma.checkin.findUnique({
    where: { id: params.id },
  })

  if (!checkin) {
    return NextResponse.json({ error: '未找到签到记录' }, { status: 404 })
  }

  if (body.action === 'checkin') {
    const updated = await prisma.checkin.update({
      where: { id: params.id },
      data: { checkinTime: new Date(), status: 'CHECKED_IN' },
    })

    await prisma.checkinLog.create({
      data: {
        checkinId: params.id,
        fromStatus: checkin.status,
        toStatus: 'CHECKED_IN',
        operatorId: body.operatorId || 'u3',
        remark: body.remark || '患者已到，办理签到',
      },
    })

    return NextResponse.json(updated)
  }

  if (body.action === 'complete') {
    const updated = await prisma.checkin.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        completeTime: new Date(),
        equipmentUsed: body.equipmentUsed || null,
        remark: body.remark || null,
      },
    })

    await prisma.checkinLog.create({
      data: {
        checkinId: params.id,
        fromStatus: checkin.status,
        toStatus: 'COMPLETED',
        operatorId: body.operatorId || 'u3',
        remark: body.remark || '治疗完成，消课确认',
      },
    })

    await prisma.schedule.updateMany({
      where: { id: checkin.scheduleId },
      data: { status: 'COMPLETED' },
    })

    await prisma.statusLog.create({
      data: {
        scheduleId: checkin.scheduleId,
        fromStatus: 'IN_TREATMENT',
        toStatus: 'COMPLETED',
        operatorId: body.operatorId || 'u3',
        operatorRole: 'RECEPTION',
        remark: '消课确认，治疗完成',
      },
    })

    return NextResponse.json(updated)
  }

  if (body.action === 'cancel') {
    const updated = await prisma.checkin.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    await prisma.checkinLog.create({
      data: {
        checkinId: params.id,
        fromStatus: checkin.status,
        toStatus: 'CANCELLED',
        operatorId: body.operatorId || 'u3',
        remark: body.remark || '取消签到',
      },
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resolved = searchParams.get('resolved')
  const type = searchParams.get('type')

  const where: Record<string, unknown> = {}
  if (resolved !== null) where.resolved = resolved === 'true'
  if (type) where.type = type

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      schedule: { include: { patient: true, therapist: { include: { user: true } } } },
      equipment: true,
      assessment: { include: { patient: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(alerts)
}

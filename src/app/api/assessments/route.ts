import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const assessments = await prisma.assessment.findMany({
    include: { patient: true, therapist: { include: { user: true } } },
    orderBy: { assessedAt: 'desc' },
  })
  return NextResponse.json(assessments)
}

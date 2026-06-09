import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const therapists = await prisma.therapist.findMany({
    include: { user: true },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(therapists)
}

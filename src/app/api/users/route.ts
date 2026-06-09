import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')

  const where = role ? { role } : {}

  const users = await prisma.user.findMany({
    where,
    include: { therapist: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(users)
}

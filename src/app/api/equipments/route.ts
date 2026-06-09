import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const equipments = await prisma.equipment.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(equipments)
}

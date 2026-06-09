import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const alert = await prisma.alert.update({
    where: { id: params.id },
    data: { resolved: true },
  })

  return NextResponse.json(alert)
}

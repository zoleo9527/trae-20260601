import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    include: { brand: { select: { id: true, name: true, storeName: true } } },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      brandId: u.brandId,
      brandName: u.brand?.name,
    }))
  );
}

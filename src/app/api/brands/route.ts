import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@/lib/types';

export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  let where = {};
  if (user.role === Role.BRAND_MANAGER && user.brandId) {
    where = { id: user.brandId };
  }

  const brands = await prisma.brand.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(brands);
}

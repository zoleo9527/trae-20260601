import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const id = parseInt(params.id);
  const report = await prisma.salesReport.findUnique({
    where: { id },
    include: {
      brand: true,
      submitter: { select: { id: true, name: true, role: true } },
      materialsChecker: { select: { id: true, name: true, role: true } },
      reviewer: { select: { id: true, name: true, role: true } },
      settler: { select: { id: true, name: true, role: true } },
      materials: {
        orderBy: { createdAt: 'asc' },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: '不存在' }, { status: 404 });
  }

  if (
    user.role === Role.BRAND_MANAGER &&
    user.brandId &&
    report.brandId !== user.brandId
  ) {
    return NextResponse.json({ error: '无权查看其他品牌的单据' }, { status: 403 });
  }

  return NextResponse.json(report);
}

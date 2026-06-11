import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ReportStatus, Role } from '@/lib/types';

export async function GET(request: Request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ReportStatus | null;
  const brandId = searchParams.get('brandId');
  const reportMonth = searchParams.get('reportMonth');
  const keyword = searchParams.get('keyword');
  const tab = searchParams.get('tab');

  const where: any = {};

  if (user.role === Role.BRAND_MANAGER && user.brandId) {
    where.brandId = user.brandId;
  } else if (brandId) {
    where.brandId = parseInt(brandId);
  }

  if (tab === 'abnormal') {
    where.status = {
      in: [ReportStatus.MATERIALS_MISSING, ReportStatus.REVIEW_REJECTED, ReportStatus.OVERDUE],
    };
  } else if (status) {
    where.status = status;
  }

  if (reportMonth) {
    where.reportMonth = reportMonth;
  }

  if (keyword) {
    where.OR = [
      { reportNo: { contains: keyword } },
      { brand: { name: { contains: keyword } } },
      { brand: { storeName: { contains: keyword } } },
    ];
  }

  const reports = await prisma.salesReport.findMany({
    where,
    include: {
      brand: true,
      submitter: { select: { id: true, name: true, role: true } },
      materials: true,
      _count: {
        select: {
          materials: { where: { received: false } },
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  const stats = await prisma.salesReport.groupBy({
    by: ['status'],
    where: user.role === Role.BRAND_MANAGER && user.brandId
      ? { brandId: user.brandId }
      : undefined,
    _count: { status: true },
    _sum: { salesAmount: true, netSettlement: true },
  });

  const abnormalCount = stats
    .filter((s) =>
      [ReportStatus.MATERIALS_MISSING, ReportStatus.REVIEW_REJECTED, ReportStatus.OVERDUE].includes(s.status)
    )
    .reduce((sum, s) => sum + s._count.status, 0);

  return NextResponse.json({
    reports,
    stats,
    abnormalCount,
    total: reports.length,
  });
}

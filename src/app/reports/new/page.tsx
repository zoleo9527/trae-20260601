import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role, ReportStatus } from '@/lib/types';
import ReportFormClient from './ReportFormClient';

export default async function ReportFormPage({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('currentUser');

  if (!userCookie?.value) {
    redirect('/login');
  }

  let currentUser: any = null;
  try {
    currentUser = JSON.parse(userCookie.value);
  } catch {
    redirect('/login');
  }

  if (currentUser.role !== Role.BRAND_MANAGER) {
    redirect('/reports');
  }

  let initialData: any = null;
  const editId = searchParams.edit ? parseInt(searchParams.edit) : null;

  if (editId) {
    const report = await prisma.salesReport.findUnique({
      where: { id: editId },
      include: { materials: true },
    });
    if (
      report &&
      report.brandId === currentUser.brandId &&
      [
        ReportStatus.DRAFT,
        ReportStatus.MATERIALS_MISSING,
        ReportStatus.REVIEW_REJECTED,
        ReportStatus.OVERDUE,
      ].includes(report.status as ReportStatus)
    ) {
      initialData = report;
    } else {
      redirect('/reports');
    }
  }

  return (
    <ReportFormClient editId={editId} initialData={initialData} />
  );
}

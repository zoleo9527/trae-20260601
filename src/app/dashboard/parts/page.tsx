import DashboardShell from '../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, PartRequestStatus } from '@/lib/enums';
import { PART_REQUEST_STATUS_LABELS, formatDateTime, REPAIR_STATUS_LABELS, REPAIR_STATUS_COLORS } from '@/lib/status';
import PartsApprovalClient from './components/PartsApprovalClient';

export default async function PartsAdminDashboardPage() {
  const user = await requireRole([Role.PARTS_ADMIN]);

  const [pending, approved, allRequests, lowStock, stats] = await Promise.all([
    prisma.partRequest.findMany({
      where: { status: PartRequestStatus.PENDING },
      include: {
        requestedBy: true,
        repairOrder: { include: { customer: true, assignedTo: true } },
        items: { include: { part: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partRequest.findMany({
      where: { status: PartRequestStatus.APPROVED },
      include: {
        requestedBy: true,
        repairOrder: { include: { customer: true } },
        items: { include: { part: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partRequest.findMany({
      where: { status: { in: [PartRequestStatus.DELIVERED, PartRequestStatus.REJECTED] } },
      include: {
        requestedBy: true,
        approvedBy: true,
        repairOrder: { include: { customer: true } },
        items: { include: { part: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.part.findMany({
      where: { stock: { lte: 10 } },
      orderBy: { stock: 'asc' },
    }),
    {
      pending: prisma.partRequest.count({ where: { status: PartRequestStatus.PENDING } }),
      total: prisma.partRequest.count(),
      delivered: prisma.partRequest.count({ where: { status: PartRequestStatus.DELIVERED } }),
      lowStock: prisma.part.count({ where: { stock: { lte: 10 } } }),
    },
  ]);

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="card bg-yellow-50 border-yellow-100">
            <div className="text-sm text-yellow-700">待审批申请</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
          </div>
          <div className="card bg-green-50 border-green-100">
            <div className="text-sm text-green-700">本月已出库</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{stats.delivered}</div>
          </div>
          <div className="card bg-red-50 border-red-100">
            <div className="text-sm text-red-700">库存预警</div>
            <div className="text-3xl font-bold text-red-900 mt-2">{stats.lowStock}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">累计申请</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
        </div>

        <PartsApprovalClient pending={pending} approved={approved} allRequests={allRequests} lowStock={lowStock} />
      </div>
    </DashboardShell>
  );
}

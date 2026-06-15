import Link from 'next/link';
import DashboardShell from '../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, RepairStatus } from '@/lib/enums';
import {
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  formatDateTime,
} from '@/lib/status';

export default async function CsDashboardPage() {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const [pendingOrders, inProgressOrders, allOrders, stats] = await Promise.all([
    prisma.repairOrder.findMany({
      where: { status: RepairStatus.PENDING },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.repairOrder.findMany({
      where: {
        status: {
          in: [
            RepairStatus.ACCEPTED,
            RepairStatus.ASSIGNED,
            RepairStatus.APPOINTMENT_SCHEDULED,
            RepairStatus.ENGINEER_DISPATCHED,
            RepairStatus.DIAGNOSIS_DONE,
            RepairStatus.PARTS_REQUESTED,
            RepairStatus.PARTS_DELIVERED,
            RepairStatus.REPAIR_IN_PROGRESS,
            RepairStatus.REPAIR_COMPLETED,
          ],
        },
      },
      include: { customer: true, assignedTo: true },
      orderBy: { updatedAt: 'desc' },
      take: 15,
    }),
    prisma.repairOrder.findMany({
      include: { customer: true, assignedTo: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    {
      total: prisma.repairOrder.count(),
      pending: prisma.repairOrder.count({ where: { status: RepairStatus.PENDING } }),
      inProgress: prisma.repairOrder.count({
        where: {
          status: {
            in: [
              RepairStatus.ACCEPTED,
              RepairStatus.ASSIGNED,
              RepairStatus.APPOINTMENT_SCHEDULED,
              RepairStatus.ENGINEER_DISPATCHED,
              RepairStatus.DIAGNOSIS_DONE,
              RepairStatus.PARTS_REQUESTED,
              RepairStatus.PARTS_DELIVERED,
              RepairStatus.REPAIR_IN_PROGRESS,
            ],
          },
        },
      }),
      completed: prisma.repairOrder.count({
        where: { status: { in: [RepairStatus.REPAIR_COMPLETED, RepairStatus.CUSTOMER_CONFIRMED, RepairStatus.CLOSED] } },
      }),
    },
  ]);

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-500">全部工单</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="card bg-yellow-50 border-yellow-100">
            <div className="text-sm text-yellow-700">待受理</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
          </div>
          <div className="card bg-blue-50 border-blue-100">
            <div className="text-sm text-blue-700">处理中</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{stats.inProgress}</div>
          </div>
          <div className="card bg-green-50 border-green-100">
            <div className="text-sm text-green-700">已完成</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{stats.completed}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard/cs/new" className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建报修单
          </Link>
          <Link href="/dashboard/cs/appointments" className="btn-secondary flex items-center gap-2">
            查看预约安排
          </Link>
        </div>

        {pendingOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              待受理工单 ({pendingOrders.length})
            </h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单号</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">客户</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">家电</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">故障描述</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">优先级</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">受理时间</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">{order.orderNo}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {order.applianceBrand} {order.applianceType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {order.faultDescription}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${PRIORITY_COLORS[order.priority]}`}>
                          {PRIORITY_LABELS[order.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/cs/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          受理 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">全部工单</h2>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单号</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">客户</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">家电</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">处理工程师</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{order.orderNo}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.applianceBrand} {order.applianceType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.assignedTo?.name || '未分配'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${REPAIR_STATUS_COLORS[order.status]}`}>
                        {REPAIR_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/cs/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

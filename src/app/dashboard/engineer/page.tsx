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
  formatDate,
} from '@/lib/status';
import Link from 'next/link';

export default async function EngineerDashboardPage() {
  const user = await requireRole([Role.ENGINEER]);

  const [myOrders, toHandle, inProgress, todayAppointments, stats] = await Promise.all([
    prisma.repairOrder.findMany({
      where: { assignedToId: user.id },
      include: { customer: true, appointments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.repairOrder.findMany({
      where: {
        assignedToId: user.id,
        status: {
          in: [RepairStatus.ASSIGNED, RepairStatus.APPOINTMENT_SCHEDULED, RepairStatus.PARTS_DELIVERED],
        },
      },
      include: { customer: true, appointments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { priority: 'asc' },
    }),
    prisma.repairOrder.findMany({
      where: {
        assignedToId: user.id,
        status: { in: [RepairStatus.ENGINEER_DISPATCHED, RepairStatus.DIAGNOSIS_DONE, RepairStatus.REPAIR_IN_PROGRESS] },
      },
      include: { customer: true },
    }),
    prisma.appointment.findMany({
      where: {
        engineerId: user.id,
        scheduledDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
      include: { repairOrder: { include: { customer: true } } },
      orderBy: { scheduledDate: 'asc' },
    }),
    {
      total: prisma.repairOrder.count({ where: { assignedToId: user.id } }),
      pending: prisma.repairOrder.count({
        where: {
          assignedToId: user.id,
          status: { in: [RepairStatus.ASSIGNED, RepairStatus.APPOINTMENT_SCHEDULED] },
        },
      }),
      completed: prisma.repairOrder.count({
        where: {
          assignedToId: user.id,
          status: { in: [RepairStatus.REPAIR_COMPLETED, RepairStatus.CUSTOMER_CONFIRMED, RepairStatus.CLOSED] },
        },
      }),
    },
  ]);

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-500">我的工单总数</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="card bg-yellow-50 border-yellow-100">
            <div className="text-sm text-yellow-700">待处理</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
          </div>
          <div className="card bg-blue-50 border-blue-100">
            <div className="text-sm text-blue-700">进行中</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{inProgress.length}</div>
          </div>
          <div className="card bg-green-50 border-green-100">
            <div className="text-sm text-green-700">已完成</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{stats.completed}</div>
          </div>
        </div>

        {todayAppointments.length > 0 && (
          <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              今日上门安排
            </h3>
            <div className="space-y-2">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-blue-600">{apt.timeSlot}</div>
                    <div>
                      <div className="font-medium text-gray-900">{apt.repairOrder.customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {apt.repairOrder.customer.address}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/engineer/orders/${apt.repairOrderId}`}
                    className="btn-primary text-sm"
                  >
                    前往处理
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {toHandle.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              待处理工单 ({toHandle.length})
            </h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单号</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">客户</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">家电</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">故障</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">优先级</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">预约</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {toHandle.map((order) => (
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.appointments[0]
                          ? `${formatDate(order.appointments[0].scheduledDate)} ${order.appointments[0].timeSlot}`
                          : '未预约'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${REPAIR_STATUS_COLORS[order.status]}`}>
                          {REPAIR_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/engineer/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          处理 →
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">我的全部工单</h2>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单号</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">客户</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">家电</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">更新时间</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      暂无工单
                    </td>
                  </tr>
                ) : (
                  myOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">{order.orderNo}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {order.applianceBrand} {order.applianceType}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${REPAIR_STATUS_COLORS[order.status]}`}>
                          {REPAIR_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(order.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/engineer/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          查看
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

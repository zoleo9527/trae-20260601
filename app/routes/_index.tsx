import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { statusLabels, roleLabels } from "~/utils/booking";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
  return [{ title: "首页 - 洗浴中心管理系统" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, pendingDeposits, openExceptions, recentBookings] = await Promise.all([
    prisma.booking.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    prisma.deposit.count({
      where: { status: "PENDING" },
    }),
    prisma.exception.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        handTag: true,
        createdBy: { select: { name: true, role: true } },
      },
    }),
  ]);

  return json({
    user,
    stats: {
      todayBookings,
      pendingDeposits,
      openExceptions,
    },
    recentBookings,
  });
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CHECKED_IN: "bg-green-100 text-green-800",
    IN_SERVICE: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    RESCHEDULED: "bg-orange-100 text-orange-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  
  return (
    <span className={`badge ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {statusLabels[status as keyof typeof statusLabels] || status}
    </span>
  );
}

export default function Index() {
  const { user, stats, recentBookings } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          欢迎回来，{user.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {roleLabels[user.role]} · {format(new Date(), "yyyy年MM月dd日 EEEE")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">今日开台</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">待核验押金</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingDeposits}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">待处理异常</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.openExceptions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">快捷操作</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link
              to="/bookings/new"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900">新开台</span>
            </Link>
            <Link
              to="/bookings"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900">查看订单</span>
            </Link>
            <Link
              to="/deposits"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900">押金核验</span>
            </Link>
            <Link
              to="/exceptions"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900">异常处理</span>
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">最近订单</h3>
            <Link to="/bookings" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentBookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无订单</div>
            ) : (
              recentBookings.map((booking: any) => (
                <div key={booking.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {booking.bookingNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customer?.name} · {booking.serviceType}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        手牌：{booking.handTag?.tagNumber || "未分配"} · {booking.createdBy?.name}
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

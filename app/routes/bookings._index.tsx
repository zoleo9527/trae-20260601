import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { statusLabels } from "~/utils/booking";
import { format } from "date-fns";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "开台管理 - 洗浴中心管理系统" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      handTag: true,
      technician: true,
      createdBy: { select: { name: true } },
    },
    take: 50,
  });

  return json({ bookings, user, currentStatus: status || "ALL" });
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

export default function BookingsIndex() {
  const { bookings, user, currentStatus } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilters = [
    { value: "ALL", label: "全部" },
    { value: "PENDING", label: "待确认" },
    { value: "CONFIRMED", label: "已确认" },
    { value: "CHECKED_IN", label: "已入场" },
    { value: "IN_SERVICE", label: "服务中" },
    { value: "COMPLETED", label: "已完成" },
    { value: "RESCHEDULED", label: "已改期" },
    { value: "REJECTED", label: "已驳回" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">开台管理</h1>
        <Link to="/bookings/new" className="btn-primary">
          新开台
        </Link>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  if (filter.value === "ALL") {
                    params.delete("status");
                  } else {
                    params.set("status", filter.value);
                  }
                  setSearchParams(params);
                }}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  currentStatus === filter.value
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  服务类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  手牌/技师
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  押金
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  开台人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-primary-600">
                        {booking.bookingNumber}
                      </div>
                      {booking.isException && (
                        <span className="text-xs text-red-600">有异常</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customer.phone || "无电话"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.serviceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.handTag?.tagNumber || "未分配"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.technician?.name || "未分配"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{Number(booking.depositAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.createdBy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.createdAt), "MM-dd HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        详情
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
  );
}

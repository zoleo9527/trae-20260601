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

  const isReceptionist = user.role === "RECEPTIONIST";
  const isSupervisor = user.role === "FLOOR_SUPERVISOR";
  const isFinance = user.role === "FINANCE";
  const isAdmin = user.role === "ADMIN";
  const canCreateBooking = isReceptionist || isSupervisor || isAdmin;
  const canReject = isSupervisor || isAdmin;
  const canSupplement = isReceptionist || isSupervisor || isAdmin;
  const canHandleException = isSupervisor || isAdmin;
  const isActiveStatus = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE"];

  const pageTitle = isFinance ? "订单查询" : isSupervisor ? "订单管理" : "开台管理";
  const primaryButtonText = isReceptionist ? "快速开台" : "新开台";

  const receptionistFilters = [
    { value: "ALL", label: "全部订单" },
    { value: "CONFIRMED", label: "待入场" },
    { value: "IN_SERVICE", label: "服务中" },
    { value: "COMPLETED", label: "已完成" },
  ];

  const supervisorFilters = [
    { value: "ALL", label: "全部" },
    { value: "OPEN", label: "有异常" },
    { value: "CONFIRMED", label: "待处理" },
    { value: "COMPLETED", label: "已完成" },
    { value: "REJECTED", label: "已驳回" },
  ];

  const financeFilters = [
    { value: "ALL", label: "全部" },
    { value: "PENDING", label: "待核验押金" },
    { value: "VERIFIED", label: "已核验" },
    { value: "COMPLETED", label: "已完成" },
  ];

  const statusFilters = isFinance ? financeFilters : isSupervisor ? supervisorFilters : receptionistFilters;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-500 mt-1">
            {isReceptionist && "负责客户开台登记、信息补录"}
            {isSupervisor && "负责订单审核、异常处理、订单驳回"}
            {isFinance && "查询订单记录，核对押金信息"}
            {isAdmin && "管理所有订单和操作记录"}
          </p>
        </div>
        <div className="flex space-x-3">
          {isSupervisor && (
            <Link to="/exceptions" className="btn-secondary">
              异常处理
            </Link>
          )}
          {canCreateBooking && (
            <Link to="/bookings/new" className="btn-primary">
              {primaryButtonText}
            </Link>
          )}
        </div>
      </div>

      {isReceptionist && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 border-2 border-primary-200 bg-primary-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600">今日开台</p>
                <p className="text-2xl font-bold text-primary-700">
                  {bookings.filter(b => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(b.createdAt) >= today;
                  }).length}
                </p>
              </div>
              <Link to="/bookings/new" className="btn-primary text-sm">
                + 开台
              </Link>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">服务中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === "IN_SERVICE").length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待补录</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => isActiveStatus.includes(b.status) && !b.notes).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSupervisor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 border-2 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">待处理异常</p>
                <p className="text-2xl font-bold text-red-700">
                  {bookings.filter(b => b.isException).length}
                </p>
              </div>
              <Link to="/exceptions" className="btn-danger text-sm">
                处理
              </Link>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审核订单</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => ["PENDING", "CONFIRMED"].includes(b.status)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日已驳回</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return b.status === "REJECTED" && new Date(b.createdAt) >= today;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {!isFinance && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    押金
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                {isFinance && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    押金状态
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  开台人
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={isFinance ? 8 : 8} className="px-6 py-12 text-center text-gray-500">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className={`hover:bg-gray-50 ${booking.isException ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-primary-600">
                        {booking.bookingNumber}
                      </div>
                      {booking.isException && (
                        <span className="text-xs text-red-600 font-medium">⚠ 有异常</span>
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
                    {!isFinance && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{Number(booking.depositAmount).toFixed(2)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} />
                    </td>
                    {isFinance && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          booking.depositStatus === "VERIFIED" ? "bg-green-100 text-green-700" :
                          booking.depositStatus === "REFUNDED" ? "bg-gray-100 text-gray-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {booking.depositStatus === "VERIFIED" ? "已核验" :
                           booking.depositStatus === "REFUNDED" ? "已退还" : "待核验"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.createdBy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {isReceptionist && isActiveStatus.includes(booking.status) && (
                        <Link
                          to={`/bookings/${booking.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          补录
                        </Link>
                      )}
                      {isSupervisor && booking.isException && (
                        <Link
                          to="/exceptions"
                          className="text-red-600 hover:text-red-900"
                        >
                          处理异常
                        </Link>
                      )}
                      {isSupervisor && isActiveStatus.includes(booking.status) && !booking.isException && (
                        <Link
                          to={`/bookings/${booking.id}`}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          驳回
                        </Link>
                      )}
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {isFinance ? "查看" : "详情"}
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

import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { depositStatusLabels, roleLabels } from "~/utils/booking";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
  return [{ title: "押金核验 - 洗浴中心管理系统" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireRole(request, ["FINANCE", "ADMIN"]);

  const deposits = await prisma.deposit.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          customer: { select: { name: true, phone: true } },
        },
      },
      receivedBy: { select: { name: true, role: true } },
      verifiedBy: { select: { name: true, role: true } },
    },
    take: 100,
  });

  const stats = {
    pending: deposits.filter(d => d.status === "PENDING").length,
    verified: deposits.filter(d => d.status === "VERIFIED").length,
    refunded: deposits.filter(d => d.status === "REFUNDED").length,
    totalAmount: deposits.reduce((sum, d) => sum + Number(d.amount), 0),
  };

  return json({ deposits, user, stats });
};

function DepositStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    VERIFIED: "bg-green-100 text-green-800",
    REFUNDED: "bg-gray-100 text-gray-800",
    CONFISCATED: "bg-red-100 text-red-800",
  };
  
  return (
    <span className={`badge ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {depositStatusLabels[status as keyof typeof depositStatusLabels] || status}
    </span>
  );
}

export default function DepositsIndex() {
  const { deposits, stats } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">押金核验</h1>
        <p className="text-gray-500 mt-1">财务人员核验前台收取的押金</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">待核验</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已核验</div>
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已退还</div>
          <div className="text-2xl font-bold text-gray-600">{stats.refunded}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">总金额</div>
          <div className="text-2xl font-bold text-primary-600">¥{stats.totalAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">押金记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支付方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  收款人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  核验人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    暂无押金记录
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/bookings/${deposit.booking.id}`}
                        className="font-medium text-primary-600 hover:text-primary-900"
                      >
                        {deposit.booking.bookingNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {deposit.booking.customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {deposit.booking.customer.phone || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ¥{Number(deposit.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DepositStatusBadge status={deposit.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.receivedBy.name}
                      <span className="text-gray-400 ml-1">
                        ({roleLabels[deposit.receivedBy.role]})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.verifiedBy ? (
                        <>
                          {deposit.verifiedBy.name}
                          <span className="text-gray-400 ml-1">
                            ({roleLabels[deposit.verifiedBy.role]})
                          </span>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(deposit.createdAt), "MM-dd HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/bookings/${deposit.booking.id}`}
                        className="text-primary-600 hover:text-primary-900"
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
  );
}

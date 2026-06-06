import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Layout } from "~/components/Layout";
import { requireUser } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import clsx from "clsx";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const keyRecords = await db.keyRecord.findMany({
    include: {
      dorm: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return json({ user, keyRecords });
}

export default function KeysPage() {
  const { user, keyRecords } = useLoaderData<typeof loader>();

  return (
    <Layout user={user}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">钥匙台账</h1>
          <p className="text-gray-500 mt-1">查看和管理宿舍钥匙借用情况</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    钥匙编号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    对应宿舍
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    借用人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    借出时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    归还时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {keyRecords.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key.keyNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {key.dorm.building} {key.dorm.roomNumber}室
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                          key.status === "borrowed"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        )}
                      >
                        {key.status === "borrowed" ? "已借出" : "在库"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {key.borrower || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {key.borrowedAt
                        ? new Date(key.borrowedAt).toLocaleString("zh-CN")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {key.returnedAt
                        ? new Date(key.returnedAt).toLocaleString("zh-CN")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {key.remarks || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

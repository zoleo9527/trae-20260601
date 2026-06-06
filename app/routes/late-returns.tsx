import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Layout } from "~/components/Layout";
import { requireUser } from "~/utils/session.server";
import { db } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const lateReturns = await db.lateReturnRecord.findMany({
    include: {
      student: {
        include: {
          dorm: true,
        },
      },
    },
    orderBy: [{ date: "desc" }],
  });

  return json({ user, lateReturns });
}

export default function LateReturnsPage() {
  const { user, lateReturns } = useLoaderData<typeof loader>();

  return (
    <Layout user={user}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">晚归记录</h1>
          <p className="text-gray-500 mt-1">查看所有学生的晚归记录</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学生姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    宿舍
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    原因
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    记录人
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lateReturns.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(record.date).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        {record.time}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.student.dorm
                        ? `${record.student.dorm.building} ${record.student.dorm.roomNumber}室`
                        : "未分配"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {record.reason || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.recordedBy || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lateReturns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无晚归记录</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

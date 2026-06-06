import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Layout } from "~/components/Layout";
import { requireUser } from "~/utils/session.server";
import { getAllInspections, getInspectionStats, getInspectionCount } from "~/utils/dataService";
import { STATUS_LABELS, STATUS_COLORS, GRADE_LABELS } from "~/utils/types";
import clsx from "clsx";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "all";

  const inspections = await getAllInspections(statusFilter);
  const statMap = await getInspectionStats();
  const totalCount = await getInspectionCount();

  return json({ user, inspections, statMap, totalCount, statusFilter });
}

export default function IndexPage() {
  const { user, inspections, statMap, totalCount, statusFilter } = useLoaderData<typeof loader>();

  const filterOptions = [
    { value: "all", label: "全部" },
    { value: "PENDING_INSPECTION", label: "待检查" },
    { value: "NEEDS_RECTIFICATION", label: "需整改" },
    { value: "RECTIFIED", label: "待复查" },
    { value: "RECTIFICATION_REJECTED", label: "整改驳回" },
    { value: "MAINTENANCE_ASSIGNED", label: "维修中" },
    { value: "PASSED", label: "已通过" },
    { value: "CLOSED", label: "已关闭" },
  ];

  const isOverdue = (deadline: string | null | undefined) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <Layout user={user}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">卫生检查管理</h1>
          <p className="text-gray-500 mt-1">查看和管理所有宿舍卫生检查单</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">检查单总数</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">需整改</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{statMap["NEEDS_RECTIFICATION"] || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">待复查</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{statMap["RECTIFIED"] || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">异常单</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {(statMap["RECTIFICATION_REJECTED"] || 0) + (statMap["MAINTENANCE_ASSIGNED"] || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">检查单列表</h2>
              <div className="flex gap-2 flex-wrap">
                {filterOptions.map((opt) => (
                  <Link
                    key={opt.value}
                    to={opt.value === "all" ? "/" : `/?status=${opt.value}`}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded-lg transition-colors",
                      statusFilter === opt.value
                        ? "bg-primary-100 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {opt.label}
                    {opt.value !== "all" && statMap[opt.value] !== undefined && (
                      <span className="ml-1.5 text-xs">({statMap[opt.value]})</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    宿舍
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    评级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    整改期限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    检查员
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    异常标签
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inspections.map((inspection: any) => {
                  const overdue = isOverdue(inspection.deadline);
                  const hasRejection = inspection.rectifications.some((r: any) => r.isRejected);
                  const hasMissingMaterials = inspection.items.some(
                    (i: any) => i.issue?.includes("缺材料")
                  );

                  return (
                    <tr key={inspection.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {inspection.dorm.building} {inspection.dorm.roomNumber}室
                        </div>
                        <div className="text-sm text-gray-500">
                          {inspection.dorm.floor}层 · {inspection.dorm.capacity}人间
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            STATUS_COLORS[inspection.status]
                          )}
                        >
                          {STATUS_LABELS[inspection.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inspection.overallGrade ? (
                          <span className="text-sm text-gray-700">
                            {GRADE_LABELS[inspection.overallGrade]}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inspection.deadline ? (
                          <div>
                            <span
                              className={clsx(
                                "text-sm",
                                overdue ? "text-red-600 font-medium" : "text-gray-700"
                              )}
                            >
                              {new Date(inspection.deadline).toLocaleDateString("zh-CN")}
                            </span>
                            {overdue && (
                              <div className="text-xs text-red-500 mt-0.5">已超时</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {inspection.inspector?.name || "待分配"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1.5 flex-wrap">
                          {overdue && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              超时
                            </span>
                          )}
                          {hasRejection && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                              复核不通过
                            </span>
                          )}
                          {hasMissingMaterials && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              缺材料
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/inspections/${inspection.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          查看详情 →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {inspections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无检查单数据</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

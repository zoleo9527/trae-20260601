import { useEffect, useState } from "react";
import { useReviewStore } from "@/store/useReviewStore";
import { formatDateTime } from "@/utils/date";
import { ROLE_MAP, OPERATION_TYPE_MAP } from "@/utils/status";
import type { OperationLog, UserRole, OperationType } from "@/types";

export function OperationLogs() {
  const { reviews, fetchReviews, getAllLogs } = useReviewStore();
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [filterType, setFilterType] = useState<OperationType | "">("");

  useEffect(() => {
    if (reviews.length === 0) {
      fetchReviews();
    }
  }, [fetchReviews, reviews.length]);

  useEffect(() => {
    let allLogs = getAllLogs();
    if (filterRole) {
      allLogs = allLogs.filter((log) => log.operatorRole === filterRole);
    }
    if (filterType) {
      allLogs = allLogs.filter((log) => log.operationType === filterType);
    }
    setLogs(allLogs);
  }, [getAllLogs, filterRole, filterType]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 mb-1">操作日志</h1>
        <p className="text-gray-500">全链路操作记录查询，共 {logs.length} 条记录</p>
      </div>

      <div className="bg-white rounded-lg border shadow-card p-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作角色</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | "")}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 min-w-[150px]"
            >
              <option value="">全部角色</option>
              {Object.entries(ROLE_MAP).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as OperationType | "")}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 min-w-[150px]"
            >
              <option value="">全部类型</option>
              {Object.entries(OPERATION_TYPE_MAP).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-card p-6">
        <div className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs text-gray-400 whitespace-nowrap w-36 font-mono">
                {formatDateTime(log.createdAt)}
              </div>
              <div className="w-24">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  log.targetType === "review"
                    ? "bg-navy-100 text-navy-700"
                    : "bg-purple-100 text-purple-700"
                }`}>
                  {log.targetType === "review" ? "复盘单" : "异常订单"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {OPERATION_TYPE_MAP[log.operationType].label}
                  </span>
                  <span className={ROLE_MAP[log.operatorRole].color}>
                    {log.operator}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({ROLE_MAP[log.operatorRole].label})
                  </span>
                </div>
                <p className="text-sm text-gray-600">{log.operationDesc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

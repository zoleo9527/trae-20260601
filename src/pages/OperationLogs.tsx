import { useEffect, useState } from "react";
import { Clock, Filter, User } from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { Timeline } from "@/components/common/Timeline";
import { ROLE_MAP, OPERATION_TYPE_MAP } from "@/utils/status";
import type { OperationType, UserRole } from "@/types";

export function OperationLogs() {
  const { reviews, fetchReviews, getAllLogs } = useReviewStore();
  const [operatorRole, setOperatorRole] = useState<UserRole | "">("");
  const [operationType, setOperationType] = useState<OperationType | "">("");

  useEffect(() => {
    if (reviews.length === 0) {
      fetchReviews();
    }
  }, [reviews.length, fetchReviews]);

  const allLogs = getAllLogs();

  const filteredLogs = allLogs.filter((log) => {
    if (operatorRole && log.operatorRole !== operatorRole) return false;
    if (operationType && log.operationType !== operationType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-navy-900">操作日志</h1>
        <p className="text-gray-500 mt-1">查看全链路操作记录</p>
      </div>

      <div className="bg-white rounded-lg border shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-500">筛选：</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <select
              value={operatorRole}
              onChange={(e) => setOperatorRole(e.target.value as UserRole | "")}
              className="text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-navy-500"
            >
              <option value="">全部角色</option>
              <option value="assistant">主播助理</option>
              <option value="controller">场控</option>
              <option value="aftersales">售后组长</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value as OperationType | "")}
              className="text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-navy-500"
            >
              <option value="">全部操作</option>
              {(Object.keys(OPERATION_TYPE_MAP) as OperationType[]).map((type) => (
                <option key={type} value={type}>
                  {OPERATION_TYPE_MAP[type].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-card p-6">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Clock className="mx-auto mb-2 text-gray-300" size={32} />
            暂无操作记录
          </div>
        ) : (
          <Timeline logs={filteredLogs} />
        )}
      </div>
    </div>
  );
}

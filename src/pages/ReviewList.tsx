import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, AlertTriangle, Clock, X, XCircle } from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RejectBadge } from "@/components/common/RejectBadge";
import { SupplementBadge } from "@/components/common/SupplementBadge";
import { formatDateTime, formatNumber } from "@/utils/date";
import { REVIEW_STATUS_MAP, ROLE_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";
import type { ReviewStatus, UserRole } from "@/types";

export function ReviewList() {
  const navigate = useNavigate();
  const { reviews, filters, fetchReviews, getFilteredReviews, setFilters, resetFilters } = useReviewStore();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (reviews.length === 0) {
      fetchReviews();
    }
  }, [fetchReviews, reviews.length]);

  const filteredReviews = getFilteredReviews();

  const activeFilters = [
    filters.todayUpdated && { key: "todayUpdated", label: "今日更新", icon: Clock },
    filters.isOverdue && { key: "isOverdue", label: "超时未处理", icon: AlertTriangle },
    filters.hasReject && { key: "hasReject", label: "已驳回", icon: XCircle },
    filters.hasSupplement && { key: "hasSupplement", label: "需补录", icon: XCircle },
    filters.currentHandler && { key: "currentHandler", label: `${ROLE_MAP[filters.currentHandler]?.label}处理`, icon: null },
    filters.status && { key: "status", label: REVIEW_STATUS_MAP[filters.status]?.label, icon: null },
  ].filter(Boolean) as { key: string; label: string; icon: any }[];

  const removeFilter = (key: string) => {
    if (key === "todayUpdated") setFilters({ todayUpdated: undefined });
    else if (key === "isOverdue") setFilters({ isOverdue: undefined });
    else if (key === "hasReject") setFilters({ hasReject: undefined });
    else if (key === "hasSupplement") setFilters({ hasSupplement: undefined });
    else if (key === "currentHandler") setFilters({ currentHandler: undefined });
    else if (key === "status") setFilters({ status: undefined });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ keyword: e.target.value });
  };

  const handleStatusChange = (status: ReviewStatus | "") => {
    setFilters({ status: status || undefined });
  };

  const handleHandlerChange = (handler: UserRole | "") => {
    setFilters({ currentHandler: handler || undefined });
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">场次复盘</h1>
          <p className="text-gray-500">共 {filteredReviews.length} 条记录</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-card mb-6">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索场次号、直播标题、主播名称..."
                value={filters.keyword || ""}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              showFilters ? "bg-navy-100 text-navy-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Filter size={18} />
            筛选
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">当前筛选：</span>
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-navy-100 text-navy-700 text-sm rounded-full"
              >
                {f.icon && <f.icon size={14} />}
                {f.label}
                <button
                  onClick={() => removeFilter(f.key)}
                  className="ml-1 hover:text-navy-900"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 ml-2"
            >
              清除全部
            </button>
          </div>
        )}

        {showFilters && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={filters.status || ""}
                  onChange={(e) => handleStatusChange(e.target.value as ReviewStatus | "")}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                >
                  <option value="">全部状态</option>
                  {Object.entries(REVIEW_STATUS_MAP).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前处理角色</label>
                <select
                  value={filters.currentHandler || ""}
                  onChange={(e) => handleHandlerChange(e.target.value as UserRole | "")}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                >
                  <option value="">全部角色</option>
                  {Object.entries(ROLE_MAP).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-4 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.todayUpdated || false}
                    onChange={(e) => setFilters({ todayUpdated: e.target.checked })}
                    className="rounded text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm text-gray-700">仅显示今日更新</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.isOverdue || false}
                    onChange={(e) => setFilters({ isOverdue: e.target.checked })}
                    className="rounded text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm text-gray-700">仅显示超时</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.hasReject || false}
                    onChange={(e) => setFilters({ hasReject: e.target.checked })}
                    className="rounded text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm text-gray-700">仅显示驳回</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.hasSupplement || false}
                    onChange={(e) => setFilters({ hasSupplement: e.target.checked })}
                    className="rounded text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm text-gray-700">仅显示需补录</span>
                </label>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">场次号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">直播标题</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">主播</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GMV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">异常订单</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前处理</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredReviews.map((review) => (
              <tr
                key={review.id}
                onClick={() => navigate(`/reviews/${review.id}`)}
                className={cn(
                  "cursor-pointer transition-colors",
                  review.rejectReason
                    ? "bg-red-50/50 hover:bg-red-50"
                    : review.supplementRequired
                    ? "bg-orange-50/50 hover:bg-orange-50"
                    : review.isOverdue
                    ? "bg-red-50/30 hover:bg-red-50/50"
                    : "hover:bg-gray-50"
                )}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-navy-600">{review.sessionNo}</span>
                    {review.isOverdue && <AlertTriangle size={14} className="text-status-error" />}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{review.liveTitle}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600">{review.anchorName}</td>
                <td className="px-4 py-4 text-gray-600">¥{formatNumber(review.gmv)}</td>
                <td className="px-4 py-4">
                  <span className="font-medium text-navy-600">{review.abnormalOrders.length}</span> 单
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={review.status} type="review" />
                    {review.rejectReason && <RejectBadge />}
                    {review.supplementRequired && <SupplementBadge />}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={cn("font-medium", ROLE_MAP[review.currentHandler].color)}>
                    {ROLE_MAP[review.currentHandler].label}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-500 text-sm">{formatDateTime(review.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

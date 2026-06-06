import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, FileText, User } from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RejectBadge } from "@/components/common/RejectBadge";
import { SupplementBadge } from "@/components/common/SupplementBadge";
import { formatDateTime, formatNumber } from "@/utils/date";
import { REVIEW_STATUS_MAP, ROLE_MAP } from "@/utils/status";
import type { ReviewStatus } from "@/types";
import { cn } from "@/lib/utils";

export function ReviewList() {
  const navigate = useNavigate();
  const {
    reviews,
    fetchReviews,
    getFilteredReviews,
    setFilters,
    filters,
  } = useReviewStore();

  const [searchKeyword, setSearchKeyword] = useState(filters.keyword || "");

  useEffect(() => {
    if (reviews.length === 0) {
      fetchReviews();
    }
  }, [reviews.length, fetchReviews]);

  const filteredReviews = getFilteredReviews();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ keyword: searchKeyword });
  };

  const handleStatusFilter = (status: ReviewStatus | undefined) => {
    setFilters({ status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-navy-900">场次复盘</h1>
          <p className="text-gray-500 mt-1">查看和管理所有直播场次复盘记录</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索场次号、直播标题、主播名称..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusFilter(undefined)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md border transition-colors",
                  !filters.status
                    ? "bg-navy-600 text-white border-navy-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-navy-400"
                )}
              >
                全部
              </button>
              {(Object.keys(REVIEW_STATUS_MAP) as ReviewStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md border transition-colors",
                    filters.status === status
                      ? "bg-navy-600 text-white border-navy-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-navy-400"
                  )}
                >
                  {REVIEW_STATUS_MAP[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="text-sm text-gray-500">当前处理角色：</span>
            <select
              value={filters.currentHandler || ""}
              onChange={(e) =>
                setFilters({
                  currentHandler: (e.target.value as typeof filters.currentHandler) || undefined,
                })
              }
              className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-navy-500"
            >
              <option value="">全部</option>
              <option value="assistant">主播助理</option>
              <option value="controller">场控</option>
              <option value="aftersales">售后组长</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={filters.hasReject || false}
              onChange={(e) => setFilters({ hasReject: e.target.checked })}
              className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
            />
            仅显示已驳回
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={filters.hasSupplement || false}
              onChange={(e) => setFilters({ hasSupplement: e.target.checked })}
              className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
            />
            仅显示需补录
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">场次号</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">直播标题</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">主播</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">GMV</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">异常订单</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状态</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">当前处理</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">更新时间</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <FileText className="mx-auto mb-2 text-gray-300" size={32} />
                  暂无匹配的复盘记录
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  onClick={() => navigate(`/reviews/${review.id}`)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    review.rejectReason ? "bg-red-50/50" : "",
                    review.supplementRequired ? "bg-orange-50/50" : "",
                    "hover:bg-gray-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-navy-600">
                      {review.sessionNo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {review.liveTitle}
                      </span>
                      {review.isOverdue && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-status-error rounded">
                          超时
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {review.anchorName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    ¥{formatNumber(review.gmv)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {review.abnormalOrders.length} 单
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={review.status} type="review" />
                      {review.rejectReason && <RejectBadge />}
                      {review.supplementRequired && <SupplementBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={ROLE_MAP[review.currentHandler].color}>
                      {ROLE_MAP[review.currentHandler].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDateTime(review.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

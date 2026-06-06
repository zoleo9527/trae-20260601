import { RejectBadge } from "@/components/common/RejectBadge";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SupplementBadge } from "@/components/common/SupplementBadge";
import { cn } from "@/lib/utils";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";
import { formatDateTime, formatNumber } from "@/utils/date";
import { ROLE_MAP } from "@/utils/status";
import { AlertTriangle, ArrowRight, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const {
    fetchReviews,
    getTodayPending,
    getOverdue,
    getRecentlyRejected,
    setFilters,
    resetFilters,
  } = useReviewStore();

  const [todayPending, setTodayPending] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [recentlyRejected, setRecentlyRejected] = useState(0);
  const [quickList, setQuickList] = useState<ReturnType<typeof getTodayPending>>([]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const pending = getTodayPending(currentUser.role);
    const overdueList = getOverdue(currentUser.role);
    const rejected = getRecentlyRejected(currentUser.role);

    setTodayPending(pending.length);
    setOverdue(overdueList.length);
    setRecentlyRejected(rejected.length);
    setQuickList(pending.slice(0, 5));
  }, [getTodayPending, getOverdue, getRecentlyRejected, currentUser.role]);

  const handleCardClick = (filterType: "pending" | "overdue" | "rejected") => {
    resetFilters();
    if (filterType === "pending") {
      setFilters({
        todayUpdated: true,
        currentHandler: currentUser.role,
      });
    } else if (filterType === "overdue") {
      setFilters({
        isOverdue: true,
        currentHandler: currentUser.role,
      });
    } else if (filterType === "rejected") {
      setFilters({
        hasReject: true,
        hasSupplement: true,
        currentHandler: currentUser.role,
      });
    }
    navigate("/reviews");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 mb-1">工作台</h1>
        <p className="text-gray-500">欢迎回来，查看今日待处理事项</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard
          title="今日待处理"
          value={todayPending}
          icon={Clock}
          color="text-navy-600"
          bgColor="bg-navy-50"
          onClick={() => handleCardClick("pending")}
        />
        <StatCard
          title="超时未处理"
          value={overdue}
          icon={AlertTriangle}
          color="text-status-error"
          bgColor="bg-red-50"
          onClick={() => handleCardClick("overdue")}
        />
        <StatCard
          title="刚退回/需补录"
          value={recentlyRejected}
          icon={XCircle}
          color="text-status-warning"
          bgColor="bg-amber-50"
          onClick={() => handleCardClick("rejected")}
        />
      </div>

      <div className="bg-white rounded-lg border shadow-card">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-navy-900">待处理列表</h2>
          <button
            onClick={() => navigate("/reviews")}
            className="text-sm text-navy-600 hover:text-navy-700 flex items-center gap-1"
          >
            查看全部 <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y">
          {quickList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无待处理记录
            </div>
          ) : (
            quickList.map((review) => (
              <div
                key={review.id}
                onClick={() => navigate(`/reviews/${review.id}`)}
                className={cn(
                  "p-4 cursor-pointer transition-all border-l-4",
                  review.rejectReason
                    ? "bg-red-50/80 border-status-error hover:bg-red-100/80"
                    : review.supplementRequired
                    ? "bg-orange-50/80 border-status-warning hover:bg-orange-100/80"
                    : review.isOverdue
                    ? "bg-red-50/50 border-status-error hover:bg-red-100/50"
                    : "bg-white border-transparent hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-navy-600 font-semibold">
                      {review.sessionNo}
                    </span>
                    <span className="font-medium text-gray-900">
                      {review.liveTitle}
                    </span>
                    <StatusBadge status={review.status} type="review" />
                    {review.rejectReason && <RejectBadge reason={review.rejectReason} showReason />}
                    {review.supplementRequired && <SupplementBadge notes={review.supplementNotes} showNotes />}
                    {review.isOverdue && (
                      <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded font-medium flex items-center gap-1">
                        <AlertTriangle size={12} />
                        已超时
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400 whitespace-nowrap ml-2">
                    {formatDateTime(review.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                  <span>主播：{review.anchorName}</span>
                  <span>异常订单：<span className="font-medium text-navy-600">{review.abnormalOrders.length}</span> 单</span>
                  <span>GMV：¥{formatNumber(review.gmv)}</span>
                  <span>
                    当前处理：
                    <span className={cn("font-medium", ROLE_MAP[review.currentHandler].color)}>
                      {ROLE_MAP[review.currentHandler].label}
                    </span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

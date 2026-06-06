import { RejectBadge } from "@/components/common/RejectBadge";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SupplementBadge } from "@/components/common/SupplementBadge";
import { cn } from "@/lib/utils";
import { useReviewStore } from "@/store/useReviewStore";
import { formatDateTime, formatNumber } from "@/utils/date";
import { ROLE_MAP } from "@/utils/status";
import { AlertTriangle, Clock, FileText, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  const {
    reviews,
    fetchReviews,
    getTodayPending,
    getOverdue,
    getRecentlyRejected,
  } = useReviewStore();

  useEffect(() => {
    if (reviews.length === 0) {
      fetchReviews();
    }
  }, [reviews.length, fetchReviews]);

  const todayPending = getTodayPending();
  const overdue = getOverdue();
  const recentlyRejected = getRecentlyRejected();

  const quickList = [...todayPending]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-navy-900">工作台</h1>
        <p className="text-gray-500 mt-1">欢迎回来，查看今日待处理事项</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="今日待处理"
          value={todayPending.length}
          icon={Clock}
          color="amber"
          trend={12}
          onClick={() => navigate("/reviews?status=pending")}
        />
        <StatCard
          title="超时未处理"
          value={overdue.length}
          icon={AlertTriangle}
          color="red"
          trend={-5}
          onClick={() => navigate("/reviews?overdue=true")}
        />
        <StatCard
          title="刚退回/需补录"
          value={recentlyRejected.length}
          icon={XCircle}
          color="navy"
          trend={0}
          onClick={() => navigate("/reviews?status=rejected")}
        />
      </div>

      <div className="bg-white rounded-lg border shadow-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-navy-900 flex items-center gap-2">
            <FileText size={18} />
            待处理列表
          </h2>
          <button
            onClick={() => navigate("/reviews")}
            className="text-sm text-navy-600 hover:text-navy-800 font-medium"
          >
            查看全部 →
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
